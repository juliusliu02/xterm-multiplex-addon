/**
 * Minimal disposable contract used across subscriptions in this package.
 */
export type Disposable = { dispose(): void };

/**
 * Callback for handling payload bytes of one multiplexed message type.
 */
export type Handler = (payload: Uint8Array) => void;

/**
 * One-byte channel discriminator used in framed websocket messages.
 */
export type MessageType = number;
