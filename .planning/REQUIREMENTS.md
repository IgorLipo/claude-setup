# Requirements: Solar Scaffold Pro

**Defined:** 2026-03-19
**Core Value:** Property owners submit site photos → Admin assigns → Scaffolder quotes → Job scheduled → Work completes → Site report generates

## v1 Requirements

Requirements for initial MVP release.

### Mobile App

- [ ] **MOB-01**: Property owner can sign up and login to mobile app
- [ ] **MOB-02**: Property owner can submit site photos with guided UI
- [ ] **MOB-03**: Property owner can enter and verify property location
- [ ] **MOB-04**: Property owner can view quote and accept/reject
- [ ] **MOB-05**: Property owner can view job schedule with calendar export
- [ ] **MOB-06**: Scaffolder can sign up and login to mobile app
- [ ] **MOB-07**: Scaffolder can submit quote for assigned job
- [ ] **MOB-08**: Scaffolder can update job status (in progress / completed)
- [ ] **MOB-09**: Scaffolder can capture site photos for report
- [ ] **MOB-10**: All users receive push, email, and in-app notifications
- [ ] **MOB-11**: Mobile app is submission-ready for iOS App Store
- [ ] **MOB-12**: Mobile app is submission-ready for Android Play Store

### Admin Portal

- [ ] **ADMIN-01**: Admin can login to web portal with MFA
- [ ] **ADMIN-02**: Admin can review and approve/reject submitted photos
- [ ] **ADMIN-03**: Admin can assign scaffolder to job with region tagging
- [ ] **ADMIN-04**: Admin can manage job workflow state machine (Draft → Scheduled → Completed/Cancelled)
- [ ] **ADMIN-05**: Admin can view audit logs for all state transitions
- [ ] **ADMIN-06**: Admin can trigger site report PDF generation

### Backend API

- [ ] **API-01**: REST API with NestJS + TypeScript
- [ ] **API-02**: PostgreSQL database with Prisma ORM
- [ ] **API-03**: Role-based access control (Admin, Owner, Scaffolder, Engineer)
- [ ] **API-04**: Secure file upload to AWS S3 with presigned URLs
- [ ] **API-05**: Job workflow state machine with all transitions
- [ ] **API-06**: Quote submission and negotiation flow
- [ ] **API-07**: Scheduling with ICS calendar export
- [ ] **API-08**: Background jobs for PDFs, emails, notifications via BullMQ/Redis
- [ ] **API-09**: Clerk auth integration with session management
- [ ] **API-10**: GDPR-conscious data architecture with consent tracking
- [ ] **API-11**: Audit logging for all state transitions
- [ ] **API-12**: Sentry error tracking integration

### Site Reports

- [ ] **REPT-01**: Server-side PDF generation of completed site reports
- [ ] **REPT-02**: Report includes job details, photos, quote, and completion data

## v2 Requirements

Deferred to future release.

### Notifications
- **NOTF-01**: SMS notifications (future enhancement)
- **NOTF-02**: Advanced notification preferences per user

### Digital Signatures
- **SIGN-01**: Digital signature capture for quote acceptance
- **SIGN-02**: Signature on completed site reports

### AI/Automation
- **AI-01**: AI photo quality checks for submission validation
- **AI-02**: OCR for extracting details from photos

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-tenant/subcontractor hierarchy | Not in MVP — single business model |
| Offline-first mode | Complex, defer to future |
| SMS notifications | Architecture ready but not enabled in MVP |
| Digital signatures | Deferred to Phase 2 |
| AI photo quality checks / OCR | Phase 2 feature |
| Real-time chat | Not required for core workflow |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MOB-01 | TBD | Pending |
| MOB-02 | TBD | Pending |
| MOB-03 | TBD | Pending |
| MOB-04 | TBD | Pending |
| MOB-05 | TBD | Pending |
| MOB-06 | TBD | Pending |
| MOB-07 | TBD | Pending |
| MOB-08 | TBD | Pending |
| MOB-09 | TBD | Pending |
| MOB-10 | TBD | Pending |
| MOB-11 | TBD | Pending |
| MOB-12 | TBD | Pending |
| ADMIN-01 | TBD | Pending |
| ADMIN-02 | TBD | Pending |
| ADMIN-03 | TBD | Pending |
| ADMIN-04 | TBD | Pending |
| ADMIN-05 | TBD | Pending |
| ADMIN-06 | TBD | Pending |
| API-01 | TBD | Pending |
| API-02 | TBD | Pending |
| API-03 | TBD | Pending |
| API-04 | TBD | Pending |
| API-05 | TBD | Pending |
| API-06 | TBD | Pending |
| API-07 | TBD | Pending |
| API-08 | TBD | Pending |
| API-09 | TBD | Pending |
| API-10 | TBD | Pending |
| API-11 | TBD | Pending |
| API-12 | TBD | Pending |
| REPT-01 | TBD | Pending |
| REPT-02 | TBD | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 0
- Unmapped: 35 ⚠️

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after initial definition*
