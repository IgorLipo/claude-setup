# Phase 1: Backend Foundation - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning
**Source:** Infrastructure phase — minimal context

<domain>
## Phase Boundary

Complete backend infrastructure delivering a production-ready NestJS API with all core domain models and workflows. No user-facing components in this phase.

</domain>

<decisions>
## Implementation Decisions

### Infrastructure
- All implementation choices are at Claude's discretion — pure infrastructure phase
- Use NestJS + TypeScript + Prisma + PostgreSQL
- Clerk for auth integration
- BullMQ + Redis for background jobs
- Supabase Storage for file uploads (S3-compatible, free tier)
- Sentry for error tracking

### Database
- PostgreSQL via Prisma ORM
- All models: User, Job, Quote, Photo, AuditLog, Notification, Consent

### Auth
- Clerk for authentication with role assignment
- Roles: Admin, Owner, Scaffolder, Engineer

</decisions>

<codebase>
## Existing Code Insights

No existing codebase — greenfield project.

</codebase>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase, standard patterns apply.

</specifics>

<deferred>
## Deferred Ideas

None — all requirements covered in phase scope.

</deferred>
