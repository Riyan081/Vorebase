/**
 * Vorebase Realtime — MySQL CDC (Change Data Capture) Poller
 *
 * Since MySQL doesn't have PostgreSQL's logical replication (WAL),
 * we use a polling strategy to detect database changes.
 *
 * The poller reads from the `ChangeEvent` table in the platform database
 * (populated by MySQL triggers on user project tables) and broadcasts
 * events to subscribed WebSocket clients.
 *
 * Polling interval: 500ms (configurable)
 *
 * ALTERNATIVE: For lower latency, MySQL triggers can write directly
 * to a _vorebase_changes table in each project database.
 */

import { prismaClient } from "@repo/db/client";
import { channelManager } from "../channels/manager.js";
import type { RealtimeEvent } from "@repo/common";
import { createLogger } from "@repo/common";

const logger = createLogger("cdc-poller");

const POLL_INTERVAL_MS = parseInt(
  process.env.CDC_POLL_INTERVAL || "500",
  10
);

/** Track the last processed event ID to avoid re-sending */
let lastProcessedId: bigint = BigInt(0);

/** Whether the poller is currently running */
let isRunning = false;

/** The interval timer handle */
let pollTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start the CDC poller.
 * Runs in the background, checking for new ChangeEvent records
 * and broadcasting them to subscribed WebSocket clients.
 */
export function startPoller(): void {
  if (isRunning) {
    logger.warn("CDC poller is already running");
    return;
  }

  isRunning = true;
  logger.info(
    { intervalMs: POLL_INTERVAL_MS },
    "Starting CDC poller"
  );

  // Initialize: get the latest event ID so we don't replay old events
  initializeLastId().then(() => {
    pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  });
}

/**
 * Stop the CDC poller.
 */
export function stopPoller(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  isRunning = false;
  logger.info("CDC poller stopped");
}

/**
 * Initialize the last processed ID to the current max.
 */
async function initializeLastId(): Promise<void> {
  try {
    const latest = await prismaClient.changeEvent.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });

    if (latest) {
      lastProcessedId = latest.id;
    }

    logger.info(
      { lastProcessedId: lastProcessedId.toString() },
      "Initialized CDC poller cursor"
    );
  } catch (err) {
    logger.error({ err }, "Failed to initialize CDC poller");
  }
}

/**
 * Poll for new change events and broadcast them.
 */
async function poll(): Promise<void> {
  // Skip if no clients are connected
  if (channelManager.getClientCount() === 0) {
    return;
  }

  try {
    // Fetch new events since the last processed ID
    const events = await prismaClient.changeEvent.findMany({
      where: {
        id: { gt: lastProcessedId },
      },
      orderBy: { id: "asc" },
      take: 100, // Process up to 100 events per poll
    });

    if (events.length === 0) return;

    for (const event of events) {
      // Broadcast to subscribed clients
      const sentCount = channelManager.broadcast(
        event.projectId,
        event.tableName,
        event.operation as RealtimeEvent,
        {
          new: (event.newData as Record<string, unknown>) || null,
          old: (event.oldData as Record<string, unknown>) || null,
        }
      );

      if (sentCount > 0) {
        logger.debug(
          {
            eventId: event.id.toString(),
            table: event.tableName,
            operation: event.operation,
            sentTo: sentCount,
          },
          "Broadcasted change event"
        );
      }

      // Update cursor
      lastProcessedId = event.id;
    }

    // Clean up old events (keep last 10000)
    if (events.length > 0) {
      const cleanupThreshold = lastProcessedId - BigInt(10000);
      if (cleanupThreshold > BigInt(0)) {
        await prismaClient.changeEvent
          .deleteMany({
            where: { id: { lt: cleanupThreshold } },
          })
          .catch(() => {
            // Non-critical, ignore errors
          });
      }
    }
  } catch (err) {
    logger.error({ err }, "CDC poll error");
  }
}
