/**
 * Vorebase Realtime — Channel Subscription Manager
 *
 * Tracks which WebSocket clients are subscribed to which channels.
 * A "channel" is a combination of schema:table, e.g., "public:posts".
 *
 * When a database change event occurs, the manager finds all
 * clients subscribed to that channel and sends them the event.
 */

import type { WebSocket } from "ws";
import type { RealtimeEvent } from "@repo/common";
import { createLogger } from "@repo/common";

const logger = createLogger("channel-manager");

export interface Subscription {
  /** The channel pattern, e.g., "public:posts" */
  channel: string;
  /** Which events to receive: INSERT, UPDATE, DELETE, or * for all */
  event: RealtimeEvent | "*";
  /** Optional filter, e.g., "user_id=eq.abc123" */
  filter?: string;
  /** The project this subscription belongs to */
  projectId: string;
}

export interface ClientInfo {
  /** The WebSocket connection */
  ws: WebSocket;
  /** The authenticated user's ID (from JWT) */
  userId: string;
  /** The user's role */
  role: string;
  /** Project ID from JWT */
  projectId: string;
  /** Active subscriptions for this client */
  subscriptions: Map<string, Subscription>;
}

class ChannelManager {
  /** All connected clients, keyed by a unique client ID */
  private clients = new Map<string, ClientInfo>();

  /** Counter for generating unique client IDs */
  private nextId = 1;

  /**
   * Register a new WebSocket client.
   * @returns The client ID
   */
  addClient(
    ws: WebSocket,
    userId: string,
    role: string,
    projectId: string
  ): string {
    const clientId = `client_${this.nextId++}`;

    this.clients.set(clientId, {
      ws,
      userId,
      role,
      projectId,
      subscriptions: new Map(),
    });

    logger.info(
      { clientId, userId, projectId },
      "Client connected"
    );

    return clientId;
  }

  /**
   * Remove a client and all its subscriptions.
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.clear();
      this.clients.delete(clientId);
      logger.info({ clientId }, "Client disconnected");
    }
  }

  /**
   * Subscribe a client to a channel.
   */
  subscribe(
    clientId: string,
    channel: string,
    event: RealtimeEvent | "*" = "*",
    filter?: string
  ): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    const sub: Subscription = {
      channel,
      event,
      filter,
      projectId: client.projectId,
    };

    client.subscriptions.set(channel, sub);

    logger.info(
      { clientId, channel, event },
      "Client subscribed"
    );

    return true;
  }

  /**
   * Unsubscribe a client from a channel.
   */
  unsubscribe(clientId: string, channel: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    const removed = client.subscriptions.delete(channel);

    if (removed) {
      logger.info({ clientId, channel }, "Client unsubscribed");
    }

    return removed;
  }

  /**
   * Broadcast a change event to all clients subscribed to the
   * relevant channel.
   *
   * @param projectId - The project where the change occurred
   * @param tableName - The table that changed
   * @param event - INSERT, UPDATE, or DELETE
   * @param payload - The change data (new and old row)
   */
  broadcast(
    projectId: string,
    tableName: string,
    event: RealtimeEvent,
    payload: { new: Record<string, unknown> | null; old: Record<string, unknown> | null }
  ): number {
    const channel = `public:${tableName}`;
    let sentCount = 0;

    for (const [clientId, client] of this.clients) {
      // Only send to clients in the same project
      if (client.projectId !== projectId) continue;

      for (const [, sub] of client.subscriptions) {
        // Match channel
        if (sub.channel !== channel && sub.channel !== `public:*`) continue;

        // Match event
        if (sub.event !== "*" && sub.event !== event) continue;

        // Send the event
        try {
          const message = JSON.stringify({
            type: "postgres_changes", // Named for Supabase API compatibility
            channel: sub.channel,
            event,
            payload: {
              new: payload.new,
              old: payload.old,
            },
          });

          if (client.ws.readyState === client.ws.OPEN) {
            client.ws.send(message);
            sentCount++;
          }
        } catch (err) {
          logger.error(
            { err, clientId, channel },
            "Failed to send event"
          );
        }
      }
    }

    return sentCount;
  }

  /**
   * Get the number of connected clients.
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get the total number of active subscriptions.
   */
  getSubscriptionCount(): number {
    let count = 0;
    for (const client of this.clients.values()) {
      count += client.subscriptions.size;
    }
    return count;
  }
}

// Singleton instance
export const channelManager = new ChannelManager();
