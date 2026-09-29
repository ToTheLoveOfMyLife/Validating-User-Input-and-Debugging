import type { MonitorRepository } from "./repository.js";
import type { MonitoringService } from "./service.js";

export class PollScheduler {
  private timer: NodeJS.Timeout | null = null;
  private lastChecked = new Map<string, number>();

  constructor(
    private readonly repository: MonitorRepository,
    private readonly service: MonitoringService,
    private readonly tickMs = 5000,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.tick(), this.tickMs);
    this.timer.unref();
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  async tick(now = Date.now()): Promise<void> {
    const monitors = await this.repository.listMonitors();
    const due = monitors.filter((monitor) => {
      const last = this.lastChecked.get(monitor.id) ?? 0;
      return now - last >= monitor.intervalSeconds * 1000;
    });

    await Promise.allSettled(
      due.map(async (monitor) => {
        this.lastChecked.set(monitor.id, now);
        await this.service.checkMonitor(monitor.id);
      }),
    );
  }
}
