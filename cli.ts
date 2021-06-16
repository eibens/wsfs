import { Event, Options, Server } from "./mod.ts";
import { parse } from "https://deno.land/std@0.95.0/flags/mod.ts";
import { readLines } from "https://deno.land/std@0.97.0/io/mod.ts";
import { Node, stringify } from "https://deno.land/x/ansiml@v0.0.2/mod.ts";
import {
  EventItem,
  HelpPage,
  HintSection,
  Layout,
  StartFooter,
  StartHeader,
  Url,
} from "./_ui.ts";
if (import.meta.main) {
  await main(Deno);
}

export async function main(opts: {
  args: string[];
  stdout: Deno.Writer;
  stdin: Deno.Reader;
}) {
  const log = async (node: Node) => {
    const text = stringify(node);
    const buffer = new TextEncoder().encode(text);
    await opts.stdout.write(buffer);
  };

  // Parse CLI arguments.
  const args = parse(opts.args);

  // Early exit with help text if 'help' option is specified.
  if (args.help) {
    await log(HelpPage());
    return;
  }

  log(StartHeader());

  // Start the server.
  const server = Server({
    ...args as Partial<Options>,

    // Log events to the console.
    handle: (event: Event) => {
      switch (event.type) {
        case "start": {
          return log(EventItem(event.type, Url(event.url)));
        }
        case "error": {
          log(EventItem(event.type, event.error.message));
          return log(String(event.error));
        }
        case "stop": {
          return log(EventItem(event.type));
        }
        case "connect":
        case "disconnect": {
          return log(EventItem(event.type, event.count + ` socket(s) open`));
        }
        case "fs": {
          return log(
            EventItem(
              event.type,
              `${event.kind} ${event.paths.length} path(s)`,
            ),
          );
        }
      }
    },
  });

  // Wait for shutdown message.
  for await (const line of readLines(opts.stdin)) {
    if (line === "q") {
      await server.close();
      log(StartFooter());
      break;
    } else {
      log(Layout("sections", [HintSection(), ""]));
    }
  }
}
