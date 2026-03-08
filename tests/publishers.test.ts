import { describe, expect, it } from "vitest";
import { Multiplexer } from "../src/Multiplexer";
import { createResizePublisher } from "../src/publishers";
import { MockResizeTerminal, MockWebSocket } from "./fixtures/mocks";

describe("createResizePublisher", () => {
  it("publishes cols/rows as big-endian uint16 payload", () => {
    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);
    const term = new MockResizeTerminal();

    createResizePublisher(9)(term as never, multiplexer);
    term.emitResize(80, 24);

    expect(Array.from(ws.sentFrames[0]!)).toEqual([9, 0, 80, 0, 24]);
  });

  it("stops publishing after dispose", () => {
    const ws = new MockWebSocket();
    const multiplexer = new Multiplexer(ws as unknown as WebSocket);
    const term = new MockResizeTerminal();

    const disposable = createResizePublisher(9)(term as never, multiplexer);
    disposable.dispose();
    term.emitResize(120, 50);

    expect(ws.sentFrames).toHaveLength(0);
  });
});
