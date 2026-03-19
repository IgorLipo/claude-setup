---
phase: 01-backend-foundation
plan: '02'
type: execute
wave: '2'
depends_on:
  - '01'
files_modified:
  - solar-ops/backend/src/jobs/jobs.module.ts
  - solar-ops/backend/src/jobs/jobs.controller.ts
  - solar-ops/backend/src/jobs/jobs.service.ts
  - solar-ops/backend/src/jobs/entities/job.entity.ts
  - solar-ops/backend/src/jobs/dto/create-job.dto.ts
  - solar-ops/backend/src/jobs/dto/update-job-status.dto.ts
  - solar-ops/backend/src/quotes/quotes.module.ts
  - solar-ops/backend/src/quotes/quotes.controller.ts
  - solar-ops/backend/src/quotes/quotes.service.ts
  - solar-ops/backend/src/quotes/entities/quote.entity.ts
  - solar-ops/backend/src/quotes/dto/create-quote.dto.ts
  - solar-ops/backend/src/quotes/dto/respond-quote.dto.ts
  - solar-ops/backend/src/photos/photos.module.ts
  - solar-ops/backend/src/photos/photos.controller.ts
  - solar-ops/backend/src/photos/photos.service.ts
  - solar-ops/backend/src/photos/entities/photo.entity.ts
  - solar-ops/backend/src/photos/dto/create-photo.dto.ts
  - solar-ops/backend/src/storage/storage.module.ts
  - solar-ops/backend/src/storage/storage.service.ts
autonomous: true
requirements:
  - API-04
  - API-05
  - API-06
  - API-07
user_setup: []
must_haves:
  truths:
    - "Files uploaded via API receive presigned S3 URLs and are retrievable"
    - "Job state transitions (Draft -> Submitted -> PhotoReview -> QuoteSubmitted -> Negotiating -> Scheduled -> InProgress -> Completed/Cancelled) are enforced by the API"
    - "Quotes can be submitted by scaffolders and accepted/rejected by property owners"
  artifacts:
    - path: solar-ops/backend/src/jobs/jobs.service.ts
      provides: Job CRUD with state machine enforcement
      exports: create, findAll, findOne, updateStatus
    - path: solar-ops/backend/src/jobs/jobs.controller.ts
      provides: REST endpoints for job management
      exports: POST/GET/PATCH /jobs
    - path: solar-ops/backend/src/quotes/quotes.service.ts
      provides: Quote submission and response logic
      exports: submit, accept, reject
    - path: solar-ops/backend/src/photos/photos.service.ts
      provides: Photo management with presigned URLs
      exports: upload, approve, findByJob
    - path: solar-ops/backend/src/storage/storage.service.ts
      provides: Presigned URL generation for Supabase Storage
      exports: getUploadUrl, getDownloadUrl
  key_links:
    - from: solar-ops/backend/src/jobs/jobs.service.ts
      to: solar-ops/backend/prisma/schema.prisma
      via: PrismaService.job.find/create/update
    - from: solar-ops/backend/src/photos/photos.service.ts
      to: solar-ops/backend/src/storage/storage.service.ts
      via: getUploadUrl, getDownloadUrl calls
    - from: solar-ops/backend/src/quotes/quotes.service.ts
      to: solar-ops/backend/src/jobs/jobs.service.ts
      via: updateStatus call on quote accept/reject
---

<objective>
Implement the three core domain modules: Jobs (with full state machine), Quotes (submission and negotiation), and Photos (with Supabase Storage presigned URLs). Jobs state transitions are enforced and write audit log entries.
</objective>

<execution_context>
@/Users/igorlipovetsky/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
Jobs module must enforce the exact state machine: Draft -> Submitted -> PhotoReview -> QuoteSubmitted -> Negotiating -> Scheduled -> InProgress -> Completed/Cancelled. Invalid transitions throw BadRequestException. Quotes have a Pending/Accepted/Rejected status separate from job status. Storage uses Supabase Storage (S3-compatible) via the @supabase/supabase-js client. All imports use @/* path alias from tsconfig.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Jobs module with state machine and CRUD endpoints</name>
  <files>solar-ops/backend/src/jobs/jobs.module.ts, solar-ops/backend/src/jobs/jobs.controller.ts, solar-ops/backend/src/jobs/jobs.service.ts, solar-ops/backend/src/jobs/entities/job.entity.ts, solar-ops/backend/src/jobs/dto/create-job.dto.ts, solar-ops/backend/src/jobs/dto/update-job-status.dto.ts, solar-ops/backend/src/audit/audit.service.ts, solar-ops/backend/src/audit/audit.module.ts, solar-ops/backend/src/audit/audit.controller.ts</files>
  <read_first>solar-ops/backend/src/common/enums/job-status.enum.ts</read_first>
  <action>
Create the Jobs module with state machine enforcement and the Audit module.

**State Machine Rules (enforce in jobs.service.ts):**
```
DRAFT -> SUBMITTED
SUBMITTED -> PHOTO_REVIEW
PHOTO_REVIEW -> QUOTE_SUBMITTED
QUOTE_SUBMITTED -> NEGOTIATING
NEGOTIATING -> SCHEDULED
SCHEDULED -> IN_PROGRESS
IN_PROGRESS -> COMPLETED
Any state -> CANCELLED (Admin only)
DRAFT -> CANCELLED
```

**src/jobs/dto/create-job.dto.ts**:
```typescript
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateJobDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
```

**src/jobs/dto/update-job-status.dto.ts**:
```typescript
import { IsEnum } from 'class-validator';
import { JobStatus } from '../../common/enums/job-status.enum';

export class UpdateJobStatusDto {
  @IsEnum(JobStatus)
  status: JobStatus;
}
```

**src/jobs/entities/job.entity.ts**:
```typescript
export class Job {
  id: string;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  ownerId: string;
  scaffolderId: string;
  scheduledDate: Date;
  scheduledDuration: number;
  completionDate: Date;
  completionNotes: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**src/jobs/jobs.service.ts**:
```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus } from '../common/enums/job-status.enum';
import { AuditService } from '../audit/audit.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';

const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.DRAFT]: [JobStatus.SUBMITTED, JobStatus.CANCELLED],
  [JobStatus.SUBMITTED]: [JobStatus.PHOTO_REVIEW, JobStatus.CANCELLED],
  [JobStatus.PHOTO_REVIEW]: [JobStatus.QUOTE_SUBMITTED, JobStatus.CANCELLED],
  [JobStatus.QUOTE_SUBMITTED]: [JobStatus.NEGOTIATING, JobStatus.CANCELLED],
  [JobStatus.NEGOTIATING]: [JobStatus.SCHEDULED, JobStatus.CANCELLED],
  [JobStatus.SCHEDULED]: [JobStatus.IN_PROGRESS, JobStatus.CANCELLED],
  [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED, JobStatus.CANCELLED],
  [JobStatus.COMPLETED]: [],
  [JobStatus.CANCELLED]: [],
};

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateJobDto, ownerId: string) {
    const job = await this.prisma.job.create({
      data: { ...dto, ownerId, status: JobStatus.DRAFT },
    });
    await this.auditService.log({
      userId: ownerId,
      action: 'JOB_CREATED',
      entityType: 'Job',
      entityId: job.id,
      newValue: JobStatus.DRAFT,
    });
    return job;
  }

  async findAll(filters?: { status?: JobStatus; ownerId?: string; scaffolderId?: string }) {
    return this.prisma.job.findMany({
      where: filters,
      include: { owner: true, scaffolder: true, quotes: true, photos: true },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { owner: true, scaffolder: true, quotes: true, photos: true },
    });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async updateStatus(id: string, dto: UpdateJobStatusDto, userId: string, userRole: string) {
    const job = await this.findOne(id);
    const currentStatus = job.status as JobStatus;
    const newStatus = dto.status;

    if (newStatus === JobStatus.CANCELLED && userRole !== 'Admin') {
      throw new BadRequestException('Only Admin can cancel a job');
    }

    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updated = await this.prisma.job.update({
      where: { id },
      data: { status: newStatus },
    });

    await this.auditService.log({
      jobId: id,
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'Job',
      entityId: id,
      previousValue: currentStatus,
      newValue: newStatus,
    });

    return updated;
  }

  async assignScaffolder(jobId: string, scaffolderId: string, adminId: string) {
    const job = await this.prisma.job.update({
      where: { id: jobId },
      data: { scaffolderId },
    });
    await this.auditService.log({
      jobId,
      userId: adminId,
      action: 'SCAFFOLDER_ASSIGNED',
      entityType: 'Job',
      entityId: jobId,
      newValue: scaffolderId,
    });
    return job;
  }

  async setScheduledDate(jobId: string, date: Date, duration: number, userId: string) {
    const job = await this.prisma.job.update({
      where: { id: jobId },
      data: { scheduledDate: date, scheduledDuration: duration },
    });
    await this.auditService.log({
      jobId,
      userId,
      action: 'SCHEDULED_DATE_SET',
      entityType: 'Job',
      entityId: jobId,
      newValue: date.toISOString(),
    });
    return job;
  }

  async completeJob(jobId: string, notes: string, userId: string) {
    const job = await this.prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.COMPLETED, completionDate: new Date(), completionNotes: notes },
    });
    await this.auditService.log({
      jobId,
      userId,
      action: 'JOB_COMPLETED',
      entityType: 'Job',
      entityId: jobId,
      newValue: JobStatus.COMPLETED,
    });
    return job;
  }
}
```

**src/jobs/jobs.controller.ts**:
```typescript
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JobStatus } from '../common/enums/job-status.enum';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post()
  create(@Body() dto: CreateJobDto, @Req() req: any) {
    return this.jobsService.create(dto, req.user.id);
  }

  @Get()
  findAll(
    @Query('status') status?: JobStatus,
    @Query('ownerId') ownerId?: string,
    @Query('scaffolderId') scaffolderId?: string,
  ) {
    return this.jobsService.findAll({ status, ownerId, scaffolderId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SCAFFOLDER)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateJobStatusDto, @Req() req: any) {
    return this.jobsService.updateStatus(id, dto, req.user.id, req.user.role);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  assignScaffolder(@Param('id') id: string, @Body() body: { scaffolderId: string }, @Req() req: any) {
    return this.jobsService.assignScaffolder(id, body.scaffolderId, req.user.id);
  }

  @Patch(':id/schedule')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SCAFFOLDER)
  setSchedule(@Param('id') id: string, @Body() body: { date: string; duration: number }, @Req() req: any) {
    return this.jobsService.setScheduledDate(id, new Date(body.date), body.duration, req.user.id);
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(Role.SCAFFOLDER)
  complete(@Param('id') id: string, @Body() body: { notes: string }, @Req() req: any) {
    return this.jobsService.completeJob(id, body.notes, req.user.id);
  }
}
```

**src/jobs/jobs.module.ts**:
```typescript
import { Module, forwardRef } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuditModule), AuthModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
```

**src/audit/audit.service.ts**:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    jobId?: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValue?: string;
    newValue?: string;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({
      data: {
        jobId: params.jobId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        previousValue: params.previousValue,
        newValue: params.newValue,
        metadata: params.metadata,
      },
    });
  }

  async findByJob(jobId: string) {
    return this.prisma.auditLog.findMany({
      where: { jobId },
      include: { user: true },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findAll(filters?: { userId?: string; action?: string }) {
    return this.prisma.auditLog.findMany({
      where: filters,
      include: { user: true, job: true },
      orderBy: { timestamp: 'desc' },
    });
  }
}
```

**src/audit/audit.controller.ts**:
```typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  findAll(@Query('userId') userId?: string, @Query('action') action?: string) {
    return this.auditService.findAll({ userId, action });
  }

  @Get('job/:jobId')
  findByJob(@Param('jobId') jobId: string) {
    return this.auditService.findByJob(jobId);
  }
}
```

**src/audit/audit.module.ts**:
```typescript
import { Module, forwardRef } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
```
  </action>
  <verify>
    <automated>grep -q 'VALID_TRANSITIONS' solar-ops/backend/src/jobs/jobs.service.ts && grep -q 'BadRequestException' solar-ops/backend/src/jobs/jobs.service.ts && grep -q 'auditService.log' solar-ops/backend/src/jobs/jobs.service.ts && grep -q 'STATUS_CHANGE' solar-ops/backend/src/audit/audit.service.ts</automated>
  </verify>
  <acceptance_criteria>
    - jobs.service.ts has VALID_TRANSITIONS map covering all 9 job states
    - jobs.service.ts updateStatus() throws BadRequestException for invalid transitions
    - jobs.service.ts updateStatus() checks userRole === 'Admin' before allowing CANCELLED from non-terminal states
    - jobs.service.ts create(), findAll(), findOne(), updateStatus(), assignScaffolder(), setScheduledDate(), completeJob() methods all call auditService.log()
    - jobs.controller.ts has POST /jobs, GET /jobs, GET /jobs/:id, PATCH /jobs/:id/status, PATCH /jobs/:id/assign, PATCH /jobs/:id/schedule, PATCH /jobs/:id/complete
    - JobsController methods are all protected with @UseGuards(JwtAuthGuard)
    - audit.service.ts has log() method that creates AuditLog in database
    - audit.controller.ts has GET /audit and GET /audit/job/:jobId (Admin only)
    - JobsModule imports AuditModule using forwardRef to avoid circular dependency
  </acceptance_criteria>
  <done>Jobs module enforces state machine transitions. All state changes write audit log entries. Admin-only routes are protected by RolesGuard. Jobs are fully queryable by status, owner, and scaffolder.</done>
</task>

<task type="auto">
  <name>Task 2: Quotes module with submission and accept/reject flow</name>
  <files>solar-ops/backend/src/quotes/quotes.module.ts, solar-ops/backend/src/quotes/quotes.controller.ts, solar-ops/backend/src/quotes/quotes.service.ts, solar-ops/backend/src/quotes/entities/quote.entity.ts, solar-ops/backend/src/quotes/dto/create-quote.dto.ts, solar-ops/backend/src/quotes/dto/respond-quote.dto.ts</files>
  <read_first>solar-ops/backend/src/jobs/jobs.service.ts</read_first>
  <action>
Create the Quotes module with submission and owner accept/reject flow.

**src/quotes/dto/create-quote.dto.ts**:
```typescript
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  jobId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

**src/quotes/dto/respond-quote.dto.ts**:
```typescript
import { IsEnum } from 'class-validator';

export class RespondQuoteDto {
  @IsEnum(['Accepted', 'Rejected'])
  status: 'Accepted' | 'Rejected';
}
```

**src/quotes/entities/quote.entity.ts**:
```typescript
export class Quote {
  id: string;
  jobId: string;
  scaffolderId: string;
  amount: number;
  notes: string;
  status: string;
  submittedAt: Date;
  respondedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**src/quotes/quotes.service.ts**:
```typescript
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { JobStatus } from '../common/enums/job-status.enum';

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private jobsService: JobsService,
  ) {}

  async submit(dto: CreateQuoteDto, scaffolderId: string) {
    const job = await this.jobsService.findOne(dto.jobId);

    if (job.scaffolderId !== scaffolderId) {
      throw new ForbiddenException('You are not assigned to this job');
    }

    if (job.status !== JobStatus.QUOTE_SUBMITTED && job.status !== JobStatus.NEGOTIATING) {
      throw new BadRequestException(`Cannot submit quote when job is in ${job.status} status`);
    }

    const quote = await this.prisma.quote.create({
      data: {
        jobId: dto.jobId,
        scaffolderId,
        amount: dto.amount,
        notes: dto.notes,
        status: 'Pending',
      },
    });

    await this.auditService.log({
      jobId: dto.jobId,
      userId: scaffolderId,
      action: 'QUOTE_SUBMITTED',
      entityType: 'Quote',
      entityId: quote.id,
      newValue: `amount:${dto.amount}`,
    });

    return quote;
  }

  async findByJob(jobId: string) {
    return this.prisma.quote.findMany({
      where: { jobId },
      include: { scaffolder: true },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async respond(quoteId: string, status: 'Accepted' | 'Rejected', ownerId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { job: true },
    });

    if (!quote) throw new NotFoundException(`Quote ${quoteId} not found`);
    if (quote.job.ownerId !== ownerId) throw new ForbiddenException('Only the property owner can respond');

    if (quote.status !== 'Pending') {
      throw new BadRequestException('Quote has already been responded to');
    }

    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status, respondedAt: new Date() },
    });

    if (status === 'Accepted') {
      await this.jobsService.updateStatus(
        quote.jobId,
        { status: JobStatus.NEGOTIATING } as any,
        ownerId,
        'Owner',
      );
    }

    await this.auditService.log({
      jobId: quote.jobId,
      userId: ownerId,
      action: status === 'Accepted' ? 'QUOTE_ACCEPTED' : 'QUOTE_REJECTED',
      entityType: 'Quote',
      entityId: quoteId,
      previousValue: 'Pending',
      newValue: status,
    });

    return updated;
  }

  async findAll(filters?: { scaffolderId?: string; jobId?: string }) {
    return this.prisma.quote.findMany({
      where: filters,
      include: { job: true, scaffolder: true },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
```

**src/quotes/quotes.controller.ts**:
```typescript
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { RespondQuoteDto } from './dto/respond-quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SCAFFOLDER)
  submit(@Body() dto: CreateQuoteDto, @Req() req: any) {
    return this.quotesService.submit(dto, req.user.id);
  }

  @Get()
  findAll(
    @Query('scaffolderId') scaffolderId?: string,
    @Query('jobId') jobId?: string,
  ) {
    return this.quotesService.findAll({ scaffolderId, jobId });
  }

  @Get('job/:jobId')
  findByJob(@Param('jobId') jobId: string) {
    return this.quotesService.findByJob(jobId);
  }

  @Patch(':id/respond')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  respond(@Param('id') id: string, @Body() dto: RespondQuoteDto, @Req() req: any) {
    return this.quotesService.respond(id, dto.status, req.user.id);
  }
}
```

**src/quotes/quotes.module.ts**:
```typescript
import { Module, forwardRef } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { JobsModule } from '../jobs/jobs.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuditModule), forwardRef(() => JobsModule), AuthModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
```
  </action>
  <verify>
    <automated>grep -q 'submit(' solar-ops/backend/src/quotes/quotes.service.ts && grep -q 'respond(' solar-ops/backend/src/quotes/quotes.service.ts && grep -q 'QUOTE_SUBMITTED' solar-ops/backend/src/quotes/quotes.service.ts && grep -q 'ForbiddenException' solar-ops/backend/src/quotes/quotes.service.ts</automated>
  </verify>
  <acceptance_criteria>
    - quotes.service.ts submit() only allows the assigned scaffolder to submit a quote
    - quotes.service.ts submit() only allows submission when job status is QUOTE_SUBMITTED or NEGOTIATING
    - quotes.service.ts respond() only allows the job owner to accept/reject
    - quotes.service.ts respond() transitions job to NEGOTIATING when accepted
    - quotes.service.ts and quotes.controller.ts both call auditService.log() for QUOTE_SUBMITTED and QUOTE_ACCEPTED/QUOTE_REJECTED
    - quotes.controller.ts has POST /quotes (scaffolder only), GET /quotes, GET /quotes/job/:jobId, PATCH /quotes/:id/respond (owner only)
    - QuotesModule uses forwardRef for AuditModule and JobsModule
  </acceptance_criteria>
  <done>Quotes module enables scaffolders to submit quotes for assigned jobs. Property owners can accept or reject quotes. All quote actions write audit logs. Job status transitions correctly after quote acceptance.</done>
</task>

<task type="auto">
  <name>Task 3: Photos module with Supabase Storage presigned URLs</name>
  <files>solar-ops/backend/src/photos/photos.module.ts, solar-ops/backend/src/photos/photos.controller.ts, solar-ops/backend/src/photos/photos.service.ts, solar-ops/backend/src/photos/entities/photo.entity.ts, solar-ops/backend/src/photos/dto/create-photo.dto.ts, solar-ops/backend/src/storage/storage.module.ts, solar-ops/backend/src/storage/storage.service.ts</files>
  <read_first>/dev/null</read_first>
  <action>
Create the Photos module with Supabase Storage integration and the Storage service.

**src/storage/storage.service.ts**:
```typescript
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
    );
  }

  async getUploadUrl(storageKey: string, contentType: string): Promise<{ url: string; expiresAt: Date }> {
    const { data, error } = await this.supabase.storage
      .from('photos')
      .createSignedUploadUrl(storageKey);

    if (error) throw new Error(`Failed to create upload URL: ${error.message}`);
    return { url: data.signedUrl, expiresAt: new Date(Date.now() + 3600 * 1000) };
  }

  async getDownloadUrl(storageKey: string): Promise<{ url: string; expiresAt: Date }> {
    const { data, error } = await this.supabase.storage
      .from('photos')
      .createSignedUrl(storageKey, 3600);

    if (error) throw new Error(`Failed to create download URL: ${error.message}`);
    return { url: data.signedUrl, expiresAt: new Date(Date.now() + 3600 * 1000) };
  }

  async deleteFile(storageKey: string): Promise<void> {
    const { error } = await this.supabase.storage.from('photos').remove([storageKey]);
    if (error) throw new Error(`Failed to delete file: ${error.message}`);
  }
}
```

**src/storage/storage.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
```

**src/photos/dto/create-photo.dto.ts**:
```typescript
import { IsString, IsOptional } from 'class-validator';

export class CreatePhotoDto {
  @IsString()
  jobId: string;

  @IsString()
  storageKey: string;

  @IsOptional()
  @IsString()
  caption?: string;
}
```

**src/photos/entities/photo.entity.ts**:
```typescript
export class Photo {
  id: string;
  jobId: string;
  uploadedById: string;
  url: string;
  storageKey: string;
  caption: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**src/photos/photos.service.ts**:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private auditService: AuditService,
  ) {}

  async requestUploadUrl(jobId: string, filename: string, contentType: string, userId: string) {
    const storageKey = `jobs/${jobId}/${Date.now()}-${filename}`;
    const { url, expiresAt } = await this.storageService.getUploadUrl(storageKey, contentType);
    return { uploadUrl: url, storageKey, expiresAt };
  }

  async create(dto: CreatePhotoDto, uploadedById: string) {
    const photo = await this.prisma.photo.create({
      data: {
        jobId: dto.jobId,
        storageKey: dto.storageKey,
        uploadedById,
        url: dto.storageKey,
        caption: dto.caption,
        approved: false,
      },
    });

    await this.auditService.log({
      jobId: dto.jobId,
      userId: uploadedById,
      action: 'PHOTO_UPLOADED',
      entityType: 'Photo',
      entityId: photo.id,
      newValue: dto.storageKey,
    });

    return photo;
  }

  async findByJob(jobId: string) {
    const photos = await this.prisma.photo.findMany({
      where: { jobId },
      include: { uploadedBy: true },
    });

    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        try {
          const { url } = await this.storageService.getDownloadUrl(photo.storageKey);
          return { ...photo, url };
        } catch {
          return { ...photo, url: photo.storageKey };
        }
      }),
    );

    return photosWithUrls;
  }

  async approve(photoId: string, adminId: string) {
    const photo = await this.prisma.photo.update({
      where: { id: photoId },
      data: { approved: true },
    });

    await this.auditService.log({
      jobId: photo.jobId,
      userId: adminId,
      action: 'PHOTO_APPROVED',
      entityType: 'Photo',
      entityId: photoId,
      newValue: 'approved',
    });

    return photo;
  }

  async delete(photoId: string, userId: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) throw new NotFoundException(`Photo ${photoId} not found`);

    await this.storageService.deleteFile(photo.storageKey);
    await this.prisma.photo.delete({ where: { id: photoId } });

    await this.auditService.log({
      jobId: photo.jobId,
      userId,
      action: 'PHOTO_DELETED',
      entityType: 'Photo',
      entityId: photoId,
    });
  }
}
```

**src/photos/photos.controller.ts**:
```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private photosService: PhotosService) {}

  @Post('upload-url')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.SCAFFOLDER)
  requestUploadUrl(
    @Body() body: { jobId: string; filename: string; contentType: string },
    @Req() req: any,
  ) {
    return this.photosService.requestUploadUrl(body.jobId, body.filename, body.contentType, req.user.id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.SCAFFOLDER)
  create(@Body() dto: CreatePhotoDto, @Req() req: any) {
    return this.photosService.create(dto, req.user.id);
  }

  @Get('job/:jobId')
  findByJob(@Param('jobId') jobId: string) {
    return this.photosService.findByJob(jobId);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string, @Req() req: any) {
    return this.photosService.approve(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.SCAFFOLDER, Role.ADMIN)
  delete(@Param('id') id: string, @Req() req: any) {
    return this.photosService.delete(id, req.user.id);
  }
}
```

**src/photos/photos.module.ts**:
```typescript
import { Module, forwardRef } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, StorageModule, forwardRef(() => AuditModule), AuthModule],
  controllers: [PhotosController],
  providers: [PhotosService],
  exports: [PhotosService],
})
export class PhotosModule {}
```
  </action>
  <verify>
    <automated>grep -q 'getUploadUrl' solar-ops/backend/src/storage/storage.service.ts && grep -q 'getDownloadUrl' solar-ops/backend/src/storage/storage.service.ts && grep -q '@supabase/supabase-js' solar-ops/backend/src/storage/storage.service.ts && grep -q 'requestUploadUrl' solar-ops/backend/src/photos/photos.service.ts</automated>
  </verify>
  <acceptance_criteria>
    - storage.service.ts imports from '@supabase/supabase-js' and uses createClient with SUPABASE_URL and SUPABASE_KEY env vars
    - storage.service.ts getUploadUrl() calls supabase.storage.from('photos').createSignedUploadUrl()
    - storage.service.ts getDownloadUrl() calls supabase.storage.from('photos').createSignedUrl(3600)
    - storage.service.ts deleteFile() calls supabase.storage.from('photos').remove()
    - photos.service.ts requestUploadUrl() returns {uploadUrl, storageKey, expiresAt}
    - photos.controller.ts has POST /photos/upload-url (owner/scaffolder), POST /photos, GET /photos/job/:jobId, PATCH /photos/:id/approve (admin), DELETE /photos/:id
    - photos.service.ts create() and approve() call auditService.log()
    - StorageModule exports StorageService
  </acceptance_criteria>
  <done>Photos module enables file upload via Supabase presigned URLs. Photo records are stored in the database with approval workflow. All photo operations write audit logs. Admin can approve photos. Download URLs are generated on demand.</done>
</task>

</tasks>

<verification>
- GET /jobs returns job list when authenticated
- POST /jobs creates a job in DRAFT status
- PATCH /jobs/:id/status with invalid transition returns 400 BadRequestException
- POST /quotes as non-assigned scaffolder returns 403 ForbiddenException
- POST /quotes as assigned scaffolder on QUOTE_SUBMITTED job returns 201 with quote
- PATCH /quotes/:id/respond as owner updates quote status and logs audit entry
- POST /photos/upload-url returns {uploadUrl, storageKey, expiresAt}
- GET /photos/job/:jobId returns photos with signed download URLs
- PATCH /photos/:id/approve as admin returns updated photo with approved: true
</verification>

<success_criteria>
Jobs module enforces the full state machine. Quotes module handles submission and accept/reject. Photos module provides Supabase presigned URLs for upload and download. All state-changing operations write audit log entries. All requirement IDs covered: API-04, API-05, API-06, API-07.
</success_criteria>

<output>
After completion, create .planning/phases/01-backend-foundation/02-DOMAIN-MODELS-SUMMARY.md summarizing what was built.
</output>
