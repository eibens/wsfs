// You can connect a website to a watch-ws server. Replace `localhost:1234` with the `<hostname>:<port>` location where your server is running:
const ws = new WebSocket("ws://localhost:1234");

// The server sends messages encoded as JSON strings.
ws.addEventListener("message", function (event) {
  console.log("ws message");
  const message = JSON.parse(event.data);
  console.log(message);
});

// You may also want to handle events related to the WebSocket's lifecycle.
ws.addEventListener("open", function (event) {
  console.log("ws open");
  console.log(event);
});
ws.addEventListener("close", function (event) {
  console.log("ws closed");
  console.log(event);
});
ws.addEventListener("error", function (event) {
  console.log("ws error");
  console.log(event);
});
