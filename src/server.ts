import { buildApp } from "./app.js";
import { EndpointChecker } from "./checker.js";
import { PostgresMonitorRepository } from "./postgres-repository.js";
import { MemoryMonitorRepository, type MonitorRepository } from "./repository.js";
import { PollScheduler } from "./scheduler.js";
import { MonitoringService } from "./service.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const repository: MonitorRepository = process.env.DATABASE_URL
  ? new PostgresMonitorRepository(process.env.DATABASE_URL)
  : new MemoryMonitorRepository();

await repository.initialize();

const checker = new EndpointChecker();
const service = new MonitoringService(repository, checker);
const scheduler = new PollScheduler(repository, service);
const app = buildApp(repository, checker);

scheduler.start();

const shutdown = async () => {
  scheduler.stop();
  await app.close();
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

await app.listen({ port, host });
