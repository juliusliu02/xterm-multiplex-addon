import type { Terminal } from "@xterm/xterm";
import type { Multiplexer } from "./Multiplexer";
import { Disposable } from "./types";

/**
 * Create a resize-event publisher bound to one multiplex channel.
 *
 * Payload format (4 bytes, big-endian):
 * - bytes 0-1: cols (uint16)
 * - bytes 2-3: rows (uint16)
 */
export function createResizePublisher(
  type: number,
): (term: Terminal, multiplexer: Multiplexer) => Disposable {
  return (term: Terminal, multiplexer: Multiplexer) =>
    multiplexer.publish(type, (emit) =>
      term.onResize(({ cols, rows }) => {
        const buf = new ArrayBuffer(4);
        const view = new DataView(buf);

        view.setUint16(0, cols);
        view.setUint16(2, rows);

        emit(new Uint8Array(buf));
      }),
    );
}
