/**
 * @vorebase/js — Realtime Client
 *
 * Manages WebSocket connections for real-time database change events.
 *
 * Usage:
 *   const channel = vb.channel('public:posts')
 *     .on('INSERT', (payload) => console.log('New post:', payload.new))
 *     .on('UPDATE', (payload) => console.log('Updated:', payload.new))
 *     .subscribe()
 *
 *   // Later:
 *   channel.unsubscribe()
 */

import type {
  RealtimeEvent,
  RealtimeCallback,
  RealtimePayload,
  RealtimeMessage,
  VorebaseError,
} from "./types.js";

// ── Realtime Channel ────────────────────────────────────

export class RealtimeChannel {
  private channelName: string;
  private listeners: Array<{
    event: RealtimeEvent;
    callback: RealtimeCallback;
  }> = [];
  private client: RealtimeClient;
  private subscribed = false;

  constructor(channelName: string, client: RealtimeClient) {
    this.channelName = channelName;
    this.client = client;
  }

  /**
   * Register a callback for a specific event type.
   * @param event - "INSERT", "UPDATE", "DELETE", or "*" for all
   * @param callback - Function called with { new, old } payload
   */
  on<T = Record<string, unknown>>(
    event: RealtimeEvent,
    callback: RealtimeCallback<T>
  ): this {
    this.listeners.push({
      event,
      callback: callback as RealtimeCallback,
    });
    return this;
  }

  /**
   * Subscribe to this channel. Starts receiving events.
   */
  subscribe(): this {
    if (this.subscribed) return this;
    this.subscribed = true;
    this.client._subscribe(this);
    return this;
  }

  /**
   * Unsubscribe from this channel. Stops receiving events.
   */
  unsubscribe(): void {
    this.subscribed = false;
    this.client._unsubscribe(this);
  }

  /** @internal — Get the channel name */
  getName(): string {
    return this.channelName;
  }

  /** @internal — Dispatch a message to matching listeners */
  _dispatch(event: RealtimeEvent, payload: RealtimePayload): void {
    for (const listener of this.listeners) {
      if (listener.event === "*" || listener.event === event) {
        try {
          listener.callback(payload);
        } catch {
          // Don't let listener errors break the stream
        }
      }
    }
  }
}

// ── Realtime Client ─────────────────────────────────────

export class RealtimeClient {
  private baseUrl: string;
  private apiKey: string;
  private getAccessToken: () => string | null;
  private ws: WebSocket | null = null;
  private channels = new Map<string, RealtimeChannel>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isConnected = false;

  constructor(
    baseUrl: string,
    apiKey: string,
    getAccessToken: () => string | null
  ) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.getAccessToken = getAccessToken;
  }

  /**
   * Create a new channel for subscribing to table changes.
   * @param channelName - e.g., "public:posts" or just "posts"
   */
  channel(channelName: string): RealtimeChannel {
    // Normalize: add "public:" prefix if not present
    const normalized = channelName.includes(":")
      ? channelName
      : `public:${channelName}`;

    if (this.channels.has(normalized)) {
      return this.channels.get(normalized)!;
    }

    const ch = new RealtimeChannel(normalized, this);
    this.channels.set(normalized, ch);
    return ch;
  }

  /**
   * Disconnect all channels and close the WebSocket.
   */
  disconnect(): void {
    this.channels.clear();

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.isConnected = false;
  }

  /** @internal — Called by RealtimeChannel.subscribe() */
  _subscribe(channel: RealtimeChannel): void {
    this.ensureConnection();

    // Send subscribe message once connected
    if (this.isConnected) {
      this.sendSubscribe(channel.getName());
    }
    // If not yet connected, it will be sent in onopen
  }

  /** @internal — Called by RealtimeChannel.unsubscribe() */
  _unsubscribe(channel: RealtimeChannel): void {
    const name = channel.getName();
    this.channels.delete(name);

    if (this.isConnected && this.ws) {
      this.ws.send(
        JSON.stringify({
          type: "unsubscribe",
          channel: name,
        })
      );
    }

    // If no more channels, close connection
    if (this.channels.size === 0) {
      this.disconnect();
    }
  }

  // ── Internal ──────────────────────────────────────────

  private ensureConnection(): void {
    if (this.ws && this.isConnected) return;
    if (this.ws) return; // Already connecting

    const token = this.getAccessToken();
    const wsBaseUrl = this.baseUrl
      .replace("https://", "wss://")
      .replace("http://", "ws://");
    const wsUrl = `${wsBaseUrl}/realtime/v1?apikey=${this.apiKey}${token ? `&token=${token}` : ""}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Subscribe all pending channels
      for (const [name] of this.channels) {
        this.sendSubscribe(name);
      }

      // Start heartbeat (ping every 25s)
      this.heartbeatTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: RealtimeMessage = JSON.parse(event.data as string);
        this.handleMessage(msg);
      } catch {
        // Ignore non-JSON messages
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;

      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }

      // Auto-reconnect if there are active channels
      if (this.channels.size > 0) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will also fire — reconnect handled there
    };
  }

  private sendSubscribe(channel: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "subscribe",
          channel,
          event: "*",
        })
      );
    }
  }

  private handleMessage(msg: RealtimeMessage): void {
    if (msg.type === "postgres_changes" && msg.channel && msg.event && msg.payload) {
      const channel = this.channels.get(msg.channel);
      if (channel) {
        channel._dispatch(
          msg.event as RealtimeEvent,
          msg.payload
        );
      }
    }
    // Silently handle pong, subscribed, etc.
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.ws = null;
      this.ensureConnection();
    }, delay);
  }
}
