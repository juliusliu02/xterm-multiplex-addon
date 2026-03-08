import type { IDisposable, ITerminalAddon, Terminal } from "@xterm/xterm";
import { Multiplexer } from "./Multiplexer";

/**
 * xterm.js addon that bridges terminal stream I/O through a `Multiplexer` channel.
 */
export class MultiplexAddon implements ITerminalAddon {
  private disposables: IDisposable[] = [];

  /**
   * @param multiplexer multiplex transport instance
   * @param streamDataType type byte/channel used for terminal stream payloads
   */
  constructor(
    private multiplexer: Multiplexer,
    private readonly streamDataType: number = 0,
  ) {}

  /**
   * Attach outgoing `onData` and incoming `handle` subscriptions for stream I/O.
   */
  activate(term: Terminal) {
    const encoder = new TextEncoder();

    const subOutgoing = this.multiplexer.publish(this.streamDataType, (emit) =>
      term.onData((data) => {
        emit(encoder.encode(data));
      }),
    );
    this.disposables.push(subOutgoing);

    const subIncoming = this.multiplexer.handle(
      this.streamDataType,
      (payload) => {
        term.write(payload);
      },
    );
    this.disposables.push(subIncoming);
  }

  /**
   * Dispose all stream subscriptions created during activation.
   */
  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
  }
}

export default MultiplexAddon;
