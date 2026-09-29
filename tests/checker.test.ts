import { describe, expect, it } from "vitest";
import { EndpointChecker } from "../src/checker.js";
import type { Monitor } from "../src/types.js";

const monitor: Monitor = {
  id: "monitor-1",
  name: "Example",
  url: "https://example.test/health",
  intervalSeconds: 60,
  createdAt: new Date(),
};

describe("EndpointChecker", () => {
  it("treats 2xx and 3xx responses as healthy", async () => {
    const checker = new EndpointChecker(async () => new Response(null, { status: 204 }));
    const result = await checker.check(monitor);

    expect(result.ok).toBe(true);
    expect(result.statusCode).toBe(204);
    expect(result.error).toBeNull();
  });

  it("captures request failures without throwing", async () => {
    const checker = new EndpointChecker(async () => {
      throw new Error("connection refused");
    });

    const result = await checker.check(monitor);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBeNull();
    expect(result.error).toContain("connection refused");
  });
});
