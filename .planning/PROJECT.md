# Solar Scaffold Pro

## What This Is
A production-grade mobile-first platform for UK solar installation businesses to coordinate scaffolding workflow between property owners, scaffolders, and operations admins. Covers job intake, site photo submission, validation, quote management, scheduling, work completion, and site report generation.

## Core Value
Property owners submit site photos and location → Admin validates and assigns scaffolder → Scaffolder submits quote → Job gets scheduled → Work completes → Site report generates automatically.

## Requirements

### Active
- [ ] Production mobile app (iOS + Android) for property owners and scaffolders
- [ ] Web admin portal for operations team
- [ ] Backend API with PostgreSQL + Prisma
- [ ] Secure file storage (AWS S3) for photos/documents
- [ ] Role-based access control (Admin, Owner, Scaffolder, Engineer)
- [ ] Job workflow state machine (Draft → Completed/Cancelled)
- [ ] Owner photo submission with guided UI
- [ ] Admin photo review and approval
- [ ] Scaffolder assignment with region tagging
- [ ] Quote submission and negotiation flow
- [ ] Scheduling with calendar export (ICS)
- [ ] Push + email + in-app notifications
- [ ] Site report form with photo capture
- [ ] Server-side PDF generation
- [ ] Audit logging for all state transitions
- [ ] GDPR-conscious data architecture
- [ ] App Store + Play Store submission-ready

### Out of Scope
- SMS notifications — architecture ready but not enabled in MVP
- Digital signatures — deferred to Phase 2
- Offline-first mode — not in MVP
- Multi-tenant/subcontractor hierarchy — not in MVP
- AI photo quality checks / OCR — Phase 2

## Context
- UK solar operations business
- Non-technical property owners must be guided through photo submission
- Field contractors use app on mobile devices outdoors
- Operations team manages workflow from admin portal
- Must handle back-and-forth quote negotiation

## Constraints
- **Tech**: React Native/Expo (mobile), Next.js (admin), NestJS/TypeScript (backend), PostgreSQL/Prisma, AWS S3, FCM/APNs, Sentry
- **Security**: MFA-ready architecture, RBAC, audit logs, encrypted transport
- **Compliance**: Apple App Store + Google Play ready, GDPR data minimalization, consent tracking

## Key Decisions
| Decision | Rationale | Outcome |
|---------|-----------|---------|
| React Native + Expo | Cross-platform iOS/Android from single codebase, best DX for mobile-first | — Pending |
| Next.js Admin Portal | SSR admin dashboard, easy deployment, shared types with mobile | — Pending |
| NestJS Backend | Modular, TypeScript, production-grade, scales | — Pending |
| Prisma ORM | Type-safe, migrations, multi-DB support | — Pending |
| Clerk Auth | Production auth, MFA support, session management | — Pending |
| BullMQ/Redis | Background jobs for PDFs, emails, notifications | — Pending |

## Current Milestone: v1.0 MVP

**Goal:** Ship a working end-to-end scaffolding coordination platform covering job intake, photo submission, admin review, quote flow, scheduling, and site report generation.

**Target features:**
- Mobile app for property owners (photo submission) and scaffolders (quotes, scheduling)
- Web admin portal for operations team
- Backend API with full job workflow
- AWS S3 file storage, Clerk auth, PDF generation
- iOS and Android app store submission-ready

---
*Last updated: 2026-03-19 after initialization*
