import type { IDisposable, ITerminalAddon, Terminal } from "@xterm/xterm";
import { Multiplexer } from "./Multiplexer";

export class MultiplexAddon implements ITerminalAddon {
  private disposables: IDisposable[] = [];

  constructor(
    private multiplexer: Multiplexer,
    private readonly streamDataType: number = 0,
  ) {}

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

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
  }
}

export default MultiplexAddon;
