import { randomUUID } from "node:crypto";
import pg from "pg";
import type { MonitorRepository } from "./repository.js";
import type { CheckResult, Incident, Monitor } from "./types.js";

const { Pool } = pg;

export class PostgresMonitorRepository implements MonitorRepository {
  private readonly pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS monitors (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        interval_seconds INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS monitor_checks (
        id UUID PRIMARY KEY,
        monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
        ok BOOLEAN NOT NULL,
        status_code INTEGER,
        latency_ms INTEGER NOT NULL,
        error TEXT,
        checked_at TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_monitor_checks_recent
        ON monitor_checks(monitor_id, checked_at DESC);

      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY,
        monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
        opened_at TIMESTAMPTZ NOT NULL,
        resolved_at TIMESTAMPTZ,
        reason TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_incidents_open
        ON incidents(monitor_id, resolved_at);
    `);
  }

  async createMonitor(input: Omit<Monitor, "id" | "createdAt">): Promise<Monitor> {
    const monitor: Monitor = { ...input, id: randomUUID(), createdAt: new Date() };
    await this.pool.query(
      `INSERT INTO monitors (id, name, url, interval_seconds, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [monitor.id, monitor.name, monitor.url, monitor.intervalSeconds, monitor.createdAt],
    );
    return monitor;
  }

  async listMonitors(): Promise<Monitor[]> {
    const result = await this.pool.query(
      `SELECT id, name, url, interval_seconds, created_at
       FROM monitors ORDER BY created_at DESC`,
    );
    return result.rows.map(mapMonitor);
  }

  async getMonitor(id: string): Promise<Monitor | null> {
    const result = await this.pool.query(
      `SELECT id, name, url, interval_seconds, created_at
       FROM monitors WHERE id = $1`,
      [id],
    );
    return result.rowCount ? mapMonitor(result.rows[0]) : null;
  }

  async saveCheck(input: Omit<CheckResult, "id">): Promise<CheckResult> {
    const check: CheckResult = { ...input, id: randomUUID() };
    await this.pool.query(
      `INSERT INTO monitor_checks
       (id, monitor_id, ok, status_code, latency_ms, error, checked_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        check.id,
        check.monitorId,
        check.ok,
        check.statusCode,
        check.latencyMs,
        check.error,
        check.checkedAt,
      ],
    );
    return check;
  }

  async getRecentChecks(monitorId: string, limit: number): Promise<CheckResult[]> {
    const result = await this.pool.query(
      `SELECT id, monitor_id, ok, status_code, latency_ms, error, checked_at
       FROM monitor_checks
       WHERE monitor_id = $1
       ORDER BY checked_at DESC
       LIMIT $2`,
      [monitorId, limit],
    );
    return result.rows.map(mapCheck);
  }

  async getOpenIncident(monitorId: string): Promise<Incident | null> {
    const result = await this.pool.query(
      `SELECT id, monitor_id, opened_at, resolved_at, reason
       FROM incidents
       WHERE monitor_id = $1 AND resolved_at IS NULL
       ORDER BY opened_at DESC LIMIT 1`,
      [monitorId],
    );
    return result.rowCount ? mapIncident(result.rows[0]) : null;
  }

  async createIncident(monitorId: string, reason: string): Promise<Incident> {
    const incident: Incident = {
      id: randomUUID(),
      monitorId,
      openedAt: new Date(),
      resolvedAt: null,
      reason,
    };
    await this.pool.query(
      `INSERT INTO incidents (id, monitor_id, opened_at, resolved_at, reason)
       VALUES ($1, $2, $3, NULL, $4)`,
      [incident.id, incident.monitorId, incident.openedAt, incident.reason],
    );
    return incident;
  }

  async resolveIncident(id: string, resolvedAt: Date): Promise<void> {
    await this.pool.query(
      "UPDATE incidents SET resolved_at = $2 WHERE id = $1",
      [id, resolvedAt],
    );
  }

  async listIncidents(): Promise<Incident[]> {
    const result = await this.pool.query(
      `SELECT id, monitor_id, opened_at, resolved_at, reason
       FROM incidents ORDER BY opened_at DESC`,
    );
    return result.rows.map(mapIncident);
  }
}

function mapMonitor(row: Record<string, unknown>): Monitor {
  return {
    id: String(row.id),
    name: String(row.name),
    url: String(row.url),
    intervalSeconds: Number(row.interval_seconds),
    createdAt: new Date(String(row.created_at)),
  };
}

function mapCheck(row: Record<string, unknown>): CheckResult {
  return {
    id: String(row.id),
    monitorId: String(row.monitor_id),
    ok: Boolean(row.ok),
    statusCode: row.status_code === null ? null : Number(row.status_code),
    latencyMs: Number(row.latency_ms),
    error: row.error === null ? null : String(row.error),
    checkedAt: new Date(String(row.checked_at)),
  };
}

function mapIncident(row: Record<string, unknown>): Incident {
  return {
    id: String(row.id),
    monitorId: String(row.monitor_id),
    openedAt: new Date(String(row.opened_at)),
    resolvedAt: row.resolved_at === null ? null : new Date(String(row.resolved_at)),
    reason: String(row.reason),
  };
}
