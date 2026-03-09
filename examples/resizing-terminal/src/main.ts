import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import {
  Multiplexer,
  MultiplexAddon,
  createResizePublisher,
} from "@juliusliu/xterm-multiplex-addon";

const STREAM_CHANNEL = 0;
const RESIZE_CHANNEL = 1;

const term = new Terminal({
  cursorBlink: true,
});

const fit = new FitAddon();
term.loadAddon(fit);
term.open(document.getElementById("terminal")!);
fit.fit();

const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3000/ws";
const ws = new WebSocket(wsUrl);
ws.addEventListener("open", () => {
  const multiplexer = new Multiplexer(ws);
  term.loadAddon(new MultiplexAddon(multiplexer, STREAM_CHANNEL));
  createResizePublisher(RESIZE_CHANNEL)(term, multiplexer);

  // Initial size
  multiplexer.send(
    RESIZE_CHANNEL,
    new Uint8Array([
      term.cols >> 8,
      term.cols & 0xff,
      term.rows >> 8,
      term.rows & 0xff,
    ]),
  );
});

window.addEventListener("resize", () => fit.fit());
