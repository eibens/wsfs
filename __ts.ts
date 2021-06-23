import { Event, serve, ServeOptions } from "./serve.ts";

const options: ServeOptions = {
  // Default settings for starting the server at: ws://localhost:1234
  hostname: "localhost",
  port: 1234,

  // Specify the path to observe.
  path: ".",

  // Handle server events.
  handle: (e: Event) => console.log(e),
};

const server = serve(options);
await server.close();
