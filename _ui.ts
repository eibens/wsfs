import { Command, Node } from "https://deno.land/x/ansiml@v0.0.3/mod.ts";
import emoji from "./_emoji.ts";

// Documents

export function StartHeader(): Node {
  return Layout("sections", [
    TitleSection(),
    Layout("blocks", [
      Heading(emoji.bell, "Server Events"),
      "",
    ]),
  ]);
}

export function StartFooter(): Node {
  return Layout("sections", [
    Layout("blocks", [
      "",
      Heading(emoji.checkMarkButton, "Server stopped"),
      "",
    ]),
  ]);
}

export function HelpPage(): Node {
  return Layout("sections", [
    TitleSection(),
    UsageSection(),
    PermissionsSection(),
    OptionsSection(),
    LinksSection(),
    "",
  ]);
}

export function TitleSection(): Node {
  return Layout("blocks", [
    Heading(emoji.megaphone, "wsfs"),
    "Starts a WebSocket server that broadcasts file system events to clients.",
  ]);
}

export function UsageSection(): Node {
  const wsfsUrl = "https://deno.land/x/wsfs/cli.ts";
  return Layout("blocks", [
    Heading(emoji.questionMark, "Usage"),
    Def(
      CommandLine("wsfs", Opt("options")),
      "Run from the command line.",
    ),
    Def(
      CommandLine(
        "deno",
        "run",
        Opt("permissions"),
        Url(wsfsUrl),
        Opt("options"),
      ),
      "Run from URL with Deno.",
    ),
    Def(
      CommandLine("deno", "install", Opt("permissions"), Url(wsfsUrl)),
      "Install command line utility with Deno.",
    ),
  ]);
}

export function PermissionsSection(): Node {
  return Layout("blocks", [
    Heading(emoji.alert, "Permissions"),
    Def(
      CodeLine("--allow-net", Opt("=", Arg("hostname"), ":", Arg("port"))),
      Seq(
        "Allow running the websocket server at ",
        Url("ws://<hostname>:<port>"),
        ".",
      ),
    ),
    Def(
      CodeLine("--allow-read", Opt("=", Arg("path"))),
      "Allow watching the path for changes.",
    ),
  ]);
}

export function LinksSection(): Node {
  return Layout("blocks", [
    Heading(emoji.globeWithMeridians, "Links"),
    Def(
      Url("https://github.com/eibens/wsfs"),
      "Source code repository on GitHub.",
    ),
  ]);
}

export function OptionsSection(): Node {
  return Layout("blocks", [
    Heading(emoji.tools, "Options"),
    Def(
      CodeLine("--help"),
      "Show this help text without starting the server.",
    ),
    Def(
      CodeLine("--hostname=", Arg("hostname")),
      "The hostname for the web-socket server (defaults to `localhost`).",
    ),
    Def(
      CodeLine("--port=", Arg("port")),
      "The port number for the web-socket server (defaults to `1234`).",
    ),
    Def(
      CodeLine("--path=", Arg("path")),
      "The path that should be observed by the file watcher (defaults to `.`).",
    ),
  ]);
}

export function HintSection(): Node {
  return Layout("blocks", [
    Heading(emoji.info, "Hints"),
    Layout("blocks", [
      Def(
        Layout("words", [Kbd("q"), Kbd("Enter")]),
        "Stop server and quit.",
      ),
      Def(
        CommandLine("wsfs", "--help"),
        "Show further instructions.",
      ),
    ]),
  ]);
}

// Components

export function Def(head: Node, doc: Node) {
  return Layout("lines", [head, Indent(doc)]);
}

export function Heading(icon: Node, ...children: Node[]): Node {
  return Layout("words", [icon, {
    commands: [["bold"]],
    children,
  }]);
}

export function CommandLine(bin: string, ...args: Node[]): Node {
  return CodeLine(Layout("words", [
    {
      commands: [["gray"]],
      children: ["$"],
    },
    {
      commands: [["bold"]],
      children: [bin],
    },
    ...args,
  ]));
}

export function EventItem(type: Event["type"], msg: Node = ""): Node {
  return Layout("words", [
    EventType(type),
    msg,
    "\n",
  ]);
}

export function EventType(type: Event["type"]): Node {
  const colors: Record<Event["type"], Command> = {
    error: ["red"],
    connect: ["cyan"],
    disconnect: ["magenta"],
    start: ["cyan"],
    stop: ["magenta"],
    fs: ["yellow"],
  };
  return {
    commands: [["gray"]],
    children: [
      Surround(["[", "]"], [{
        commands: [colors[type]],
        children: [type],
      }]),
    ],
  };
}

export function Layout(
  type: "blocks" | "sections" | "lines" | "words",
  children: Node[],
): Node {
  const sep: Node = {
    words: " ",
    lines: "\n",
    blocks: "\n\n",
    sections: "\n\n\n",
  }[type];
  return Intersperse(sep, children);
}

export function CodeLine(...children: Node[]) {
  return Code(Surround([" "], children));
}

export function Indent(...children: Node[]) {
  return Seq("\t", ...children);
}

// Inline

export function Kbd(name: string): Node {
  return {
    commands: [["bold"], ["bgBrightBlack"], ["white"]],
    children: [Surround([" "], [name])],
  };
}

export function Arg(...children: Node[]): Node {
  return {
    commands: [["italic"]],
    children: [Surround(["<", ">"], children)],
  };
}

export function Opt(...children: Node[]): Node {
  return {
    commands: [["italic"], ["gray"]],
    children: [Surround(["[", "]"], children)],
  };
}

export function Url(...children: Node[]): Node {
  return {
    commands: [["blue"], ["underline"]],
    children,
  };
}

export function Code(...children: Node[]): Node {
  return {
    commands: [["bgBlack"], ["white"]],
    children,
  };
}

// Utility

export function Surround([left, right]: Node[], children: Node[]): Node {
  if (!right) right = left;
  return Seq(left, ...children, right);
}

export function Intersperse(sep: Node, children: Node[]): Node {
  return Seq(...children.flatMap((x) => [sep, x]).slice(1));
}

export function Seq(...children: Node[]): Node {
  return {
    commands: [],
    children,
  };
}
