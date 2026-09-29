# SignalWatch

A production-style **endpoint health and incident monitoring service** built with TypeScript, Fastify, PostgreSQL support, automated polling, tests, and CI.

This project replaces an introductory input-validation exercise with a system that demonstrates asynchronous service checks, repository abstraction, incident rules, persistence, API validation, and background scheduling.

## What it does

SignalWatch stores HTTP/HTTPS monitors, polls them on a schedule, records status/latency history, and opens an incident after two consecutive failures. When the endpoint recovers, the open incident is automatically resolved.

## Stack

- Node.js 22
- TypeScript
- Fastify
- Zod
- PostgreSQL via `pg`
- In-memory repository for local/demo/test usage
- Vitest
- Docker
- GitHub Actions

## Features

- Create endpoint monitors
- Configurable check intervals
- HTTP status and latency collection
- Request timeouts with `AbortController`
- Concurrent scheduler execution with `Promise.allSettled`
- Check history per monitor
- Incident creation after repeated failures
- Automatic incident resolution on recovery
- PostgreSQL persistence when `DATABASE_URL` is configured
- In-memory mode when no database is configured
- API validation and 404 handling
- Automated tests and production TypeScript builds in CI

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

Trigger a check immediately:

```http
POST /api/monitors/{id}/check
```

Read recent observations:

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

Without `DATABASE_URL`, SignalWatch uses its in-memory repository.

To use PostgreSQL:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/signalwatch npm start
```

The service initializes the required tables and indexes at startup.

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

The code separates four concerns:

1. **HTTP API** — Fastify routes and Zod validation.
2. **Monitoring service** — incident rules and check orchestration.
3. **Endpoint checker** — network timing, timeout, and response classification.
4. **Repository** — interchangeable in-memory and PostgreSQL implementations.

That separation makes business logic testable without a real network endpoint or database.

## Portfolio history

The original Java paint/input-validation coursework is preserved under `legacy/Paint1.java` to document progression from introductory programming into service engineering.
