import { assertEquals } from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { Event, serve } from "./serve.ts";
import { wait } from "./_utils.ts";
Deno.test("Server starts and closes without issues", async () => {
  const server = serve();
  await server.close();
});

Deno.test("Server returns correct URL", async () => {
  const server = serve({
    hostname: "127.0.0.1",
    port: 4321,
  });
  await server.close();
  assertEquals(server.url, "ws://127.0.0.1:4321");
});

Deno.test("Server emits start and stop event", async () => {
  const events: Event[] = [];
  const server = serve({
    handle: events.push.bind(events),
  });
  await server.close();
  assertEquals(events[0].type, "start");
  assertEquals(events[1].type, "stop");
});

Deno.test("serve emits file creation event", async () => {
  // Path
  const tmp = await Deno.makeTempDir();
  const path = tmp + "/test.txt";

  const events: Event[] = [];
  const server = serve({
    path: tmp,
    handle: events.push.bind(events),
  });

  // Create file.
  await Deno.writeTextFile(path, "foo");

  // NOTE: I am not yet sure how short this can be or whether we need a delay at all.
  await wait(1000);

  // Close
  await server.close();

  const e = events[1];
  assertEquals(e.type, "fs");
  if (e.type === "fs") {
    assertEquals(e.paths, [path]);
    assertEquals(e.kind, "create");
  }
});
