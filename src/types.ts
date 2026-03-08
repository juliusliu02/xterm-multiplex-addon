export type Disposable = { dispose(): void };
export type Handler = (payload: Uint8Array) => void;
export type MessageType = number;
