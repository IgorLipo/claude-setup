# Roadmap: Solar Scaffold Pro v1.0 MVP

**Milestone:** v1.0 MVP
**Granularity:** Coarse
**Phases:** 5
**Coverage:** 35/35 requirements mapped

## Phases

- [ ] **Phase 1: Backend Foundation** - NestJS API, PostgreSQL/Prisma, Clerk auth, S3 file storage, job workflow, quotes, scheduling, BullMQ, audit logging, GDPR, Sentry
- [ ] **Phase 2: Mobile Foundation** - Property owner and scaffolder mobile apps with auth, photo submission, quotes, scheduling, status updates
- [ ] **Phase 3: Admin Portal** - Web admin portal with photo review, job management, scaffolder assignment, audit logs
- [ ] **Phase 4: Notifications** - Push, email, and in-app notifications for all users
- [ ] **Phase 5: App Store Deployment** - iOS App Store and Android Play Store submission-ready builds

---

## Phase Details

### Phase 1: Backend Foundation
**Goal:** Complete backend infrastructure delivering a production-ready NestJS API with all core domain models and workflows

**Depends on:** None (first phase)

**Requirements:** API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-10, API-11, API-12, REPT-01, REPT-02

**Success Criteria** (what must be TRUE):
1. NestJS API serves all REST endpoints and is runnable locally
2. PostgreSQL database is provisioned with Prisma migrations applied
3. Clerk auth integration authenticates users and returns session tokens
4. Users have assigned roles (Admin, Owner, Scaffolder, Engineer) enforced on protected routes
5. Files uploaded via API receive presigned S3 URLs and are retrievable
6. Job state transitions (Draft -> Submitted -> PhotoReview -> QuoteSubmitted -> Negotiating -> Scheduled -> InProgress -> Completed/Cancelled) are enforced by the API
7. Quotes can be submitted by scaffolders and accepted/rejected by property owners
8. Scheduling endpoint returns valid ICS calendar data
9. BullMQ queues process PDF generation and email sending jobs
10. All state transitions write audit log entries with timestamp, user, and action
11. GDPR consent is stored and retrievable per user
12. Sentry captures and reports unhandled exceptions from the API
13. PDF generation produces a downloadable report with job details, photos, quote, and completion data

**Plans:** 3 plans

Plans:
- [ ] 01-PROJECT-SETUP.md -- NestJS scaffold, Prisma schema, Clerk auth, common utilities
- [ ] 02-DOMAIN-MODELS.md -- Jobs state machine, quotes negotiation, photos with Supabase Storage
- [ ] 03-SERVICES.md -- Scheduling ICS, BullMQ queues, Reports PDF, GDPR consent

---

### Phase 2: Mobile Foundation
**Goal:** Property owners and scaffolders can authenticate and complete core workflows on mobile

**Depends on:** Phase 1

**Requirements:** MOB-01, MOB-02, MOB-03, MOB-04, MOB-05, MOB-06, MOB-07, MOB-08, MOB-09

**Success Criteria** (what must be TRUE):
1. Property owner can create account and log in with email/password via Clerk
2. Property owner can capture or select photos of the property with guided UI prompts
3. Property owner can enter and verify property address/location
4. Property owner can view submitted quote and accept or reject it
5. Property owner can view job schedule and export to device calendar via ICS
6. Scaffolder can create account and log in with email/password via Clerk
7. Scaffolder can submit quote amount and notes for an assigned job
8. Scaffolder can update job status to In Progress and then to Completed
9. Scaffolder can capture site photos during or after job completion for the report

**Plans:** TBD

---

### Phase 3: Admin Portal
**Goal:** Operations team can manage all jobs, review submissions, assign scaffolders, and view audit logs

**Depends on:** Phase 1

**Requirements:** ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06

**Success Criteria** (what must be TRUE):
1. Admin can log in to web portal with MFA (Clerk MFA)
2. Admin can view submitted property photos and approve or reject them
3. Admin can assign a scaffolder to a job with region/location tagging
4. Admin can view and update job workflow state (all transitions)
5. Admin can view audit log showing all state transitions with timestamps and users
6. Admin can trigger PDF site report generation and download the result

**Plans:** TBD

---

### Phase 4: Notifications
**Goal:** All users receive timely push, email, and in-app notifications for job events

**Depends on:** Phase 1, Phase 2

**Requirements:** MOB-10, API-08

**Success Criteria** (what must be TRUE):
1. Property owner receives push notification when quote is submitted
2. Property owner receives push notification when job is scheduled
3. Scaffolder receives push notification when assigned to a job
4. Scaffolder receives push notification when job status changes
5. All users receive email notification for critical job events (new quote, job scheduled, job completed)
6. In-app notification bell shows unread notifications with action links

**Plans:** TBD

---

### Phase 5: App Store Deployment
**Goal:** Mobile apps are submission-ready for iOS App Store and Android Play Store

**Depends on:** Phase 2, Phase 4

**Requirements:** MOB-11, MOB-12

**Success Criteria** (what must be TRUE):
1. iOS build (generated via EAS) passes Apple App Store review checklist (icons, splash, bundle ID, permissions)
2. Android APK/AAB (generated via EAS) is signed and passes Google Play Store review checklist
3. Push notification credentials (APNs for iOS, FCM for Android) are configured
4. App Store listings (screenshots, descriptions, keywords) are prepared
5. TestFlight and Internal Testing tracks are operational for beta distribution

**Plans:** TBD

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend Foundation | 0/3 | Not started | - |
| 2. Mobile Foundation | 0/9 | Not started | - |
| 3. Admin Portal | 0/6 | Not started | - |
| 4. Notifications | 0/6 | Not started | - |
| 5. App Store Deployment | 0/5 | Not started | - |

---

## Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| MOB-01 | Phase 2 | Pending |
| MOB-02 | Phase 2 | Pending |
| MOB-03 | Phase 2 | Pending |
| MOB-04 | Phase 2 | Pending |
| MOB-05 | Phase 2 | Pending |
| MOB-06 | Phase 2 | Pending |
| MOB-07 | Phase 2 | Pending |
| MOB-08 | Phase 2 | Pending |
| MOB-09 | Phase 2 | Pending |
| MOB-10 | Phase 4 | Pending |
| MOB-11 | Phase 5 | Pending |
| MOB-12 | Phase 5 | Pending |
| ADMIN-01 | Phase 3 | Pending |
| ADMIN-02 | Phase 3 | Pending |
| ADMIN-03 | Phase 3 | Pending |
| ADMIN-04 | Phase 3 | Pending |
| ADMIN-05 | Phase 3 | Pending |
| ADMIN-06 | Phase 3 | Pending |
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Pending |
| API-03 | Phase 1 | Pending |
| API-04 | Phase 1 | Pending |
| API-05 | Phase 1 | Pending |
| API-06 | Phase 1 | Pending |
| API-07 | Phase 1 | Pending |
| API-08 | Phase 1 | Pending |
| API-09 | Phase 1 | Pending |
| API-10 | Phase 1 | Pending |
| API-11 | Phase 1 | Pending |
| API-12 | Phase 1 | Pending |
| REPT-01 | Phase 1 | Pending |
| REPT-02 | Phase 1 | Pending |

---

## Notes

**Storage Decision:** Using Supabase Storage (S3-compatible) instead of AWS S3 to avoid egress costs on the free tier. Supabase offers 1GB free storage with unlimited egress on their Pro plan equivalent. Falls back to AWS S3 if needed for larger scale.

**Hosting:** Backend on Railway/Render free tier, Admin portal on Vercel (free), Mobile EAS for builds.

**CI/CD:** GitHub Actions for automated testing and builds (free tier).
