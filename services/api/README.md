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
npm run seed                  # populate sample data
npm run start:dev             # http://localhost:4000/api/v1
\`\`\`

Swagger UI: `http://localhost:4000/api/docs`

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
