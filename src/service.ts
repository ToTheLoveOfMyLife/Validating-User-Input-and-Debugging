import type { EndpointChecker } from "./checker.js";
import type { MonitorRepository } from "./repository.js";
import type { CheckResult, Monitor } from "./types.js";

export class MonitoringService {
  constructor(
    private readonly repository: MonitorRepository,
    private readonly checker: EndpointChecker,
  ) {}

  async checkMonitor(monitorId: string): Promise<CheckResult> {
    const monitor = await this.repository.getMonitor(monitorId);
    if (!monitor) {
      throw new Error("Monitor not found");
    }

    const observation = await this.checker.check(monitor);
    const saved = await this.repository.saveCheck({
      monitorId,
      ...observation,
    });

    const openIncident = await this.repository.getOpenIncident(monitorId);

    if (saved.ok) {
      if (openIncident) {
        await this.repository.resolveIncident(openIncident.id, saved.checkedAt);
      }
      return saved;
    }

    const recent = await this.repository.getRecentChecks(monitorId, 2);
    const twoFailures = recent.length >= 2 && recent.every((check) => !check.ok);

    if (twoFailures && !openIncident) {
      const reason =
        saved.statusCode === null
          ? saved.error ?? "Endpoint could not be reached"
          : `Endpoint returned HTTP ${saved.statusCode}`;
      await this.repository.createIncident(monitorId, reason);
    }

    return saved;
  }

  async createMonitor(input: {
    name: string;
    url: string;
    intervalSeconds: number;
  }): Promise<Monitor> {
    return this.repository.createMonitor(input);
  }
}
