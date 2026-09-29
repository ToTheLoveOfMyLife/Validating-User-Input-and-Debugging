# SignalWatch

![CI](https://github.com/timwmcqueen/SignalWatch/actions/workflows/ci.yml/badge.svg)

SignalWatch checks websites and APIs on a schedule, records their response status and latency, and opens an incident after repeated failures.

When a failed service starts responding normally again, the open incident is automatically resolved.

## Stack

- Node.js 22
- TypeScript
- Fastify
- Zod
- PostgreSQL via `pg`
- In-memory repository for local/test use
- Vitest
- Docker
- GitHub Actions

## Features

- Create endpoint monitors
- Configure check intervals
- Record HTTP status and latency
- Request timeouts with `AbortController`
- Run due checks concurrently
- Store recent check history
- Open an incident after two consecutive failures
- Resolve incidents after recovery
- PostgreSQL persistence when `DATABASE_URL` is set
- In-memory storage when no database is configured
- Request validation and 404 handling

## API examples

Create a monitor:

```http
POST /api/monitors
Content-Type: application/json

{
  "name": "Customer Portal",
  "url": "https://example.com/health",
  "intervalSeconds": 60
}
```

Run a check immediately:

```http
POST /api/monitors/{id}/check
```

Read recent checks:

```http
GET /api/monitors/{id}/history
```

Read incidents:

```http
GET /api/incidents
```

## Run locally

```bash
npm install
npm run dev
```

Without `DATABASE_URL`, SignalWatch uses the in-memory repository.

To use PostgreSQL:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/signalwatch npm start
```

The required tables and indexes are created when the service starts.

## Test and build

```bash
npm test
npm run build
```

## Docker

```bash
docker build -t signalwatch .
docker run -p 3000:3000 signalwatch
```

## Architecture

See [docs/architecture.md](docs/architecture.md).

SignalWatch is split into four main parts:

1. **Fastify API** — monitor, history, and incident endpoints
2. **Monitoring service** — check orchestration and incident rules
3. **Endpoint checker** — HTTP request timing, timeout, and health classification
4. **Repository** — in-memory and PostgreSQL storage implementations
