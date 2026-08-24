# Talemistry — Backend Integration & Manual Review

This document tracks the MongoDB + NestJS/Next.js backend integration and the
features that still need **manual review** to be considered fully production-ready.

## Infrastructure

| Item | Value |
| --- | --- |
| Native DB (read/write) | `TALEMISTRY_MONGODB_URI` → database `talemistry` |
| Legacy source (read-only) | `MONGODB_URI` (evryka) — used only by the migration |
| Sandbox egress IP (add to MongoDB Atlas ACL) | **`18.190.239.146`** |
| Session secret | `AUTH_SECRET` (falls back to a dev default if unset — **set this in prod**) |
| Optional NestJS proxy | `NEST_API_URL` (if set, `/api/analytics` proxies to the Nest service) |

> **Connection-string note:** the value stored for `TALEMISTRY_MONGODB_URI` was
> missing the leading `mong` of its scheme. Both backends now auto-repair this
> (`lib/mongodb.ts` and `services/api/src/config/configuration.ts`). For cleanliness
> you may re-paste the full `mongodb+srv://...` string.

## Fully working (verified end-to-end against MongoDB)

- **Authentication** — Sign up, sign in, sign out, session cookie (JWT via `jose`),
  bcrypt password hashing, duplicate-email guard, `/dashboard` protected by
  middleware + server-side layout guard, real user shown in the top bar.
- **Candidates** — list/explorer reads live from `candidates`.
- **Pipeline board** — reads live; drag-and-drop **persists** stage changes via
  `PATCH /api/candidates/:id/status` (optimistic UI + rollback).
- **Jobs**, **Interviews**, **Offers** — pages read live from their collections.
- **Analytics** — live aggregation over migrated `talent-pipeline-progress`,
  `users`, and profile collections.
- **Migration** — `POST /api/admin/migrate?key=talemistry-migrate` seeds demo
  domain data and copies key evryka collections into `talemistry`.

## Needs manual review (still using seed data in `lib/data.ts` or not persisted)

1. **Dashboard home** (`app/(app)/dashboard/page.tsx`) — hero KPIs, hiring-momentum
   trend, journey funnel, "Top matches", and activity feed are static. Wire to
   aggregations (repos + a `/api/dashboard` summary).
2. **Candidate detail** (`dashboard/candidates/[id]`) — reads seed data.
   `getCandidateById()` already exists in `lib/repos.ts`; wire the page to it.
3. **Assessments** (`dashboard/assessments`) — page static; `getAssessments()`
   repo exists and is ready to wire.
4. **Decisions** (`dashboard/decisions`) — static; no write path for hiring decisions yet.
5. **Interview scorecard** (`dashboard/interviews/scorecard`) — form does not persist;
   add a `POST /api/interviews/:id/scorecard` using `updateInterview()`.
6. **Interview room** (`dashboard/interviews/room`) — demo UI, no real-time/video backend.
7. **Offers actions** — "Manage", "View letter", approval buttons are not wired;
   `updateOffer()` repo exists for status/approval changes.
8. **Jobs actions** — "New role", "Channels", "View pipeline" buttons; `createJob()`
   / `updateJob()` repos exist to wire create/publish flows.
9. **Integrations** (`dashboard/integrations`) — static configuration UI.
10. **Search bar & notifications** (top bar) — presentational only.
11. **Auth hardening** — set a strong `AUTH_SECRET`, add email verification /
    password reset, and rate-limit the auth routes before production.
12. **NestJS service** — builds and is configured for `talemistry`, but is not run
    in this preview (the Next.js API routes serve the app). Deploy it separately and
    set `NEST_API_URL` if you want the app to use it.

## Demo accounts (seeded)

- `admin@talemistry.com` / `Talemistry!2026` (Administrator)
- Additional seeded recruiter/hiring-manager accounts exist via migration.
