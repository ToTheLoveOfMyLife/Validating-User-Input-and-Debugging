import type { Monitor } from "./types.js";

export type CheckObservation = {
  ok: boolean;
  statusCode: number | null;
  latencyMs: number;
  error: string | null;
  checkedAt: Date;
};

type FetchLike = (
  input: string | URL | globalThis.Request,
  init?: RequestInit,
) => Promise<Response>;

export class EndpointChecker {
  constructor(
    private readonly fetchFn: FetchLike = fetch,
    private readonly timeoutMs = 5000,
  ) {}

  async check(monitor: Monitor): Promise<CheckObservation> {
    const started = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(monitor.url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
      });

      return {
        ok: response.status >= 200 && response.status < 400,
        statusCode: response.status,
        latencyMs: Math.max(0, Math.round(performance.now() - started)),
        error: null,
        checkedAt: new Date(),
      };
    } catch (error) {
      return {
        ok: false,
        statusCode: null,
        latencyMs: Math.max(0, Math.round(performance.now() - started)),
        error: error instanceof Error ? error.message : "Unknown request failure",
        checkedAt: new Date(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
