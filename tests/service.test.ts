import { describe, expect, it } from "vitest";
import { EndpointChecker } from "../src/checker.js";
import { MemoryMonitorRepository } from "../src/repository.js";
import { MonitoringService } from "../src/service.js";

describe("MonitoringService", () => {
  it("opens an incident after two consecutive failures and resolves it on recovery", async () => {
    const repository = new MemoryMonitorRepository();
    await repository.initialize();

    const responses = [
      new Response(null, { status: 503 }),
      new Response(null, { status: 503 }),
      new Response(null, { status: 200 }),
    ];

    const checker = new EndpointChecker(async () => responses.shift()!);
    const service = new MonitoringService(repository, checker);
    const monitor = await service.createMonitor({
      name: "Customer Portal",
      url: "https://portal.example.test/health",
      intervalSeconds: 60,
    });

    await service.checkMonitor(monitor.id);
    expect(await repository.listIncidents()).toHaveLength(0);

    await service.checkMonitor(monitor.id);
    const opened = await repository.listIncidents();
    expect(opened).toHaveLength(1);
    expect(opened[0]?.resolvedAt).toBeNull();

    await service.checkMonitor(monitor.id);
    const resolved = await repository.listIncidents();
    expect(resolved[0]?.resolvedAt).toBeInstanceOf(Date);
  });
});
