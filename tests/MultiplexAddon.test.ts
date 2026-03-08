import { describe, expect, it } from "vitest";
import { MultiplexAddon } from "../src/MultiplexAddon";
import { Multiplexer } from "../src/Multiplexer";
import { MockDataTerminal, MockWebSocket } from "./fixtures/mocks";

describe("MultiplexAddon", () => {
  it("bridges terminal data to websocket and websocket payload to terminal", () => {
    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);
    const addon = new MultiplexAddon(multiplexer, 2);
    const term = new MockDataTerminal();

    addon.activate(term as never);
    term.emitData("A");

    expect(Array.from(ws.sentFrames[0]!)).toEqual([2, 65]);

    ws.emitMessage(new Uint8Array([2, 66, 67]).buffer);
    expect(term.written).toHaveLength(1);
    expect(Array.from(term.written[0]!)).toEqual([66, 67]);
  });

  it("stops forwarding after dispose", () => {
    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);
    const addon = new MultiplexAddon(multiplexer, 0);
    const term = new MockDataTerminal();

    addon.activate(term as never);
    addon.dispose();

    term.emitData("X");
    ws.emitMessage(new Uint8Array([0, 90]).buffer);

    expect(ws.sentFrames).toHaveLength(0);
    expect(term.written).toHaveLength(0);
  });

  it("can be disposed multiple times safely", () => {
    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);
    const addon = new MultiplexAddon(multiplexer, 0);
    const term = new MockDataTerminal();

    addon.activate(term as never);
    expect(() => {
      addon.dispose();
      addon.dispose();
    }).not.toThrow();
  });
});
