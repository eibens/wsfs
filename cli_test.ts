import { main } from "./cli.ts";
import { assertMatch } from "https://deno.land/std@0.97.0/testing/asserts.ts";

Deno.test("CLI prints help text", async () => {
  let output = "";
  await main({
    args: ["--help"],
    stdin: {
      read: (p: Uint8Array) => {
        p[0] = "q".charCodeAt(0);
        return Promise.resolve(1);
      },
    },
    stdout: {
      write: (p: Uint8Array) => {
        output += new TextDecoder().decode(p);
        return Promise.resolve(p.byteLength);
      },
    },
  });

  assertMatch(output, /--allow-net/);
  assertMatch(output, /--allow-read/);
  assertMatch(output, /--help/);
  assertMatch(output, /--hostname/);
  assertMatch(output, /--port/);
  assertMatch(output, /--path/);
  assertMatch(output, /https:\/\/deno\.land\/x\/wsfs\/cli\.ts/);
  assertMatch(output, /https:\/\/github.com\/eibens\/wsfs/);
});
