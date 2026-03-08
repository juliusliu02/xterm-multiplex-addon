import { describe, expect, it, vi } from "vitest";
import { Multiplexer } from "../src/Multiplexer";
import { MockWebSocket } from "./fixtures/mocks";

describe("Multiplexer", () => {
  it("sets websocket binaryType and dispatches payload by message type", () => {
    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);
    expect(ws.binaryType).toBe("arraybuffer");

    const handler = vi.fn();
    multiplexer.handle(7, handler);

    ws.emitMessage(new Uint8Array([7, 1, 2, 3]).buffer);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(Array.from(handler.mock.calls[0]![0] as Uint8Array)).toEqual([1, 2, 3]);
  });

  it("ignores non-binary, empty, and mismatched frames", () => {
    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);
    const handler = vi.fn();
    multiplexer.handle(1, handler);

    ws.emitMessage("text");
    ws.emitMessage(new Uint8Array([]).buffer);
    ws.emitMessage(new Uint8Array([2, 9]).buffer);

    expect(handler).not.toHaveBeenCalled();
  });

  it("sends frames with a type prefix", () => {
    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);

    multiplexer.send(3, new Uint8Array([9, 8]));

    expect(Array.from(ws.sentFrames[0]!)).toEqual([3, 9, 8]);
  });

  it("supports handler disposal and unhandle", () => {
    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);

    const a = vi.fn();
    const b = vi.fn();
    const disposable = multiplexer.handle(5, a);
    multiplexer.handle(5, b);

    disposable.dispose();
    ws.emitMessage(new Uint8Array([5, 1]).buffer);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);

    multiplexer.unhandle(5);
    ws.emitMessage(new Uint8Array([5, 2]).buffer);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("publish wires event emitters to send and respects disposer", () => {
    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);

    let emitRef: ((payload: Uint8Array) => void) | undefined;
    const dispose = vi.fn();
    const subscription = multiplexer.publish(4, (emit) => {
      emitRef = emit;
      return { dispose };
    });

    emitRef?.(new Uint8Array([1, 2]));
    subscription.dispose();

    expect(Array.from(ws.sentFrames[0]!)).toEqual([4, 1, 2]);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("publish supports trailing debounce", () => {
    vi.useFakeTimers();

    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);

    let emitRef: ((payload: Uint8Array) => void) | undefined;
    multiplexer.publish(
      8,
      (emit) => {
        emitRef = emit;
        return { dispose: () => {} };
      },
      { debounce: 50 },
    );

    emitRef?.(new Uint8Array([1]));
    emitRef?.(new Uint8Array([2]));
    vi.advanceTimersByTime(49);
    expect(ws.sentFrames).toHaveLength(0);

    vi.advanceTimersByTime(1);
    expect(ws.sentFrames).toHaveLength(1);
    expect(Array.from(ws.sentFrames[0]!)).toEqual([8, 2]);
    vi.useRealTimers();
  });

  it("publish debounce clears pending timer on dispose", () => {
    vi.useFakeTimers();

    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);

    let emitRef: ((payload: Uint8Array) => void) | undefined;
    const sub = multiplexer.publish(
      9,
      (emit) => {
        emitRef = emit;
        return { dispose: () => {} };
      },
      { debounce: 50 },
    );

    emitRef?.(new Uint8Array([7]));
    sub.dispose();
    vi.advanceTimersByTime(50);

    expect(ws.sentFrames).toHaveLength(0);
    vi.useRealTimers();
  });

  it("dispose unsubscribes message handling", () => {
    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);
    const handler = vi.fn();
    multiplexer.handle(6, handler);

    multiplexer.dispose();
    ws.emitMessage(new Uint8Array([6, 1]).buffer);

    expect(handler).not.toHaveBeenCalled();
  });
});
