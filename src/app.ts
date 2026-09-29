import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import { EndpointChecker } from "./checker.js";
import type { MonitorRepository } from "./repository.js";
import { MonitoringService } from "./service.js";

const createMonitorSchema = z.object({
  name: z.string().trim().min(2).max(100),
  url: z.url().refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "Only HTTP and HTTPS URLs are supported"),
  intervalSeconds: z.number().int().min(15).max(3600),
});

export function buildApp(
  repository: MonitorRepository,
  checker = new EndpointChecker(),
): FastifyInstance {
  const app = Fastify({ logger: false });
  const service = new MonitoringService(repository, checker);

  app.get("/health", async () => ({ status: "ok" }));

  app.get("/api/monitors", async () => repository.listMonitors());

  app.post("/api/monitors", async (request, reply) => {
    const parsed = createMonitorSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Validation failed",
        fields: z.flattenError(parsed.error).fieldErrors,
      });
    }

    const monitor = await service.createMonitor(parsed.data);
    return reply.code(201).send(monitor);
  });

  app.post<{ Params: { id: string } }>(
    "/api/monitors/:id/check",
    async (request, reply) => {
      try {
        return await service.checkMonitor(request.params.id);
      } catch (error) {
        if (error instanceof Error && error.message === "Monitor not found") {
          return reply.code(404).send({ error: "Monitor not found" });
        }
        throw error;
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/api/monitors/:id/history",
    async (request, reply) => {
      const monitor = await repository.getMonitor(request.params.id);
      if (!monitor) return reply.code(404).send({ error: "Monitor not found" });
      return repository.getRecentChecks(monitor.id, 50);
    },
  );

  app.get("/api/incidents", async () => repository.listIncidents());

  return app;
}
