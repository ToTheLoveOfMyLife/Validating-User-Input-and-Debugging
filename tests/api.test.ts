import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { EndpointChecker } from "../src/checker.js";
import { MemoryMonitorRepository } from "../src/repository.js";

const apps: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("SignalWatch API", () => {
  it("validates and creates monitors", async () => {
    const repository = new MemoryMonitorRepository();
    const app = buildApp(repository);
    apps.push(app);

    const invalid = await app.inject({
      method: "POST",
      url: "/api/monitors",
      payload: {
        name: "x",
        url: "not-a-url",
        intervalSeconds: 1,
      },
    });
    expect(invalid.statusCode).toBe(400);

    const created = await app.inject({
      method: "POST",
      url: "/api/monitors",
      payload: {
        name: "Status API",
        url: "https://status.example.test/health",
        intervalSeconds: 30,
      },
    });

    expect(created.statusCode).toBe(201);
    expect(created.json().name).toBe("Status API");
  });

  it("can trigger a check and read history", async () => {
    const repository = new MemoryMonitorRepository();
    const checker = new EndpointChecker(async () => new Response(null, { status: 200 }));
    const app = buildApp(repository, checker);
    apps.push(app);

    const created = await app.inject({
      method: "POST",
      url: "/api/monitors",
      payload: {
        name: "API",
        url: "https://api.example.test/health",
        intervalSeconds: 30,
      },
    });

    const id = created.json().id as string;

    const check = await app.inject({
      method: "POST",
      url: `/api/monitors/${id}/check`,
    });
    expect(check.statusCode).toBe(200);
    expect(check.json().ok).toBe(true);

    const history = await app.inject({
      method: "GET",
      url: `/api/monitors/${id}/history`,
    });
    expect(history.statusCode).toBe(200);
    expect(history.json()).toHaveLength(1);
  });
});
