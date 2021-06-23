import * as ecli from "https://deno.land/x/ecli@v0.4.2/mod.ts";

export default {
  header: {
    name: "wsfs",
    icon: ecli.Emoji("megaphone"),
    description:
      "Start a WebSocket server that broadcasts file system events to clients.",
  },
  usage: {
    binary: "wsfs",
    module: "https://deno.land/x/wsfs/cli.ts",
    args: ecli.Optional("options"),
    permissions: true,
  },
  permissions: {
    items: [{
      name: "net",
      value: "<hostname>:<port>",
      text: ecli.Sequence(
        "Allow running the websocket server at ",
        ecli.Url("ws://<hostname>:<port>"),
        ".",
      ),
    }, {
      name: "read",
      value: "<path>",
      text: ecli.Sequence(
        "Allow watching the ",
        ecli.Url("<path>"),
        " for changes.",
      ),
    }],
  },
  options: {
    items: [{
      type: "flag",
      name: "help",
      alias: "h",
      text: "Show this help text and do nothing else.",
    }, {
      type: "param",
      name: "hostname",
      text: "The hostname for the web-socket server (defaults to `localhost`).",
    }, {
      type: "param",
      name: "port",
      text: "The port number for the web-socket server (defaults to `1234`).",
    }, {
      type: "param",
      name: "path",
      text:
        "The path that should be observed by the file watcher (defaults to `.`).",
    }],
  },
  links: {
    items: [{
      url: "https://github.com/eibens/wsfs",
      text: "Source code on GitHub.",
    }],
  },
} as ecli.Docs;
