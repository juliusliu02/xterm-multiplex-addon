type Disposable = { dispose(): void };
type Handler = (payload: Uint8Array) => void;
type MessageType = number;

export class Multiplex {
  private disposables: Disposable[] = [];
  private handlers = new Map<MessageType, Handler>();
  private ws: WebSocket;
  private readonly onMessage: (e: MessageEvent) => void;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.binaryType = "arraybuffer";

    this.onMessage = (e) => {
      if (!(e.data instanceof ArrayBuffer)) return;

      const msg = new Uint8Array(e.data);
      if (msg.length === 0) return;

      const type = msg[0];
      const payload = msg.slice(1);

      this.handlers.get(type as number)?.(payload);
    };

    this.ws.addEventListener("message", this.onMessage);
  }

  handle(type: MessageType, handler: Handler) {
    this.handlers.set(type, handler);
  }

  unhandle(type: MessageType): void {
    this.handlers.delete(type);
  }

  /**
   * Send an one-off message with prefixed byte.
   * @param type prefixed byte
   * @param payload encoded message
   */
  send(type: number, payload: Uint8Array) {
    const frame = new Uint8Array(payload.length + 1);
    frame[0] = type;
    frame.set(payload, 1);
    this.ws.send(frame);
  }

  /**
   * Emit the payload received from an event.
   * @param type prefixed byte
   * @param attach function to subscribe to
   */
  publish(
    type: number,
    attach: (emit: (payload: Uint8Array) => void) => Disposable,
  ): void {
    const disposable = attach((payload) => this.send(type, payload));
    this.disposables.push(disposable);
  }

  dispose() {
    this.ws.removeEventListener("message", this.onMessage);
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
    this.handlers.clear();
  }
}
