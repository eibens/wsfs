import { cli } from "./cli.ts";
import { assertMatch } from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { wait } from "./_utils.ts";

Deno.test("serve prints help text", async () => {
  let output = "";
  await cli({
    args: ["--help"],
    stdin: {
      read: (_: Uint8Array) => {
        return Promise.resolve(null);
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

Deno.test("serve runs server", async () => {
  let output = "";
  let done = false;
  await cli({
    args: [],
    stdin: {
      read: async (p: Uint8Array) => {
        if (done) return null;
        done = true;
        await wait(1000);
        p[0] = "q".charCodeAt(0);
        p[1] = "\n".charCodeAt(0);
        return 2;
      },
    },
    stdout: {
      write: (p: Uint8Array) => {
        output += new TextDecoder().decode(p);
        return Promise.resolve(p.byteLength);
      },
    },
  });
  assertMatch(output, /wsfs/);
});
