/**
 * Vorebase Realtime — CDC Trigger Manager
 *
 * Auto-installs MySQL triggers on project tables to capture
 * INSERT, UPDATE, and DELETE events into the ChangeEvent table.
 *
 * Since MySQL doesn't have PostgreSQL's WAL-based logical replication,
 * we use AFTER triggers to write change events to the platform database.
 *
 * Usage:
 *   await installCdcTriggers(projectPool, projectId, tableName);
 *   await removeCdcTriggers(projectPool, tableName);
 *   await listCdcTriggers(projectPool);
 */

import type { Pool } from "mysql2/promise";
import { createLogger } from "@repo/common";

const logger = createLogger("cdc-triggers");

/**
 * Install CDC triggers on a table to capture all data changes.
 * Creates AFTER INSERT, AFTER UPDATE, and AFTER DELETE triggers
 * that write to the platform's ChangeEvent table.
 *
 * @param projectPool - mysql2 pool for the project database
 * @param platformDbName - The platform database name (e.g., "vorebase")
 * @param projectId - The project ID
 * @param tableName - The table to install triggers on
 */
export async function installCdcTriggers(
  projectPool: Pool,
  platformDbName: string,
  projectId: string,
  tableName: string
): Promise<void> {
  const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");
  const triggerPrefix = `_vb_cdc_${safeTable}`;

  // Get column names for JSON construction
  const [columns] = await projectPool.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  ) as any;

  const columnNames: string[] = (columns as any[]).map((c: any) => c.COLUMN_NAME);

  if (columnNames.length === 0) {
    logger.warn({ tableName }, "No columns found — skipping trigger installation");
    return;
  }

  // Build JSON_OBJECT expressions for NEW and OLD row data
  const newJsonParts = columnNames
    .map((col) => `'${col}', NEW.\`${col}\``)
    .join(", ");
  const oldJsonParts = columnNames
    .map((col) => `'${col}', OLD.\`${col}\``)
    .join(", ");

  const newJsonExpr = `JSON_OBJECT(${newJsonParts})`;
  const oldJsonExpr = `JSON_OBJECT(${oldJsonParts})`;

  // AFTER INSERT trigger
  const insertTrigger = `
    CREATE TRIGGER \`${triggerPrefix}_insert\`
    AFTER INSERT ON \`${safeTable}\`
    FOR EACH ROW
    BEGIN
      INSERT INTO \`${platformDbName}\`.ChangeEvent
        (tableName, operation, oldData, newData, projectId, createdAt)
      VALUES
        ('${safeTable}', 'INSERT', NULL, ${newJsonExpr}, '${projectId}', NOW(3));
    END
  `;

  // AFTER UPDATE trigger
  const updateTrigger = `
    CREATE TRIGGER \`${triggerPrefix}_update\`
    AFTER UPDATE ON \`${safeTable}\`
    FOR EACH ROW
    BEGIN
      INSERT INTO \`${platformDbName}\`.ChangeEvent
        (tableName, operation, oldData, newData, projectId, createdAt)
      VALUES
        ('${safeTable}', 'UPDATE', ${oldJsonExpr}, ${newJsonExpr}, '${projectId}', NOW(3));
    END
  `;

  // AFTER DELETE trigger
  const deleteTrigger = `
    CREATE TRIGGER \`${triggerPrefix}_delete\`
    AFTER DELETE ON \`${safeTable}\`
    FOR EACH ROW
    BEGIN
      INSERT INTO \`${platformDbName}\`.ChangeEvent
        (tableName, operation, oldData, newData, projectId, createdAt)
      VALUES
        ('${safeTable}', 'DELETE', ${oldJsonExpr}, NULL, '${projectId}', NOW(3));
    END
  `;

  try {
    // Drop existing triggers first (idempotent)
    await projectPool.execute(`DROP TRIGGER IF EXISTS \`${triggerPrefix}_insert\``);
    await projectPool.execute(`DROP TRIGGER IF EXISTS \`${triggerPrefix}_update\``);
    await projectPool.execute(`DROP TRIGGER IF EXISTS \`${triggerPrefix}_delete\``);

    // Create new triggers
    await projectPool.execute(insertTrigger);
    await projectPool.execute(updateTrigger);
    await projectPool.execute(deleteTrigger);

    logger.info({ tableName, projectId }, "CDC triggers installed");
  } catch (err) {
    logger.error({ err, tableName, projectId }, "Failed to install CDC triggers");
    throw err;
  }
}

/**
 * Remove CDC triggers from a table.
 */
export async function removeCdcTriggers(
  projectPool: Pool,
  tableName: string
): Promise<void> {
  const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");
  const triggerPrefix = `_vb_cdc_${safeTable}`;

  try {
    await projectPool.execute(`DROP TRIGGER IF EXISTS \`${triggerPrefix}_insert\``);
    await projectPool.execute(`DROP TRIGGER IF EXISTS \`${triggerPrefix}_update\``);
    await projectPool.execute(`DROP TRIGGER IF EXISTS \`${triggerPrefix}_delete\``);
    logger.info({ tableName }, "CDC triggers removed");
  } catch (err) {
    logger.error({ err, tableName }, "Failed to remove CDC triggers");
  }
}

/**
 * List all CDC triggers in a project database.
 */
export async function listCdcTriggers(
  projectPool: Pool
): Promise<string[]> {
  const [rows] = await projectPool.execute(
    `SELECT TRIGGER_NAME FROM INFORMATION_SCHEMA.TRIGGERS 
     WHERE TRIGGER_SCHEMA = DATABASE() 
     AND TRIGGER_NAME LIKE '_vb_cdc_%'`
  ) as any;

  return (rows as any[]).map((r: any) => r.TRIGGER_NAME);
}

/**
 * Install CDC triggers on ALL user tables in a project database.
 * Skips system/internal tables.
 */
export async function installCdcTriggersForAllTables(
  projectPool: Pool,
  platformDbName: string,
  projectId: string
): Promise<{ installed: string[]; skipped: string[] }> {
  const [tables] = await projectPool.execute(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_TYPE = 'BASE TABLE'
     AND TABLE_NAME NOT LIKE '\\_vb\\_%' ESCAPE '\\\\'`
  ) as any;

  const installed: string[] = [];
  const skipped: string[] = [];

  for (const row of tables as any[]) {
    const tableName = row.TABLE_NAME;
    try {
      await installCdcTriggers(projectPool, platformDbName, projectId, tableName);
      installed.push(tableName);
    } catch {
      skipped.push(tableName);
    }
  }

  return { installed, skipped };
}
