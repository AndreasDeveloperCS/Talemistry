# Talemistry API — NestJS + MongoDB

The full-cycle talent-acquisition backend that powers both front-ends
(Next.js and Angular). REST for CRUD + aggregation, WebSockets for live
pipeline, collaboration, and WebRTC signaling.

## Stack

- **NestJS 10** — modular, dependency-injected architecture
- **MongoDB + Mongoose 8** — document model with text indexes and aggregation
- **Socket.IO** — real-time gateways (`/pipeline`, `/collab`, `/rtc`)
- **class-validator / class-transformer** — DTO validation
- **Swagger** — auto-generated API docs at `/api/docs`

## Architecture

\`\`\`
src/
  common/journey.ts        # Shared 7-stage journey enum (source of truth)
  config/                  # Typed configuration
  modules/
    candidates/            # Talemistry Profile, Candidate Formula, work style
    jobs/                  # Roles + programmatic SEO slugs
    pipeline/              # Journey board + stage moves (emits live events)
    interviews/            # Scheduling, WebRTC rooms, scorecards
    offers/                # Approval workflow + acceptance likelihood
    assessments/           # Skills / psychometric / culture / cognitive
    analytics/             # KPI + funnel + source-of-hire aggregations
  realtime/
    pipeline.gateway.ts    # Live Kanban sync
    collaboration.gateway.ts # Presence, typing, chat
    signaling.gateway.ts   # WebRTC SDP/ICE exchange
  seed/seed.ts             # Idempotent local data seed
\`\`\`

## Getting started

\`\`\`bash
cd services/api
cp .env.example .env          # set MONGODB_URI (Atlas or local)
npm install
npm run build && npm run start:prod   # http://localhost:4000/api/v1
# or, for local demo data + hot reload:
npm run seed
npm run start:dev
\`\`\`

Swagger UI: `http://localhost:4000/api/docs`

## Live MongoDB data (`evryka`) — read-only

This backend is wired to the real `evryka` database. The
`GET /api/v1/live/analytics` endpoint aggregates the production
`talent-pipeline-progress`, `users`, `talent-profile`, and `skills`
collections and **never writes**.

\`\`\`
GET /api/v1/live/analytics?range=12m&viewerId=all&recruiterId=all&skill=all
\`\`\`

- `range` — `90d` | `6m` | `ytd` | `12m`
- `viewerId` — supervisor/manager user id to scope the report (HR Director,
  Hiring Manager, etc.), or `all`
- `recruiterId` — a specific recruiter reporting to that supervisor, or `all`
- `skill` — a skill key from the live taxonomy, or `all`

It returns KPIs, monthly trend, stage funnel, per-recruiter performance, and the
available filter options — all identical in shape to the Next.js
`app/api/analytics` route, so the two backends are interchangeable.

### "Both" model — NestJS source + Next.js proxy

The Next.js app owns `app/api/analytics`, which runs live in the v0 preview. If
`NEST_API_URL` is set in the Next.js env, that route **proxies** to this NestJS
service and falls back to local computation if it is unreachable. Host this
service separately (Render/Railway/EC2) since a standalone server cannot run on
the same Vercel project as the Next.js app.

### MongoDB IP Access List (ACL) — REQUIRED

Atlas blocks all connections unless the client's **public egress IP** is on the
cluster's Network Access list.

- Current v0 sandbox egress IP whitelisted: **`18.190.239.146`**
- This IP is **dynamic** and rotates on host/sandbox restart. If a connection
  times out (`ETIMEDOUT` / server-selection error), the IP has changed. Fix by:
  1. Printing the new IP (`curl https://api.ipify.org`) and adding it to Atlas →
     Network Access, or
  2. Adding `0.0.0.0/0` — recommended for serverless/Vercel deploys where egress
     IPs are not stable; security is enforced by the connection-string
     credentials.

## Key endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/candidates` | Search / filter candidates (text, stage, minMatch) |
| GET | `/api/v1/pipeline/board?jobId=` | 7-column journey board |
| PATCH | `/api/v1/pipeline/candidates/:id/move` | Advance stage (broadcasts live) |
| GET | `/api/v1/analytics/overview` | Dashboard KPIs + funnel |
| POST | `/api/v1/interviews` | Schedule interview (creates WebRTC room) |
| PATCH | `/api/v1/offers/:id/approve` | Advance offer approval chain |

## WebSocket namespaces

- `/pipeline` — `join(jobId)`, receives `candidate:moved`
- `/collab` — `join(room)`, `message`, `typing`, receives `presence`
- `/rtc` — `join({room, peerId})`, `offer` / `answer` / `ice-candidate`

> Production notes: put JWT auth guards on controllers + gateways, add a TURN
> server for reliable video, and swap the WebRTC mesh for an SFU beyond ~4
> participants.
