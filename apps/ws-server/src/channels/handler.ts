/**
 * Vorebase Realtime — WebSocket Message Handler
 *
 * Processes incoming messages from WebSocket clients:
 * - subscribe: Subscribe to a channel (e.g., "public:posts")
 * - unsubscribe: Unsubscribe from a channel
 *
 * Sends acknowledgment messages back to the client.
 */

import type { WebSocket } from "ws";
import { channelManager } from "./manager.js";
import type { RealtimeEvent } from "@repo/common";
import { createLogger } from "@repo/common";

const logger = createLogger("ws-handler");

interface IncomingMessage {
  type: "subscribe" | "unsubscribe";
  channel: string;
  event?: RealtimeEvent | "*";
  filter?: string;
}

/**
 * Handle an incoming WebSocket message.
 */
export function handleMessage(
  clientId: string,
  ws: WebSocket,
  rawMessage: string
): void {
  let message: IncomingMessage;

  try {
    message = JSON.parse(rawMessage);
  } catch {
    sendError(ws, "Invalid JSON message");
    return;
  }

  if (!message.type || !message.channel) {
    sendError(ws, "Message must have 'type' and 'channel' fields");
    return;
  }

  switch (message.type) {
    case "subscribe": {
      const success = channelManager.subscribe(
        clientId,
        message.channel,
        message.event || "*",
        message.filter
      );

      if (success) {
        sendAck(ws, "subscribed", message.channel);
      } else {
        sendError(ws, `Failed to subscribe to ${message.channel}`);
      }
      break;
    }

    case "unsubscribe": {
      const success = channelManager.unsubscribe(clientId, message.channel);

      if (success) {
        sendAck(ws, "unsubscribed", message.channel);
      } else {
        sendError(ws, `Not subscribed to ${message.channel}`);
      }
      break;
    }

    default:
      sendError(ws, `Unknown message type: ${message.type}`);
  }
}

function sendAck(ws: WebSocket, type: string, channel: string): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(
      JSON.stringify({
        type,
        channel,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

function sendError(ws: WebSocket, message: string): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(
      JSON.stringify({
        type: "error",
        message,
        timestamp: new Date().toISOString(),
      })
    );
  }
}
