import { randomUUID } from "node:crypto";
import type { CheckResult, Incident, Monitor } from "./types.js";

export interface MonitorRepository {
  initialize(): Promise<void>;
  createMonitor(input: Omit<Monitor, "id" | "createdAt">): Promise<Monitor>;
  listMonitors(): Promise<Monitor[]>;
  getMonitor(id: string): Promise<Monitor | null>;
  saveCheck(input: Omit<CheckResult, "id">): Promise<CheckResult>;
  getRecentChecks(monitorId: string, limit: number): Promise<CheckResult[]>;
  getOpenIncident(monitorId: string): Promise<Incident | null>;
  createIncident(monitorId: string, reason: string): Promise<Incident>;
  resolveIncident(id: string, resolvedAt: Date): Promise<void>;
  listIncidents(): Promise<Incident[]>;
}

export class MemoryMonitorRepository implements MonitorRepository {
  private monitors = new Map<string, Monitor>();
  private checks: CheckResult[] = [];
  private incidents: Incident[] = [];

  async initialize(): Promise<void> {}

  async createMonitor(input: Omit<Monitor, "id" | "createdAt">): Promise<Monitor> {
    const monitor: Monitor = { ...input, id: randomUUID(), createdAt: new Date() };
    this.monitors.set(monitor.id, monitor);
    return monitor;
  }

  async listMonitors(): Promise<Monitor[]> {
    return [...this.monitors.values()].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async getMonitor(id: string): Promise<Monitor | null> {
    return this.monitors.get(id) ?? null;
  }

  async saveCheck(input: Omit<CheckResult, "id">): Promise<CheckResult> {
    const result: CheckResult = { ...input, id: randomUUID() };
    this.checks.push(result);
    return result;
  }

  async getRecentChecks(monitorId: string, limit: number): Promise<CheckResult[]> {
    return this.checks
      .filter((check) => check.monitorId === monitorId)
      .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())
      .slice(0, limit);
  }

  async getOpenIncident(monitorId: string): Promise<Incident | null> {
    return this.incidents.find(
      (incident) => incident.monitorId === monitorId && incident.resolvedAt === null,
    ) ?? null;
  }

  async createIncident(monitorId: string, reason: string): Promise<Incident> {
    const incident: Incident = {
      id: randomUUID(),
      monitorId,
      openedAt: new Date(),
      resolvedAt: null,
      reason,
    };
    this.incidents.push(incident);
    return incident;
  }

  async resolveIncident(id: string, resolvedAt: Date): Promise<void> {
    const incident = this.incidents.find((candidate) => candidate.id === id);
    if (incident) incident.resolvedAt = resolvedAt;
  }

  async listIncidents(): Promise<Incident[]> {
    return [...this.incidents].sort(
      (a, b) => b.openedAt.getTime() - a.openedAt.getTime(),
    );
  }
}
