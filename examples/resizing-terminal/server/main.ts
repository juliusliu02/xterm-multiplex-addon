import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { Client } from "ssh2";
import type { ClientChannel } from "ssh2";
import "dotenv/config";

const STREAM_CHANNEL = 0;
const RESIZE_CHANNEL = 1;
const WS_PORT = Number(process.env.PORT || "3000");
const SSH_HOST = process.env.SSH_HOST || "localhost";
const SSH_PORT = Number(process.env.SSH_PORT || "2222");
const SSH_USER = process.env.SSH_USER || "user";
const SSH_PASS = process.env.SSH_PASS || "password";

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    let ssh: Client | null = null;
    let stream: ClientChannel | null = null;

    return {
      onOpen(_, ws) {
        ssh = new Client();

        ssh.on("ready", () => {
          ssh!.shell(
            {
              term: "xterm-256color",
              cols: 80,
              rows: 24,
            },
            (err, s) => {
              if (err) return;

              stream = s;
              stream.on("data", (data: Buffer) => {
                const frame = new Uint8Array(1 + data.length);
                frame[0] = STREAM_CHANNEL;
                frame.set(data, 1);
                ws.send(frame);
              });

              stream.on("close", () => {
                ssh?.end();
              });
            },
          );
        });

        console.log("connecting");

        ssh.connect({
          host: SSH_HOST,
          port: SSH_PORT,
          username: SSH_USER,
          password: SSH_PASS,
        });
      },

      onMessage(event, ws) {
        if (!stream) return;
        if (!(event.data instanceof ArrayBuffer)) return;

        const frame = new Uint8Array(event.data);
        if (frame.length === 0) return;
        const type = frame[0];
        const payload = frame.slice(1);

        if (type === STREAM_CHANNEL) {
          stream.write(payload);
        }

        if (type === RESIZE_CHANNEL && payload.length >= 4) {
          const view = new DataView(
            payload.buffer,
            payload.byteOffset,
            payload.byteLength,
          );
          const cols = view.getUint16(0);
          const rows = view.getUint16(2);
          console.info(`resized to ${cols}*${rows} `);

          stream.setWindow(rows, cols, 0, 0);
        }
      },

      onClose() {
        ssh?.end();
      },
    };
  }),
);

const server = serve({
  fetch: app.fetch,
  port: WS_PORT,
});
injectWebSocket(server);

console.log(`ws server running on http://localhost:${WS_PORT}/ws`);
