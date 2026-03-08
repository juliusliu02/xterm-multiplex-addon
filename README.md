# xterm-multiplex-addon

`xterm-multiplex-addon` lets you exchange terminal stream data and control messages over a single `WebSocket`.

It provides:

- `Multiplexer`: a tiny byte-prefixed message multiplexer
- `MultiplexAddon`: an `@xterm/xterm` addon for terminal data I/O
- `createResizePublisher`: helper to publish terminal resize events

## Install

```bash
pnpm add xterm-multiplex-addon
# or npm i xterm-multiplex-addon
```

Peer expectation:

- Browser/runtime provides `WebSocket`
- For `MultiplexAddon`, you use `@xterm/xterm`

## Protocol

Each frame sent through `Multiplexer` is:

- Byte `0`: message type (`0-255`)
- Bytes `1..n`: payload (`Uint8Array`)

Example type mapping:

- `0`: terminal stream data
- `1`: resize event
- `2+`: custom control messages

## Quick Start

```ts
import { Terminal } from "@xterm/xterm";
import {
  Multiplexer,
  MultiplexAddon,
  createResizePublisher,
} from "xterm-multiplex-addon";

const ws = new WebSocket("wss://example.com/shell");
const term = new Terminal();
term.open(document.getElementById("terminal")!);

ws.addEventListener("open", () => {
  const multiplexer = new Multiplexer(ws);

  // Stream terminal data on channel 0.
  term.loadAddon(new MultiplexAddon(multiplexer, 0));

  // Send resize events on channel 1.
  const resizeDisposable = createResizePublisher(1)(term, multiplexer);

  // Optional: custom control channel.
  const decoder = new TextDecoder();
  const controlSub = multiplexer.handle(2, (payload) => {
    console.log("control:", decoder.decode(payload));
  });

  // Later cleanup:
  // controlSub.dispose();
  // resizeDisposable.dispose();
  // multiplexer.dispose();
});
```

## API

### `Multiplexer`

```ts
new Multiplexer(ws: WebSocket)
```

Creates a multiplexer over a single `WebSocket`.
Internally sets `ws.binaryType = "arraybuffer"` and listens for `message` events.

### `handle(type, handler)`

```ts
handle(type: number, handler: (payload: Uint8Array) => void): { dispose(): void }
```

Registers a handler for incoming payloads of `type`.
Returns a disposable for that specific handler.

### `unhandle(type)`

```ts
unhandle(type: number): void
```

Removes all handlers for `type`.

### `send(type, payload)`

```ts
send(type: number, payload: Uint8Array): void
```

Sends one framed message with the type prefix.

### `publish(type, attach)`

```ts
publish(
  type: number,
  attach: (emit: (payload: Uint8Array) => void) => { dispose(): void }
): { dispose(): void }
```

Utility to bridge an event source to `send(type, payload)`.

### `dispose()`

```ts
dispose(): void
```

Unsubscribes from websocket messages and clears handlers.

### `MultiplexAddon`

```ts
new MultiplexAddon(multiplexer: Multiplexer, streamDataType = 0)
```

`@xterm/xterm` addon that:

- sends `term.onData(...)` as UTF-8 bytes on `streamDataType`
- writes incoming payload from `streamDataType` to terminal (`term.write(payload)`)

Implements `ITerminalAddon`.

### `createResizePublisher`

```ts
createResizePublisher(type: number)
```

Returns a function:

```ts
(term: Terminal, multiplexer: Multiplexer) => { dispose(): void }
```

It publishes `term.onResize` events as a 4-byte payload:

- bytes `0-1`: `cols` (`uint16`)
- bytes `2-3`: `rows` (`uint16`)

All values are encoded with `DataView#setUint16` defaults (big-endian).

## Suggested Server-Side Decode

For resize channel payloads:

```ts
function decodeResize(payload: Uint8Array) {
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  return {
    cols: view.getUint16(0),
    rows: view.getUint16(2),
  };
}
```

For stream payloads (`streamDataType`), treat bytes as terminal input/output stream bytes.

## Lifecycle And Cleanup

Call `dispose()` on resources when done:

- `MultiplexAddon` (via terminal addon lifecycle or direct dispose)
- resize/control subscriptions returned by `publish`/`handle`
- `Multiplexer` when websocket session ends

## Development

```bash
pnpm install
pnpm run build
pnpm run lint
pnpm run test
```

## License

MIT
