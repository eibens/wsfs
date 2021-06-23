import * as wsfs from "./serve.ts";
import * as ecli from "https://deno.land/x/ecli@v0.4.2/mod.ts";
import { parse } from "https://deno.land/std@0.99.0/flags/mod.ts";
import docs from "./_docs.ts";

if (import.meta.main) {
  await cli();
}

export async function cli(process: ecli.Process = Deno) {
  const clients = new Set<unknown>();

  const start = ({ log }: ecli.Server) => {
    return wsfs.serve({
      ...parse(process.args),
      handle: (event) => {
        switch (event.type) {
          case "start": {
            log({
              type: event.type,
              text: event.server.url,
            });
            break;
          }
          case "stop": {
            log({
              type: event.type,
              text: event.server.url,
            });
            break;
          }
          case "error": {
            log({
              text: ecli.Blocks(
                event.error.message,
                String(event.error),
              ),
            });
            break;
          }
          case "connect": {
            clients.add(event.socket);
            log({
              type: event.type,
              text: clients.size + ` socket(s) open`,
            });
            break;
          }
          case "disconnect": {
            clients.delete(event.socket);
            log({
              type: event.type,
              text: clients.size + ` socket(s) open`,
            });
            break;
          }
          case "fs": {
            log({
              type: event.type,
              text: {
                commands: [],
                children: [
                  `${event.paths.length} (${event.kind}): ${
                    event.paths.join("\n")
                  }`,
                ],
              },
            });
            break;
          }
        }
      },
    });
  };

  await ecli.serve({
    start,
    process,
    docs,
  });
}
