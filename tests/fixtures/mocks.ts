type MessageListener = (event: MessageEvent) => void;
type DataListener = (data: string) => void;
type ResizeListener = (size: { cols: number; rows: number }) => void;

export class MockWebSocket {
  public binaryType: BinaryType = "blob";
  public sentFrames: Uint8Array[] = [];
  private listeners = new Set<MessageListener>();

  addEventListener(type: "message", listener: MessageListener) {
    if (type === "message") this.listeners.add(listener);
  }

  removeEventListener(type: "message", listener: MessageListener) {
    if (type === "message") this.listeners.delete(listener);
  }

  send(data: Uint8Array) {
    this.sentFrames.push(new Uint8Array(data));
  }

  emitMessage(data: ArrayBuffer | string) {
    for (const listener of this.listeners) {
      listener({ data } as MessageEvent);
    }
  }
}

export class MockDataTerminal {
  public written: Uint8Array[] = [];
  private onDataListeners = new Set<DataListener>();

  onData(listener: DataListener) {
    this.onDataListeners.add(listener);
    return {
      dispose: () => this.onDataListeners.delete(listener),
    };
  }

  write(data: Uint8Array) {
    this.written.push(data);
  }

  emitData(data: string) {
    for (const listener of this.onDataListeners) {
      listener(data);
    }
  }
}

export class MockResizeTerminal {
  private resizeListeners = new Set<ResizeListener>();

  onResize(listener: ResizeListener) {
    this.resizeListeners.add(listener);
    return {
      dispose: () => this.resizeListeners.delete(listener),
    };
  }

  emitResize(cols: number, rows: number) {
    for (const listener of this.resizeListeners) {
      listener({ cols, rows });
    }
  }
}
