import { assertEquals } from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { Event, Server } from "./mod.ts";

function wait() {
  // NOTE: I am not yet sure how short this can be or whether we need a delay at all.
  const time = 1000;
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

Deno.test("Server starts and closes without issues", async () => {
  const server = Server();
  await server.close();
});

Deno.test("Server returns correct URL", async () => {
  const server = Server({
    hostname: "127.0.0.1",
    port: 4321,
  });
  await server.close();
  assertEquals(server.url, "ws://127.0.0.1:4321");
});

Deno.test("Server emits start event", async () => {
  const events: Event[] = [];
  const server = Server({
    handle: events.push.bind(events),
  });
  await server.close();
  assertEquals(events[0], {
    type: "start",
    url: "ws://localhost:1234",
  });
});

Deno.test("Server emits stop event", async () => {
  const events: Event[] = [];
  const server = Server({
    handle: events.push.bind(events),
  });
  await server.close();
  assertEquals(events[1], {
    type: "stop",
  });
});

Deno.test("serve emits file creation event", async () => {
  // Path
  const tmp = await Deno.makeTempDir();
  const path = tmp + "/test.txt";

  const events: Event[] = [];
  const server = Server({
    path: tmp,
    handle: events.push.bind(events),
  });

  // Create file.
  await Deno.writeTextFile(path, "foo");

  // Close
  await wait();
  await server.close();

  assertEquals(events[1], {
    type: "fs",
    kind: "create",
    paths: [path],
  });
});
/*
Deno.test("serve emits event on file change", async () => {
  const tmp = await Deno.makeTempDir();
  const events: Event[] = [];
  const server = serve({
    path: tmp,
    handle: (e) => {
      console.log(e);
    },
  });
  await Deno.writeTextFile(tmp + "/test.txt", "foo");
  await wait();
  await server.close();
  assertEquals(events, []);
});
*/
