export type Monitor = {
  id: string;
  name: string;
  url: string;
  intervalSeconds: number;
  createdAt: Date;
};

export type CheckResult = {
  id: string;
  monitorId: string;
  ok: boolean;
  statusCode: number | null;
  latencyMs: number;
  error: string | null;
  checkedAt: Date;
};

export type Incident = {
  id: string;
  monitorId: string;
  openedAt: Date;
  resolvedAt: Date | null;
  reason: string;
};
