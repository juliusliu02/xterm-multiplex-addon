import type { Handler, Disposable, MessageType } from "./types";

/**
 * Options for `Multiplexer.publish`.
 */
export type PublishOptions = {
  /**
   * Trailing-edge debounce window in milliseconds.
   * When set, only the latest payload within the window is sent.
   */
  debounce?: number;
};

/**
 * Routes typed binary frames over a single websocket connection.
 * Frame format: first byte is message type, remaining bytes are payload.
 */
export class Multiplexer {
  private handlers = new Map<MessageType, Set<Handler>>();
  private ws: WebSocket;
  private readonly onMessage: (e: MessageEvent) => void;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.binaryType = "arraybuffer";

    this.onMessage = (e) => {
      if (!(e.data instanceof ArrayBuffer)) return;

      const msg = new Uint8Array(e.data);
      if (msg.length === 0) return;

      const type = msg[0]!;
      const payload = msg.slice(1);

      const handlers = this.handlers.get(type);
      if (!handlers) return;

      for (const cb of [...handlers]) {
        cb(payload);
      }
    };

    this.ws.addEventListener("message", this.onMessage);
  }

  /**
   * Register a handler for one incoming message type.
   */
  handle(type: MessageType, handler: Handler): Disposable {
    let set = this.handlers.get(type);

    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }

    set.add(handler);

    return {
      dispose: () => set!.delete(handler),
    };
  }

  /**
   * Remove all handlers for one message type.
   */
  unhandle(type: MessageType): void {
    this.handlers.delete(type);
  }

  /**
   * Send a one-off message with prefixed byte.
   * @param type prefixed byte
   * @param payload encoded message
   */
  send(type: MessageType, payload: Uint8Array) {
    const frame = new Uint8Array(payload.length + 1);
    frame[0] = type;
    frame.set(payload, 1);
    this.ws.send(frame);
  }

  /**
   * Emit the payload received from an event.
   * @param type prefixed byte
   * @param attach function to subscribe to
   * @param options optional publish behavior such as trailing debounce
   */
  publish(
    type: MessageType,
    attach: (emit: (payload: Uint8Array) => void) => Disposable,
    options?: PublishOptions,
  ): Disposable {
    const debounce = options?.debounce;
    let timeout: number | undefined;

    const disposable = attach((payload) => {
      if (debounce === undefined) {
        this.send(type, payload);
        return;
      }

      if (timeout !== undefined) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        this.send(type, payload);
        timeout = undefined;
      }, debounce);
    });

    return {
      dispose: () => {
        if (timeout !== undefined) {
          clearTimeout(timeout);
          timeout = undefined;
        }
        disposable.dispose();
      },
    };
  }

  /**
   * Unsubscribe from websocket messages and clear all registered handlers.
   */
  dispose() {
    this.ws.removeEventListener("message", this.onMessage);
    this.handlers.clear();
  }
}

export default Multiplexer;
