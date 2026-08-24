# Talemistry — Full-Cycle Talent Acquisition Platform

> _Reveal the chemistry of human potential._

Talemistry is a recruitment ecosystem covering the full talent-acquisition
lifecycle across seven journey stages: **Discover → Attract → Understand →
Match → Evaluate → Decide → Offer**. It ships as three cooperating apps sharing
one domain model and brand system.

```
talemistry/
├── app/            Next.js 16 product + marketing UI   (primary, preview-rendered)
├── components/     Shared React UI + brand system
├── lib/            Journey model, mock data, helpers
├── apps/
│   └── angular/    Angular 18 UI mirror (standalone components, signals)
└── services/
    └── api/        NestJS + MongoDB backend (REST + Socket.IO + WebRTC signaling)
```

## 1. Next.js UI (`/`)

The primary, fully-designed product. App Router, Tailwind v4, Recharts.

```bash
npm install
npm run dev        # http://localhost:3000
```

Routes: marketing homepage `/`, and the product under `/dashboard` — analytics,
jobs, pipeline (Kanban), candidate intelligence profiles, interviews (WebRTC
room shell + live coding + scorecards), assessments, decisions, offers,
external-dashboard integrations, and a GDPR/bias compliance center.

## 2. Angular UI (`apps/angular`)

A brand-faithful mirror built with standalone components, signals, lazy routes,
and the same SCSS design tokens.

```bash
cd apps/angular
npm install
npm start          # http://localhost:4200
```

Screens: Command Center dashboard, seven-stage pipeline, candidate explorer,
and the candidate intelligence profile. Services fall back to bundled mock data
when the API is offline, so the UI runs standalone.

## 3. NestJS + MongoDB API (`services/api`)

The shared backend and single source of truth for both UIs.

```bash
cd services/api
cp .env.example .env      # set MONGODB_URI
npm install
npm run seed              # load demo data
npm run start:dev         # http://localhost:4000, Swagger at /docs
```

- **REST** modules: candidates, jobs, pipeline, interviews, offers,
  assessments, analytics — validated DTOs, Mongoose schemas, indexes.
- **Real-time** gateways (Socket.IO): `/pipeline` (live stage moves),
  `/collab` (presence + comment threads), `/signaling` (WebRTC offer/answer/ICE
  relay for interview rooms).

## Design system

All three apps implement the Talemistry Brand Book: Inter typography; a
deep-navy + horizon-blue + insight-teal + growth-green palette; the "chemistry
of human potential" product language; and the seven-stage journey as the
organizing metaphor throughout.

## Best practices applied

Layered/modular architecture, indexed document schemas, DTO validation, typed
API clients, standalone Angular components with signals, SSR-friendly Next.js
RSC, accessible semantic markup, SEO metadata, and a WebRTC + Socket.IO
real-time layer ready to connect to a TURN/STUN service.
