# [wsfs]

> [wsfs] starts a WebSocket server (ws) that broadcasts file system (fs) events
> to its clients. It is implemented in TypeScript for [Deno].

[![deno.land mod](https://img.shields.io/badge/deno.land-wsfs-lightgrey.svg?logo=deno)](https://deno.land/x/wsfs)
[![deno.land doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/wsfs/mod.ts)
![tag](https://img.shields.io/github/v/tag/eibens/wsfs)
![MIT license](https://img.shields.io/github/license/eibens/wsfs)
![CI](https://github.com/eibens/wsfs/workflows/ci/badge.svg)
[![Code coverage](https://img.shields.io/codecov/c/github/eibens/wsfs)](https://codecov.io/gh/eibens/wsfs)

# Motivation

For developing websites or web-based applications, it can sometimes be useful if
one can use the web-browser to access information from a file system. For
example, an automatic reload can be triggered when source files change, or a
file listing can be updated when new files are added in a cloud storage app.
There is no native API that allows a web-browser to watch a file system. [wsfs]
implements a protocol for collecting and broadcasting that information to
clients. Building on the WebSocket protocol further guarantees that updates can
be delivered quickly and frequently.

# Scenarios

- You are developing a website in a source code editor. In order to see the
  changes, you have to manually reload the website in the web-browser. By
  running `wsfs` in the directory and listening to the WebSocket server in a
  `<script>` element, automatic reloads can be triggered after every change.
- You are deploying a web app that allows users to upload files to a shared
  folder. The users have to reload the file listing to see whether another user
  has changed the contents of the folder. By running `wsfs` on the server users
  can be notified automatically.

# Documentation

[wsfs] comes with a command-line interface defined in [cli.ts] and the
underlying TypeScript interface defined in [mod.ts]. The latter can be used for
integrating [wsfs] into TypeScript applications.

## [cli.ts]

The CLI serves as (1) a convenient way of using [wsfs] in practice, and (2) as
an application example for [mod.ts]. Usage and installation instructions can be
printed in a terminal with [deno]:

```sh
deno run https://deno.land/x/wsfs/cli.ts --help
```

## [mod.ts]

The `Server` function returns a `Server` object. If successful, it starts two
processes: (1) the WebSocket server and (2) the file watcher. Both can be shut
down with the `Server.close` function:

```ts
import { Server } from "https://deno.land/x/wsfs/mod.ts";

// Start server.
const server: Server = Server();

// Print server URL.
console.log(server.url);

// Shut down the server at some point.
await server.close();
```

An `Options` object can be specified to configure the server. All entries are
optional:

```ts
import { Event, Options } from "https://deno.land/x/wsfs/mod.ts";

const options: Options = {
  // Default settings for starting the server at: ws://localhost:1234
  hostname: "localhost",
  port: 1234,

  // Specify the path to observe.
  path: "some/path",

  // Handle server events.
  handle: (e: Event) => console.log(e),
};

const server = Server(options);
await server.close();
```

# That's it!

- Repository: [eibens/wsfs on GitHub].

[wsfs]: #
[eibens/wsfs on GitHub]: https://github.com/eibens/wsfs
[cli.ts]: cli.ts
[mod.ts]: mod.ts
[deno]: https://deno.land
