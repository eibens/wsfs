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
export type Options = {
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
};

/**
 * Defines an object that can be used to interact with the server.
 */
export type Server = {
  /**
   * The WebSocket URL under which the server is listening for connections.
   */
  url: string;

  /**
   * The complete server options.
   */
  options: Required<Options>;

  /**
   * A function that closes the server and disposes all resources.
   */
  close: () => Promise<void>;
};

/**
 * Defines lifecycle events emitted by the server.
 */
export type Event =
  | { type: "start"; url: string }
  | { type: "connect"; count: number }
  | { type: "disconnect"; count: number }
  | { type: "stop" }
  | ({ type: "fs" } & Deno.FsEvent)
  | { type: "error"; error: Error };

/**
 * Starts the file watcher and WebSocket server.
 *
 * @param opts are the server options.
 * @returns the corresponding server object.
 */
export function Server(opts: Options = {}): Server {
  const options = Options(opts);
  const dispatch = Dispatcher(options);

  const server = listenWebSocket({
    ...options,
    dispatch,
  });

  const watcher = listenFiles({
    ...options,
    handle: (e) => {
      dispatch("fs", e);
      server.send(e);
      return Promise.resolve();
    },
  });

  const url = `ws://${options.hostname}:${options.port}`;
  dispatch("start", { url });
  return {
    options,
    url,
    close: async () => {
      await Promise.all([
        watcher.close(),
        server.close(),
      ]);
      dispatch("stop", {});
    },
  };
}

/**
 * Creates server options with default settings.
 *
 * @param opts is an options object.
 * @returns an options object where all fields are set.
 */
function Options(opts: Options): Required<Options> {
  return {
    hostname: "localhost",
    port: 1234,
    path: ".",
    handle: (event) => {
      if (event.type === "error") {
        throw event.error;
      }
    },
    ...opts,
  };
}

/**
 * Defines a simple API for dispatching a new server lifecycle event.
 *
 * @param type is the type of the event that should be dispatched.
 * @param data are the properties of the event, except for its type.
 */
type Dispatcher = <E extends Event>(
  type: E["type"],
  data: Omit<E, "type">,
) => void;

/**
 * Creates a dispatcher.
 *
 * @param options are a subset of the server options.
 * @returns the dispatcher.
 */
function Dispatcher(options: {
  handle: (e: Event) => void;
}): Dispatcher {
  return (type, data) => {
    options.handle({
      type,
      ...data,
    } as Event);
  };
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

  const closer = safeguard(async () => {
    // FIXME: I am not quite sure what `return` does. I am using it to cancel the async iterator and it seems to work, but maybe this is not correct.
    if (files.return) await files.return();
  });

  return { close: closer.run };
}

function listenWebSocket(options: {
  hostname?: string;
  port: number;
  dispatch: Dispatcher;
}) {
  const server = serveHttp(options);
  const sockets = new Set<WebSocket>();

  // Start accepting HTTP requests.
  (async () => {
    for await (const request of server) {
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
          options.dispatch("connect", { count: sockets.size });

          // Wait for close event.
          // NOTE: For now we ignore all other events.
          try {
            for await (const event of ws) {
              if (isWebSocketCloseEvent(event)) {
                sockets.delete(ws);
                options.dispatch("disconnect", { count: sockets.size });
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
          options.dispatch("error", { error });
        }
      })();
    }
  })();

  const closer = safeguard(async () => {
    // NOTE: Close the sockets before closing the server, otherwise a `BadResource: Bad resource ID` error will be thrown.
    await Promise.all(Array.from(sockets).map((ws) => ws.close()));

    // Stop listening for new connections.
    server.close();
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
