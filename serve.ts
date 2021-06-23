import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
} from "https://deno.land/std@0.95.0/ws/mod.ts";

// NOTE: Once WebSocket support works with `Deno.listen` or `Deno.listenHttp`, we can use these native APIs. For now I only know how to use WebSockets with the `std/http` interface.
import { serve as serveHttp } from "https://deno.land/std@0.95.0/http/mod.ts";

/**
 * Defines the options for the server.
 */
export type ServeOptions = Readonly<{
  /**
   * The port for accepting new connections.
   */
  port?: number;

  /**
   * The hostname for accepting new connections.
   */
  hostname?: string;

  /**
   * The path that is watched for file system events.
   */
  path?: string;

  /**
   * A function that receives server lifecycle events.
   */
  handle?: (event: Event) => void;
}>;

/**
 * Defines an object that can be used to interact with the server.
 */
export type Server = Readonly<{
  /**
   * The WebSocket URL under which the server is listening for connections.
   */
  url: string;

  /**
   * The complete server options.
   */
  options: Readonly<Required<ServeOptions>>;

  /**
   * A function that closes the server and disposes all resources.
   */
  close: () => Promise<void>;
}>;

/**
 * Defines lifecycle events emitted by the server.
 */
export type Event =
  & {
    server: Server;
  }
  & (
    | { type: "start" }
    | { type: "stop" }
    | { type: "connect"; socket: WebSocket }
    | { type: "disconnect"; socket: WebSocket }
    | ({ type: "fs" } & Deno.FsEvent)
    | { type: "error"; error: Error }
  );

/**
 * Starts the file watcher and WebSocket server.
 *
 * @param opts are the server options.
 * @returns the corresponding server object.
 */
export function serve(options: ServeOptions = {}): Server {
  // Get default options.
  const _options: Required<ServeOptions> = {
    hostname: "localhost",
    port: 1234,
    path: ".",
    handle: (event) => {
      if (event.type === "error") {
        throw event.error;
      }
    },
    ...options,
  };

  // Create the server API.
  const server: Server = {
    options: _options,
    url: `ws://${_options.hostname}:${_options.port}`,
    close: async () => {
      await Promise.all([
        fs.close(),
        ws.close(),
      ]);
      server.options.handle({ server, type: "stop" });
    },
  };

  // Start WebSocket server and link it to file watcher.
  const ws = listenWebSocket(server);
  const fs = listenFiles({
    path: server.options.path,
    handle: (e) => {
      server.options.handle({ server, type: "fs", ...e });
      ws.send(e);
      return Promise.resolve();
    },
  });

  server.options.handle({ server, type: "start" });
  return server;
}

function listenFiles(options: {
  path: string;
  handle: (data: Deno.FsEvent) => Promise<void>;
}) {
  const files = Deno.watchFs(options.path, {
    recursive: true,
  });

  (async () => {
    for await (const data of files) {
      options.handle(data);
    }
  })();

  const closer = safeguard(() => {
    files.close();
    return Promise.resolve();
  });

  return { close: closer.run };
}

function listenWebSocket(server: Server) {
  const listener = serveHttp(server.options);
  const sockets = new Set<WebSocket>();

  // Start accepting HTTP requests.
  (async () => {
    for await (const request of listener) {
      (async () => {
        try {
          // Use this slightly inconvenient native API to upgrade the connection.
          const { conn, r: bufReader, w: bufWriter, headers } = request;
          const ws = await acceptWebSocket({
            conn,
            bufReader,
            bufWriter,
            headers,
          });

          // Add new connection.
          sockets.add(ws);
          server.options.handle({ server, type: "connect", socket: ws });

          // Wait for close event.
          // NOTE: For now we ignore all other events.
          try {
            for await (const event of ws) {
              if (isWebSocketCloseEvent(event)) {
                sockets.delete(ws);
                server.options.handle({
                  server,
                  type: "disconnect",
                  socket: ws,
                });
                break;
              }
            }
          } catch (error) {
            if (error.message === "Socket has already been closed") {
              // NOTE: This error occurs when we close the WebSockets manually on the server side.
            } else {
              throw error;
            }
          }
        } catch (error) {
          server.options.handle({ server, type: "error", error });
        }
      })();
    }
  })();

  const closer = safeguard(async () => {
    // NOTE: Close the sockets before closing the server, otherwise a `BadResource: Bad resource ID` error will be thrown.
    await Promise.all(Array.from(sockets).map((ws) => ws.close()));

    // Stop listening for new connections.
    listener.close();
  });

  return {
    close: closer.run,
    send: (event: Deno.FsEvent) => {
      if (closer.hasRun) throw new Error("Server is already closed.");
      const data = JSON.stringify(event);
      sockets.forEach((ws) => {
        ws.send(data);
      });
      return Promise.resolve();
    },
  };
}

/**
 * Wraps a function in a structure that ensures it is only called once.
 *
 * @param f is the function that should be wrapped.
 * @returns is a structure for managing the function call.
 */
function safeguard(f: () => Promise<void>) {
  let done = false;
  return {
    get hasRun() {
      return done;
    },
    run: async () => {
      if (done) {
        throw new Error("Trying to execute.");
      }
      done = true;
      await f();
    },
  };
}
