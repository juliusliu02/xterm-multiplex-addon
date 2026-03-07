import type { ITerminalAddon, Terminal } from "@xterm/xterm";
import { Multiplex } from "./Multiplex";

export class MultiplexTerminalAddon implements ITerminalAddon {
  constructor(private multiplex: Multiplex) {}

  activate(term: Terminal) {
    this.multiplex.publish(0, (emit) =>
      term.onData((data) => {
        emit(new TextEncoder().encode(data));
      })
    );

    this.multiplex.handle(0, (payload) => {
      term.write(payload);
    });
  }

  dispose() {}
}