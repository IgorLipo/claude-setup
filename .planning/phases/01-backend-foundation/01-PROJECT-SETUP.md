---
phase: 01-backend-foundation
plan: '01'
type: execute
wave: '1'
depends_on: []
files_modified:
  - solar-ops/backend/package.json
  - solar-ops/backend/tsconfig.json
  - solar-ops/backend/nest-cli.json
  - solar-ops/backend/.env.example
  - solar-ops/backend/.gitignore
  - solar-ops/backend/Dockerfile
  - solar-ops/backend/docker-compose.yml
  - solar-ops/backend/src/main.ts
  - solar-ops/backend/src/app.module.ts
  - solar-ops/backend/src/common/enums/role.enum.ts
  - solar-ops/backend/src/common/enums/job-status.enum.ts
  - solar-ops/backend/src/common/decorators/roles.decorator.ts
  - solar-ops/backend/src/common/filters/all-exceptions.filter.ts
  - solar-ops/backend/prisma/schema.prisma
autonomous: true
requirements:
  - API-01
  - API-02
  - API-09
  - API-03
  - API-11
  - API-12
user_setup: []
must_haves:
  truths:
    - "NestJS API serves all REST endpoints and is runnable locally"
    - "PostgreSQL database is provisioned with Prisma migrations applied"
    - "Clerk auth integration authenticates users and returns session tokens"
    - "Users have assigned roles (Admin, Owner, Scaffolder, Engineer) enforced on protected routes"
    - "Sentry captures and reports unhandled exceptions from the API"
    - "All state transitions write audit log entries with timestamp, user, and action"
  artifacts:
    - path: solar-ops/backend/src/main.ts
      provides: NestJS bootstrap with Sentry filter
      min_lines: 20
    - path: solar-ops/backend/src/app.module.ts
      provides: Root module wiring all feature modules
      min_lines: 30
    - path: solar-ops/backend/prisma/schema.prisma
      provides: All domain models
      contains: model User, model Job, model Quote, model Photo, model AuditLog, model Notification, model Consent
    - path: solar-ops/backend/src/auth/auth.service.ts
      provides: Clerk auth service
      exports: validateToken, createSession
    - path: solar-ops/backend/src/common/enums/role.enum.ts
      provides: Role enum
      contains: Admin, Owner, Scaffolder, Engineer
    - path: solar-ops/backend/src/common/enums/job-status.enum.ts
      provides: JobStatus enum
      contains: Draft, Submitted, PhotoReview, QuoteSubmitted, Negotiating, Scheduled, InProgress, Completed, Cancelled
  key_links:
    - from: solar-ops/backend/src/app.module.ts
      to: solar-ops/backend/src/auth/auth.module.ts
      via: imports array
    - from: solar-ops/backend/src/app.module.ts
      to: solar-ops/backend/prisma/schema.prisma
      via: PrismaModule import
---

<objective>
Set up the NestJS project foundation: project scaffolding, Prisma schema with all models, Clerk auth integration, common enums/decorators/filters, and Docker-based local development environment.
</objective>

<execution_context>
@/Users/igorlipovetsky/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
This is a greenfield NestJS backend project. The full directory structure to create is defined in the phase planning context. All domain models (User, Job, Quote, Photo, AuditLog, Notification, Consent) must be defined in the Prisma schema. Clerk auth uses JWT verification with the @clerk/clerk-sdk-node library. Sentry uses @sentry/nestjs.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold NestJS project with config files</name>
  <files>solar-ops/backend/package.json, solar-ops/backend/tsconfig.json, solar-ops/backend/nest-cli.json, solar-ops/backend/.env.example, solar-ops/backend/.gitignore, solar-ops/backend/Dockerfile, solar-ops/backend/docker-compose.yml</files>
  <read_first>/dev/null</read_first>
  <action>
Create the solar-ops/backend directory structure with all configuration files.

**package.json** must contain:
- name: "solar-ops-backend"
- version: "1.0.0"
- scripts: start (node dist/main), start:dev (nest start --watch), build (nest build), test (jest), test:e2e (jest --config ./test/jest-e2e.json), prisma:generate (prisma generate), prisma:migrate (prisma migrate dev), prisma:studio (prisma studio)
- dependencies: @nestjs/common, @nestjs/core, @nestjs/platform-express, @nestjs/config, @nestjs/swagger, @prisma/client, prisma (dev), @clerk/clerk-sdk-node, @sentry/nestjs, @sentry/node, bullmq, ioredis, pdfkit, ics, uuid, class-validator, class-transformer, reflect-metadata, rxjs
- devDependencies: @nestjs/cli, @nestjs/testing, jest, @types/jest, typescript, ts-jest, ts-node, @types/node, @types/pdfkit, @types/uuid

**tsconfig.json**: target ES2021, module commonjs, strict true, decoratorMetadata true, experimentalDecorators true, paths: {"@/*": ["src/*"]}

**nest-cli.json**: collection @nestjs/schematics, sourceRoot src, compilerOptions: webpack enabled, tsConfigPath tsconfig.json

**.env.example**:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/solar_ops
REDIS_URL=redis://localhost:6379
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
SENTRY_DSN=https://...@sentry.io/...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=...
PORT=3000
NODE_ENV=development
```

**.gitignore**: node_modules/, dist/, .env, .env.local, coverage/, .nyc_output/, *.log, .DS_Store

**Dockerfile**:
- Base: node:20-alpine
- Install dependencies with npm ci
- Copy source, run prisma generate
- Build with nest build
- Expose port 3000
- HEALTHCHECK: curl -f http://localhost:3000/health || exit 1
- CMD: node dist/main

**docker-compose.yml**:
- postgres service: image postgres:16-alpine, port 5432, env POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres POSTGRES_DB=solar_ops, volume solar_ops_db:/var/lib/postgresql/data, healthcheck
- redis service: image redis:7-alpine, port 6379, no password (or redis.conf for auth if needed), healthcheck
- backend service: build ., ports 3000:3000, depends_on postgres and redis, env from .env (bind to localhost for dev), volumes for hot reload
- Define networks: solar_ops_network
- volumes: solar_ops_db

**src/main.ts**:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SentryFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new SentryFilter());
  app.enableCors({ origin: '*' });
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

**src/app.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { QuotesModule } from './quotes/quotes.module';
import { PhotosModule } from './photos/photos.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { StorageModule } from './storage/storage.module';
import { GdprModule } from './gdpr/gdpr.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    JobsModule,
    QuotesModule,
    PhotosModule,
    SchedulingModule,
    NotificationsModule,
    ReportsModule,
    AuditModule,
    StorageModule,
    GdprModule,
  ],
})
export class AppModule {}
```

**src/common/enums/role.enum.ts**:
```typescript
export enum Role {
  ADMIN = 'Admin',
  OWNER = 'Owner',
  SCAFFOLDER = 'Scaffolder',
  ENGINEER = 'Engineer',
}
```

**src/common/enums/job-status.enum.ts**:
```typescript
export enum JobStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  PHOTO_REVIEW = 'PhotoReview',
  QUOTE_SUBMITTED = 'QuoteSubmitted',
  NEGOTIATING = 'Negotiating',
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}
```

**src/common/decorators/roles.decorator.ts**:
```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

**src/common/filters/all-exceptions.filter.ts**:
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Sentry } from '@sentry/nestjs';

@Catch()
export class SentryFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    response.status(status).json({
      statusCode: status,
      message: exception instanceof HttpException ? exception.getMessage() : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
```
  </action>
  <verify>
    <automated>ls solar-ops/backend/package.json && grep -q '"@nestjs/common"' solar-ops/backend/package.json && grep -q '"prisma"' solar-ops/backend/package.json</automated>
  </verify>
  <acceptance_criteria>
    - package.json exists at solar-ops/backend/package.json with all listed dependencies
    - tsconfig.json has strict:true, decoratorMetadata:true, experimentalDecorators:true
    - nest-cli.json has collection @nestjs/schematics
    - .env.example contains DATABASE_URL=, CLERK_SECRET_KEY=, SENTRY_DSN=, SUPABASE_URL=, PORT=3000
    - Dockerfile has HEALTHCHECK curl -f http://localhost:3000/health
    - docker-compose.yml defines postgres, redis, and backend services with healthchecks
    - src/main.ts calls app.useGlobalFilters(new SentryFilter()) and app.listen on PORT
    - src/app.module.ts imports all 11 feature modules plus ConfigModule and PrismaModule
    - src/common/enums/role.enum.ts exports enum with Admin, Owner, Scaffolder, Engineer
    - src/common/enums/job-status.enum.ts exports enum with all 9 job states
    - src/common/decorators/roles.decorator.ts exports Roles() decorator using SetMetadata
    - src/common/filters/all-exceptions.filter.ts imports Sentry and calls captureException
  </acceptance_criteria>
  <done>Project scaffolding complete: NestJS app bootstraps with Sentry, Docker compose brings up postgres+redis, all config files exist with correct content</done>
</task>

<task type="auto">
  <name>Task 2: Create Prisma schema with all domain models</name>
  <files>solar-ops/backend/prisma/schema.prisma</files>
  <read_first>/dev/null</read_first>
  <action>
Create solar-ops/backend/prisma/schema.prisma with PostgreSQL as provider.

**Models to create:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(uuid())
  clerkId     String   @unique
  email       String   @unique
  name        String?
  role        Role     @default(OWNER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  jobs        Job[]    @relation("JobOwner")
  assignedJobs Job[]   @relation("JobScaffolder")
  quotes      Quote[]
  photos      Photo[]
  auditLogs   AuditLog[]
  notifications Notification[]
  consents    Consent[]
}

enum Role {
  Admin
  Owner
  Scaffolder
  Engineer
}

model Job {
  id            String    @id @default(uuid())
  title         String
  description   String?
  address       String
  latitude      Float?
  longitude     Float?
  status        JobStatus @default(DRAFT)
  ownerId       String
  owner         User      @relation("JobOwner", fields: [ownerId], references: [id])
  scaffolderId  String?
  scaffolder    User?     @relation("JobScaffolder", fields: [scaffolderId], references: [id])
  quotes        Quote[]
  photos        Photo[]
  auditLogs     AuditLog[]
  scheduledDate DateTime?
  scheduledDuration Int? // minutes
  completionDate DateTime?
  completionNotes String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum JobStatus {
  Draft
  Submitted
  PhotoReview
  QuoteSubmitted
  Negotiating
  Scheduled
  InProgress
  Completed
  Cancelled
}

model Quote {
  id          String      @id @default(uuid())
  jobId       String
  job         Job         @relation(fields: [jobId], references: [id])
  scaffolderId String
  scaffolder  User        @relation(fields: [scaffolderId], references: [id])
  amount      Float
  notes       String?
  status      QuoteStatus @default(PENDING)
  submittedAt DateTime    @default(now())
  respondedAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum QuoteStatus {
  Pending
  Accepted
  Rejected
}

model Photo {
  id          String       @id @default(uuid())
  jobId       String
  job         Job          @relation(fields: [jobId], references: [id])
  uploadedById String
  uploadedBy  User         @relation(fields: [uploadedById], references: [id])
  url         String
  storageKey  String       // Supabase storage key
  caption     String?
  approved    Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model AuditLog {
  id          String   @id @default(uuid())
  jobId       String?
  job         Job?     @relation(fields: [jobId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      String   // e.g., "STATUS_CHANGE", "QUOTE_SUBMITTED"
  entityType  String   // e.g., "Job", "Quote"
  entityId    String
  previousValue String?
  newValue    String?
  metadata    Json?
  timestamp   DateTime @default(now())
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // e.g., "QUOTE_SUBMITTED", "JOB_SCHEDULED"
  title     String
  message   String
  read      Boolean  @default(false)
  metadata  Json?
  createdAt DateTime @default(now())
}

model Consent {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // e.g., "GDPR_DATA_PROCESSING", "MARKETING"
  granted   Boolean
  grantedAt DateTime @default(now())
  revokedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Also create prisma/prisma.module.ts and prisma/prisma.service.ts:
```typescript
// prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

// prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```
  </action>
  <verify>
    <automated>grep -q 'model User' solar-ops/backend/prisma/schema.prisma && grep -q 'model Job' solar-ops/backend/prisma/schema.prisma && grep -q 'model Quote' solar-ops/backend/prisma/schema.prisma && grep -q 'model Photo' solar-ops/backend/prisma/schema.prisma && grep -q 'model AuditLog' solar-ops/backend/prisma/schema.prisma && grep -q 'model Notification' solar-ops/backend/prisma/schema.prisma && grep -q 'model Consent' solar-ops/backend/prisma/schema.prisma</automated>
  </verify>
  <acceptance_criteria>
    - prisma/schema.prisma has datasource provider "postgresql" with url env("DATABASE_URL")
    - prisma/schema.prisma has generator client with provider "prisma-client-js"
    - User model has: id, clerkId (unique), email (unique), name, role (default OWNER), createdAt, updatedAt
    - Job model has: id, title, description, address, latitude, longitude, status (default DRAFT), ownerId, scaffolderId, quotes, photos, scheduledDate, scheduledDuration, completionDate, completionNotes, createdAt, updatedAt
    - Quote model has: id, jobId, scaffolderId, amount, notes, status (default Pending), submittedAt, respondedAt, createdAt, updatedAt
    - Photo model has: id, jobId, uploadedById, url, storageKey, caption, approved (default false), createdAt, updatedAt
    - AuditLog model has: id, jobId (optional), userId, action, entityType, entityId, previousValue, newValue, metadata (Json), timestamp
    - Notification model has: id, userId, type, title, message, read (default false), metadata, createdAt
    - Consent model has: id, userId, type, granted, grantedAt, revokedAt, createdAt, updatedAt
    - Role enum: Admin, Owner, Scaffolder, Engineer
    - JobStatus enum: Draft, Submitted, PhotoReview, QuoteSubmitted, Negotiating, Scheduled, InProgress, Completed, Cancelled
    - QuoteStatus enum: Pending, Accepted, Rejected
    - prisma/prisma.service.ts extends PrismaClient and implements OnModuleInit/OnModuleDestroy
    - prisma/prisma.module.ts is @Global() and exports PrismaService
  </acceptance_criteria>
  <done>Prisma schema has all models with correct fields, enums, and relations. PrismaModule provides PrismaService globally.</done>
</task>

<task type="auto">
  <name>Task 3: Create Auth module with Clerk integration and role guards</name>
  <files>solar-ops/backend/src/auth/auth.module.ts, solar-ops/backend/src/auth/auth.controller.ts, solar-ops/backend/src/auth/auth.service.ts, solar-ops/backend/src/auth/clerk/clerk.service.ts, solar-ops/backend/src/auth/clerk/clerk.strategy.ts, solar-ops/backend/src/auth/guards/jwt-auth.guard.ts, solar-ops/backend/src/auth/guards/roles.guard.ts, solar-ops/backend/src/users/users.module.ts, solar-ops/backend/src/users/users.controller.ts, solar-ops/backend/src/users/users.service.ts, solar-ops/backend/src/users/entities/user.entity.ts</files>
  <read_first>/dev/null</read_first>
  <action>
Create the complete Auth module with Clerk JWT verification and Users module.

**src/auth/auth.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClerkService } from './clerk/clerk.service';
import { ClerkStrategy } from './clerk/clerk.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, ClerkService, ClerkStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthService, ClerkService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
```

**src/auth/auth.service.ts**:
```typescript
import { Injectable } from '@nestjs/common';
import { ClerkService } from './clerk/clerk.service';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private clerkService: ClerkService,
    private usersService: UsersService,
  ) {}

  async validateToken(token: string) {
    const clerkUser = await this.clerkService.verifyToken(token);
    if (!clerkUser) return null;
    return this.usersService.findOrCreateUser(clerkUser);
  }

  async getUserFromClerkId(clerkId: string) {
    return this.usersService.findByClerkId(clerkId);
  }

  async updateUserRole(clerkId: string, role: Role) {
    return this.usersService.updateRole(clerkId, role);
  }
}
```

**src/auth/auth.controller.ts**:
```typescript
import { Controller, Post, Get, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('clerk/webhook')
  async clerkWebhook(@Body() body: any) {
    // Handle Clerk webhook - user creation/updates
    return { received: true };
  }

  @Post('clerk/callback')
  @HttpCode(HttpStatus.OK)
  async clerkCallback(@Body() body: { token: string }) {
    const user = await this.authService.validateToken(body.token);
    if (!user) throw new Error('Invalid token');
    return { user, token: body.token };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return req.user;
  }

  @Post('admin/assign-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async assignRole(@Body() body: { clerkId: string; role: Role }) {
    const user = await this.authService.updateUserRole(body.clerkId, body.role);
    return { user };
  }
}
```

**src/auth/clerk/clerk.service.ts**:
```typescript
import { Injectable } from '@nestjs/common';
import { Clerk } from '@clerk/clerk-sdk-node';

@Injectable()
export class ClerkService {
  private clerk: Clerk;

  constructor() {
    this.clerk = new Clerk({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }

  async verifyToken(token: string) {
    try {
      const payload = await this.clerk.verifyToken(token);
      return payload;
    } catch {
      return null;
    }
  }

  async getUser(clerkId: string) {
    return this.clerk.users.getUser(clerkId);
  }

  async createUser(params: { emailAddress: string; firstName?: string; lastName?: string }) {
    return this.clerk.users.createUser(params);
  }
}
```

**src/auth/clerk/clerk.strategy.ts**:
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
    }, async (payload: any, done: any) => {
      const user = await this.authService.validateToken(payload.token);
      if (user) return done(null, user);
      return done(null, false);
    });
  }
}
```

**src/auth/guards/jwt-auth.guard.ts**:
```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('clerk') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) throw err || new UnauthorizedException();
    return user;
  }
}
```

**src/auth/guards/roles.guard.ts**:
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

**src/users/users.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

**src/users/users.service.ts**:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateUser(clerkUser: any) {
    const { id: clerkId, emailAddresses, firstName, lastName } = clerkUser;
    const email = emailAddresses[0]?.emailAddress;
    let user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          clerkId,
          email,
          name: [firstName, lastName].filter(Boolean).join(' '),
          role: Role.OWNER,
        },
      });
    }
    return user;
  }

  async findByClerkId(clerkId: string) {
    return this.prisma.user.findUnique({ where: { clerkId } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateRole(clerkId: string, role: Role) {
    return this.prisma.user.update({
      where: { clerkId },
      data: { role },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }
}
```

**src/users/users.controller.ts**:
```typescript
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
```

**src/users/entities/user.entity.ts**:
```typescript
export class User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
```
  </action>
  <verify>
    <automated>grep -q 'class AuthService' solar-ops/backend/src/auth/auth.service.ts && grep -q 'class ClerkService' solar-ops/backend/src/auth/clerk/clerk.service.ts && grep -q 'class JwtAuthGuard' solar-ops/backend/src/auth/guards/jwt-auth.guard.ts && grep -q 'class RolesGuard' solar-ops/backend/src/auth/guards/roles.guard.ts && grep -q 'export.*Roles' solar-ops/backend/src/common/decorators/roles.decorator.ts</automated>
  </verify>
  <acceptance_criteria>
    - auth.service.ts has validateToken() and updateUserRole() methods
    - auth.controller.ts has POST /auth/clerk/webhook, POST /auth/clerk/callback, GET /auth/me, POST /auth/admin/assign-role endpoints
    - clerk.service.ts uses @clerk/clerk-sdk-node Clerk class with secretKey from CLERK_SECRET_KEY env var
    - jwt-auth.guard.ts extends AuthGuard('clerk') and throws UnauthorizedException if no user
    - roles.guard.ts reads ROLES_KEY from Reflector and checks user.role against requiredRoles
    - users.service.ts has findOrCreateUser() that creates user with Role.OWNER if not exists
    - users.controller.ts has GET /users (admin only) and GET /users/:id endpoints
    - Roles decorator uses SetMetadata with ROLES_KEY = 'roles'
  </acceptance_criteria>
  <done>Clerk auth is integrated: JWT tokens are verified, users are upserted in the database, role-based guards protect endpoints, Admin role can assign roles to users</done>
</task>

</tasks>

<verification>
- npm install in solar-ops/backend produces no peerDependency warnings
- docker-compose up builds and starts postgres, redis, and backend containers
- npx prisma migrate dev creates all tables in the database
- curl http://localhost:3000/auth/me without a token returns 401
- Clerk webhook endpoint is reachable at POST /auth/clerk/webhook
- GET /users returns 401 without token, returns data with valid token as Admin
</verification>

<success_criteria>
Project scaffold creates runnable NestJS API with all dependencies. Prisma schema defines all domain models. Auth module validates Clerk JWTs and manages user roles. Docker compose brings up the full stack locally. All requirement IDs covered: API-01, API-02, API-09, API-03, API-11, API-12.
</success_criteria>

<output>
After completion, create .planning/phases/01-backend-foundation/01-PROJECT-SETUP-SUMMARY.md summarizing what was built.
</output>
