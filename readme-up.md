# 🔥 Vorebase — Supabase Clone (Internship Project)

> **An open-source Backend-as-a-Service (BaaS) platform** — built with Nginx, Fastify, MySQL, MinIO, and WebSockets inside a Turborepo monorepo.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Project Structure (Restructured Monorepo)](#4-project-structure-restructured-monorepo)
5. [Services Breakdown](#5-services-breakdown)
6. [Database Schema (MySQL)](#6-database-schema-mysql)
7. [API Contracts](#7-api-contracts)
8. [Implementation Phases](#8-implementation-phases)
9. [Environment Variables](#9-environment-variables)
10. [Development Workflow](#10-development-workflow)
11. [Deployment](#11-deployment)

---

## 1. Project Overview

### What is Vorebase?

Vorebase is a **self-hostable Supabase alternative** that gives developers:

- ✅ **Authentication** — Email/password sign-up, JWT-based sessions
- ✅ **Auto REST API** — Instantly generates CRUD endpoints from database tables
- ✅ **Virtual Row Level Security (RLS)** — Application-layer access control per user/table
- ✅ **Storage** — S3-compatible file storage with JWT-protected uploads/downloads
- ✅ **Realtime** — WebSocket subscriptions for database INSERT/UPDATE/DELETE events
- ✅ **Dashboard (Studio)** — Web UI for managing tables, users, storage, and API keys

### What Makes This Different from Supabase?

| Aspect | Supabase | Vorebase (This Project) |
|:---|:---|:---|
| Database | PostgreSQL | **MySQL** |
| API Generation | PostgREST (Haskell) | **Custom Node.js + Fastify service** |
| Auth | GoTrue (Go) | **Custom Node.js + Fastify service** |
| API Gateway | Kong (Lua) | **Nginx** |
| Storage Backend | S3 (AWS) | **MinIO** (self-hosted S3) |
| Realtime | Elixir Phoenix | **Node.js + ws (WebSocket)** |
| Dashboard | Next.js | **Next.js** |
| RLS | Native Postgres RLS | **Virtual RLS** (application-layer) |

---

## 2. Tech Stack

### Infrastructure

| Layer | Technology | Why |
|:---|:---|:---|
| **API Gateway** | Nginx | Zero-overhead routing in C. Handles SSL, load balancing, reverse proxy to all services. Eliminates Node.js from the proxy layer. |
| **Core Database** | MySQL | Supervisor requirement. Retains existing schema compatibility. |
| **ORM** | Prisma | Type-safe database client. Auto-generated types. Migration management. Currently using PostgreSQL provider — **will switch to MySQL**. |

### Backend Services (All Node.js + Fastify)

| Service | Port | Role |
|:---|:---|:---|
| **Auth Service** | `4001` | Sign-up, sign-in, JWT issuance, password hashing (bcrypt), user management |
| **REST API Service** | `4002` | Auto-generates CRUD endpoints from MySQL tables. Compiles URL query params into raw SQL. Enforces virtual RLS. |
| **Storage API** | `4003` | JWT-gated file upload/download. Delegates actual file I/O to MinIO. |
| **Realtime (WS)** | `4004` | WebSocket server. Broadcasts database change events (INSERT/UPDATE/DELETE) to subscribed clients. |

### Storage

| Technology | Role |
|:---|:---|
| **MinIO** | S3-compatible object storage server (written in Go). Handles file persistence, streaming, and CDN-like access. |

### Frontend

| Technology | Role |
|:---|:---|
| **Next.js 16** | Dashboard UI (Vorebase Studio). Manages projects, tables, auth users, storage, and API keys. |
| **React 19** | UI framework |

### Monorepo Tooling

| Tool | Role |
|:---|:---|
| **Turborepo** | Orchestrates builds, dev servers, and linting across all packages/apps |
| **pnpm** | Fast, disk-efficient package manager with workspace support |
| **TypeScript** | End-to-end type safety |

---

## 3. Architecture

### High-Level Request Flow

```
                          ┌─────────────────────────┐
                          │      Client Apps         │
                          │  (Browser / Mobile /     │
                          │   Server SDK)            │
                          └────────────┬─────────────┘
                                       │
                                       ▼
                          ┌─────────────────────────┐
                          │     Nginx (Gateway)      │
                          │                          │
                          │  • SSL Termination       │
                          │  • /auth/* → :4001       │
                          │  • /rest/* → :4002       │
                          │  • /storage/* → :4003    │
                          │  • /realtime → :4004     │
                          │  • /* → :3000 (Studio)   │
                          └─────┬───┬───┬───┬───┬───┘
                                │   │   │   │   │
                 ┌──────────────┘   │   │   │   └──────────────┐
                 ▼                  ▼   │   ▼                  ▼
         ┌──────────────┐  ┌──────────┐ │ ┌──────────────┐ ┌──────────┐
         │ Auth Service │  │ REST API │ │ │ Storage API  │ │  Studio  │
         │  (Fastify)   │  │ (Fastify)│ │ │  (Fastify)   │ │ (Next.js)│
         │  :4001       │  │  :4002   │ │ │   :4003      │ │  :3000   │
         └──────┬───────┘  └────┬─────┘ │ └──────┬───────┘ └──────────┘
                │               │       │        │
                │               │       │        ▼
                │               │       │  ┌──────────────┐
                │               │       │  │    MinIO      │
                │               │       │  │  (S3 Storage) │
                │               │       │  │   :9000       │
                │               │       │  └──────────────┘
                │               │       │
                └───────────────┼───────┘
                                │
                                ▼
                      ┌──────────────────┐
                      │      MySQL       │
                      │    (Database)    │
                      │     :3306        │
                      └──────────────────┘
                                │
                                │ (CDC / Polling)
                                ▼
                      ┌──────────────────┐
                      │  Realtime (WS)   │
                      │     :4004        │
                      └──────────────────┘
```

### Virtual RLS (Row Level Security) — How It Works

Since MySQL doesn't have native RLS like PostgreSQL, Vorebase implements it at the **application layer**:

```
1. Client sends request: GET /rest/v1/posts?select=id,title

2. Nginx forwards to REST API Service (:4002)

3. REST API Service:
   a. Extracts JWT from Authorization header
   b. Decodes JWT → gets user_id, role
   c. Looks up RLS policies for table "posts"
   d. Compiles SQL: SELECT id, title FROM posts WHERE user_id = '<jwt_user_id>'
                                                      ↑ injected by RLS policy
   e. Executes against MySQL
   f. Returns filtered results
```

---

## 4. Project Structure (Restructured Monorepo)

### Current vs Proposed

```
CURRENT (what you have now)          PROPOSED (restructured)
================================     ================================

bms/                                 bms/
├── apps/                            ├── apps/
│   ├── http-server/ (empty)         │   ├── auth-service/        ← NEW (Fastify)
│   ├── ws-server/ (empty)           │   ├── rest-service/        ← NEW (Fastify)
│   └── web/ (Next.js boilerplate)   │   ├── storage-service/     ← NEW (Fastify)
│                                    │   ├── ws-server/            ← KEPT (rewrite with Fastify-WS)
│                                    │   └── web/                  ← KEPT (becomes Studio dashboard)
│                                    │
├── packages/                        ├── packages/
│   ├── db/ (Prisma + PG)            │   ├── db/                   ← MODIFIED (MySQL provider)
│   ├── ui/ (React components)       │   ├── ui/                   ← KEPT (expand with dashboard components)
│   ├── eslint-config/               │   ├── eslint-config/        ← KEPT
│   └── typescript-config/           │   ├── typescript-config/    ← KEPT
│                                    │   ├── common/               ← NEW (shared types, utils, JWT helpers)
│                                    │   └── query-compiler/       ← NEW (URL → SQL compiler + virtual RLS)
│                                    │
│                                    ├── infra/                    ← NEW
│                                    │   ├── nginx/                ← nginx.conf
│                                    │   └── docker-compose.yml    ← MySQL + MinIO + all services
│                                    │
├── package.json                     ├── package.json
├── pnpm-workspace.yaml              ├── pnpm-workspace.yaml       ← MODIFIED (add infra/)
├── turbo.json                       ├── turbo.json
└── README.md                        └── readme-up.md              ← THIS FILE
```

### Full Proposed Tree

```
bms/
│
├── apps/
│   │
│   ├── auth-service/                      # Authentication microservice
│   │   ├── src/
│   │   │   ├── index.ts                   # Fastify server bootstrap
│   │   │   ├── routes/
│   │   │   │   ├── signup.ts              # POST /auth/v1/signup
│   │   │   │   ├── signin.ts             # POST /auth/v1/signin
│   │   │   │   ├── signout.ts            # POST /auth/v1/signout
│   │   │   │   ├── refresh.ts            # POST /auth/v1/token/refresh
│   │   │   │   ├── user.ts               # GET  /auth/v1/user (current user)
│   │   │   │   └── admin/
│   │   │   │       ├── users.ts           # Admin: list/create/delete users
│   │   │   │       └── keys.ts            # Admin: manage API keys
│   │   │   ├── plugins/
│   │   │   │   ├── jwt.ts                 # JWT sign/verify plugin
│   │   │   │   └── auth-guard.ts          # Request decorator for auth checks
│   │   │   ├── schemas/                   # Fastify JSON schemas for validation
│   │   │   │   ├── signup.schema.ts
│   │   │   │   └── signin.schema.ts
│   │   │   └── utils/
│   │   │       └── password.ts            # bcrypt hash/compare helpers
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── rest-service/                      # Auto REST API microservice
│   │   ├── src/
│   │   │   ├── index.ts                   # Fastify server bootstrap
│   │   │   ├── routes/
│   │   │   │   ├── tables.ts              # Dynamic route: /:table_name
│   │   │   │   ├── rpc.ts                # POST /rest/v1/rpc/:function_name
│   │   │   │   └── schema.ts             # GET  /rest/v1/schema (introspection)
│   │   │   ├── plugins/
│   │   │   │   ├── jwt.ts                 # JWT verification
│   │   │   │   └── rls.ts                # Virtual RLS policy enforcement
│   │   │   ├── compiler/
│   │   │   │   ├── select.ts              # ?select=id,name → SELECT id, name
│   │   │   │   ├── filter.ts             # ?user_id=eq.123 → WHERE user_id = 123
│   │   │   │   ├── order.ts              # ?order=created_at.desc → ORDER BY ...
│   │   │   │   ├── pagination.ts         # ?limit=10&offset=0 → LIMIT/OFFSET
│   │   │   │   └── index.ts              # Compose all compiler stages
│   │   │   └── utils/
│   │   │       ├── introspect.ts          # MySQL INFORMATION_SCHEMA reader
│   │   │       └── sanitize.ts           # SQL injection prevention
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── storage-service/                   # File storage microservice
│   │   ├── src/
│   │   │   ├── index.ts                   # Fastify server bootstrap
│   │   │   ├── routes/
│   │   │   │   ├── buckets.ts             # CRUD on storage buckets
│   │   │   │   ├── objects.ts            # Upload/download/delete files
│   │   │   │   └── signed-url.ts         # Generate time-limited URLs
│   │   │   ├── plugins/
│   │   │   │   ├── jwt.ts                 # JWT verification
│   │   │   │   └── minio.ts              # MinIO client initialization
│   │   │   └── policies/
│   │   │       └── storage-rls.ts        # Bucket-level access policies
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ws-server/                         # Realtime WebSocket server
│   │   ├── src/
│   │   │   ├── index.ts                   # Fastify + @fastify/websocket bootstrap
│   │   │   ├── channels/
│   │   │   │   ├── manager.ts             # Channel subscription manager
│   │   │   │   └── postgres-changes.ts   # (named for API compat, reads MySQL CDC)
│   │   │   ├── cdc/
│   │   │   │   └── mysql-poller.ts       # Polls MySQL for changes → emits events
│   │   │   └── plugins/
│   │   │       └── jwt.ts                 # JWT verification for WS connections
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                               # Dashboard (Vorebase Studio)
│       ├── app/
│       │   ├── layout.tsx                 # Root layout with sidebar nav
│       │   ├── page.tsx                   # Landing / project selector
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx         # Admin login
│       │   │   └── register/page.tsx      # Admin registration
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx             # Dashboard shell (sidebar + header)
│       │   │   ├── projects/
│       │   │   │   ├── page.tsx           # List all projects
│       │   │   │   └── [id]/
│       │   │   │       ├── page.tsx       # Project overview
│       │   │   │       ├── tables/
│       │   │   │       │   ├── page.tsx   # Table editor
│       │   │   │       │   └── [table]/
│       │   │   │       │       └── page.tsx # Row viewer/editor
│       │   │   │       ├── sql/
│       │   │   │       │   └── page.tsx   # SQL editor
│       │   │   │       ├── auth/
│       │   │   │       │   └── page.tsx   # Auth user management
│       │   │   │       ├── storage/
│       │   │   │       │   └── page.tsx   # Storage bucket browser
│       │   │   │       ├── api/
│       │   │   │       │   └── page.tsx   # API docs & keys
│       │   │   │       └── settings/
│       │   │   │           └── page.tsx   # Project settings
│       │   │   └── settings/
│       │   │       └── page.tsx           # Global settings
│       │   └── globals.css
│       ├── components/                    # Dashboard-specific components
│       │   ├── sidebar.tsx
│       │   ├── table-editor/
│       │   ├── sql-editor/
│       │   └── storage-browser/
│       ├── lib/                           # Utility functions
│       │   ├── api.ts                     # API client for backend services
│       │   └── auth.ts                    # Session management
│       ├── next.config.js
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   │
│   ├── db/                                # Database layer (shared)
│   │   ├── prisma/
│   │   │   ├── schema.prisma              # ← MODIFIED: MySQL provider + all models
│   │   │   ├── migrations/
│   │   │   └── src/
│   │   │       └── index.ts               # Prisma client singleton export
│   │   ├── prisma.config.ts
│   │   ├── .env                           # DATABASE_URL (MySQL)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── common/                            # Shared utilities (NEW)
│   │   ├── src/
│   │   │   ├── jwt.ts                     # JWT sign/verify/decode helpers
│   │   │   ├── types.ts                   # Shared TypeScript interfaces
│   │   │   ├── errors.ts                  # Standardized error classes
│   │   │   ├── constants.ts               # Shared constants (ports, names)
│   │   │   └── logger.ts                  # Pino logger configuration
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── query-compiler/                    # URL → SQL compiler (NEW)
│   │   ├── src/
│   │   │   ├── index.ts                   # Main compiler entry
│   │   │   ├── parser.ts                  # Parse URL query params
│   │   │   ├── builder.ts                 # Build parameterized MySQL queries
│   │   │   ├── rls.ts                     # Virtual RLS policy engine
│   │   │   ├── operators.ts               # eq, neq, gt, lt, like, in, is, etc.
│   │   │   └── __tests__/
│   │   │       ├── parser.test.ts
│   │   │       ├── builder.test.ts
│   │   │       └── rls.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                                # Shared React components
│   │   ├── src/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── code.tsx
│   │   │   ├── data-table.tsx             # ← NEW
│   │   │   ├── modal.tsx                  # ← NEW
│   │   │   ├── sidebar.tsx                # ← NEW
│   │   │   ├── input.tsx                  # ← NEW
│   │   │   ├── toast.tsx                  # ← NEW
│   │   │   └── code-editor.tsx            # ← NEW (SQL editor component)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── eslint-config/                     # ESLint configuration (existing)
│   └── typescript-config/                 # TypeScript base configs (existing)
│
├── infra/                                 # Infrastructure configs (NEW)
│   ├── nginx/
│   │   ├── nginx.conf                     # Main Nginx config
│   │   ├── conf.d/
│   │   │   └── vorebase.conf             # Upstream + location blocks
│   │   └── ssl/                           # SSL certificates (gitignored)
│   └── docker-compose.yml                 # MySQL + MinIO + Nginx
│
├── .github/
│   └── workflows/
│       ├── cd_prod.yml
│       └── cd_staging.yml
│
├── .gitignore
├── .npmrc
├── package.json
├── pnpm-workspace.yaml                    # ← MODIFIED: add "infra/*"
├── turbo.json
├── readme-up.md                           # ← THIS FILE
└── README.md
```

---

## 5. Services Breakdown

### 5.1 Auth Service (`apps/auth-service`)

**Port:** `4001`  
**Framework:** Fastify  
**Responsibility:** User identity and access token management

| Endpoint | Method | Description | Auth |
|:---|:---|:---|:---|
| `/auth/v1/signup` | POST | Create new user (email + password) | Public |
| `/auth/v1/signin` | POST | Login → returns access + refresh token | Public |
| `/auth/v1/signout` | POST | Invalidate session | 🔒 JWT |
| `/auth/v1/token/refresh` | POST | Exchange refresh token for new access token | 🔒 Refresh Token |
| `/auth/v1/user` | GET | Get current authenticated user | 🔒 JWT |
| `/auth/v1/user` | PUT | Update user profile/password | 🔒 JWT |
| `/auth/v1/admin/users` | GET | List all users (admin only) | 🔒 Admin JWT |
| `/auth/v1/admin/users/:id` | DELETE | Delete a user | 🔒 Admin JWT |
| `/auth/v1/admin/keys` | POST | Generate project API key (anon/service) | 🔒 Admin JWT |
| `/auth/v1/admin/keys` | GET | List API keys | 🔒 Admin JWT |

**Key Implementation Details:**

- Password hashing: **bcrypt** (10 salt rounds)
- JWT structure:
  ```json
  {
    "sub": "user-uuid",
    "email": "user@example.com",
    "role": "authenticated",    // or "anon", "service_role"
    "project_id": "project-uuid",
    "iat": 1719100000,
    "exp": 1719103600           // 1 hour
  }
  ```
- Refresh tokens: Stored in MySQL `refresh_tokens` table, 7-day expiry
- API Keys: `anon` key (limited, respects RLS) vs `service_role` key (bypasses RLS)

---

### 5.2 REST API Service (`apps/rest-service`)

**Port:** `4002`  
**Framework:** Fastify  
**Responsibility:** Auto-generate CRUD APIs from MySQL tables

| Endpoint | Method | Description | Auth |
|:---|:---|:---|:---|
| `/rest/v1/:table` | GET | Select rows (with filters, ordering, pagination) | 🔒 JWT / API Key |
| `/rest/v1/:table` | POST | Insert row(s) | 🔒 JWT / API Key |
| `/rest/v1/:table` | PATCH | Update row(s) matching filters | 🔒 JWT / API Key |
| `/rest/v1/:table` | DELETE | Delete row(s) matching filters | 🔒 JWT / API Key |
| `/rest/v1/rpc/:fn` | POST | Call a stored procedure / function | 🔒 JWT / API Key |
| `/rest/v1/schema` | GET | Introspect: list tables, columns, types | 🔒 Admin JWT |

**Query Parameter Syntax (Supabase-Compatible):**

```
GET /rest/v1/posts?select=id,title,author:users(name)
                  &published=eq.true
                  &order=created_at.desc
                  &limit=10
                  &offset=0
```

**Compiler Pipeline:**

```
URL Query String
      │
      ▼
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────┐
│   Parser     │ →  │  RLS Engine   │ →  │ SQL Builder   │ →  │ MySQL   │
│  (decode     │    │ (inject WHERE │    │ (parameterized │    │ Execute │
│   params)    │    │  clauses)     │    │  query)        │    │         │
└─────────────┘    └──────────────┘    └──────────────┘    └─────────┘
```

**Supported Filter Operators:**

| Operator | SQL Equivalent | Example |
|:---|:---|:---|
| `eq` | `=` | `?status=eq.active` |
| `neq` | `!=` | `?status=neq.deleted` |
| `gt` | `>` | `?age=gt.18` |
| `gte` | `>=` | `?age=gte.18` |
| `lt` | `<` | `?price=lt.100` |
| `lte` | `<=` | `?price=lte.100` |
| `like` | `LIKE` | `?name=like.*john*` |
| `ilike` | `LIKE` (case-insensitive) | `?name=ilike.*john*` |
| `in` | `IN` | `?id=in.(1,2,3)` |
| `is` | `IS` | `?deleted_at=is.null` |

---

### 5.3 Storage Service (`apps/storage-service`)

**Port:** `4003`  
**Framework:** Fastify  
**Storage Backend:** MinIO (S3-compatible)

| Endpoint | Method | Description | Auth |
|:---|:---|:---|:---|
| `/storage/v1/bucket` | GET | List all buckets | 🔒 JWT |
| `/storage/v1/bucket` | POST | Create a bucket | 🔒 Admin JWT |
| `/storage/v1/bucket/:id` | PUT | Update bucket (public/private toggle) | 🔒 Admin JWT |
| `/storage/v1/bucket/:id` | DELETE | Delete a bucket | 🔒 Admin JWT |
| `/storage/v1/object/:bucket/:path*` | POST | Upload file | 🔒 JWT |
| `/storage/v1/object/:bucket/:path*` | GET | Download file | 🔒 JWT / Public |
| `/storage/v1/object/:bucket/:path*` | DELETE | Delete file | 🔒 JWT |
| `/storage/v1/object/list/:bucket` | POST | List objects in bucket | 🔒 JWT |
| `/storage/v1/object/sign/:bucket/:path*` | POST | Generate signed URL | 🔒 JWT |
| `/storage/v1/object/public/:bucket/:path*` | GET | Public file access (no auth) | Public |

**Upload Flow:**

```
Client → Fastify (JWT check + policy check) → Stream to MinIO → Save metadata to MySQL
```

**Key:** Fastify does NOT hold the file in memory. It pipes the stream directly to MinIO.

---

### 5.4 Realtime / WebSocket Server (`apps/ws-server`)

**Port:** `4004`  
**Framework:** Fastify + `@fastify/websocket`  
**Responsibility:** Push database change events to connected clients

**Connection Flow:**

```
1. Client connects: ws://host:4004/realtime/v1?token=<JWT>

2. Client sends subscription message:
   {
     "type": "subscribe",
     "channel": "public:posts",
     "event": "INSERT",
     "filter": "user_id=eq.abc-123"
   }

3. Server acknowledges:
   { "type": "subscribed", "channel": "public:posts" }

4. When a row is inserted into `posts`:
   {
     "type": "postgres_changes",
     "channel": "public:posts",
     "event": "INSERT",
     "payload": {
       "new": { "id": 1, "title": "Hello", "user_id": "abc-123" },
       "old": null
     }
   }
```

**Change Detection Strategy (MySQL):**

Since MySQL doesn't have PostgreSQL's WAL/logical replication, we use a **polling strategy**:

1. **Polling approach**: A background worker queries `INFORMATION_SCHEMA` and shadow tables to detect changes at intervals (e.g., every 500ms)
2. **Trigger-based approach** (alternative): MySQL triggers write change events to a `_vorebase_changes` audit table, which the WS server polls

---

### 5.5 Dashboard / Studio (`apps/web`)

**Port:** `3000`  
**Framework:** Next.js 16 + React 19

**Pages:**

| Page | Route | Description |
|:---|:---|:---|
| Login | `/login` | Admin authentication |
| Projects | `/projects` | List/create projects |
| Table Editor | `/projects/[id]/tables` | Spreadsheet-like table management |
| Row Editor | `/projects/[id]/tables/[table]` | View/edit/delete rows |
| SQL Editor | `/projects/[id]/sql` | Run raw SQL queries |
| Auth Users | `/projects/[id]/auth` | View/manage authenticated users |
| Storage | `/projects/[id]/storage` | Browse buckets and files |
| API Docs | `/projects/[id]/api` | Auto-generated API documentation |
| Settings | `/projects/[id]/settings` | API keys, RLS policies, project config |

---

## 6. Database Schema (MySQL)

### Switch from PostgreSQL to MySQL

The current Prisma schema uses `provider = "postgresql"`. This will change to:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### Complete Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ============================================
// PLATFORM MODELS (Vorebase internal)
// ============================================

model AdminUser {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hashed
  role      String   @default("admin") // admin | super_admin
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  projects  Project[]
}

model Project {
  id          String   @id @default(uuid())
  name        String
  description String?  @db.Text
  dbName      String   @unique // the MySQL database name for this project
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  adminId     String
  admin       AdminUser @relation(fields: [adminId], references: [id])

  apiKeys     ApiKey[]
  users       User[]
  buckets     StorageBucket[]
  rlsPolicies RlsPolicy[]

  @@index([adminId])
}

model ApiKey {
  id        String   @id @default(uuid())
  key       String   @unique
  name      String   // "anon" | "service_role"
  role      String   // "anon" | "service_role"
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([projectId])
}

// ============================================
// AUTH MODELS (per-project user management)
// ============================================

model User {
  id           String    @id @default(uuid())
  email        String
  password     String    // bcrypt hashed
  role         String    @default("authenticated")
  metadata     Json?     // user_metadata
  appMetadata  Json?     // app_metadata
  lastSignInAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  projectId    String
  project      Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  refreshTokens RefreshToken[]

  @@unique([email, projectId])
  @@index([projectId])
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
}

// ============================================
// STORAGE MODELS
// ============================================

model StorageBucket {
  id        String   @id @default(uuid())
  name      String
  isPublic  Boolean  @default(false)
  fileSizeLimit Int? // in bytes
  allowedMimeTypes Json? // ["image/*", "application/pdf"]
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  objects   StorageObject[]

  @@unique([name, projectId])
  @@index([projectId])
}

model StorageObject {
  id         String   @id @default(uuid())
  name       String   // file path within bucket
  bucketId   String
  bucket     StorageBucket @relation(fields: [bucketId], references: [id], onDelete: Cascade)
  ownerId    String?  // user who uploaded
  mimeType   String?
  size       Int?     // in bytes
  metadata   Json?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([name, bucketId])
  @@index([bucketId])
}

// ============================================
// VIRTUAL RLS POLICIES
// ============================================

model RlsPolicy {
  id         String   @id @default(uuid())
  name       String
  tableName  String
  operation  String   // SELECT | INSERT | UPDATE | DELETE | ALL
  check      Json     // policy expression: { "column": "user_id", "op": "eq", "value": "auth.uid()" }
  roles      Json     @default("[\"authenticated\"]") // which roles this applies to
  projectId  String
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  isEnabled  Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([projectId, tableName])
}

// ============================================
// REALTIME CHANGE TRACKING (for CDC)
// ============================================

model ChangeEvent {
  id        BigInt   @id @default(autoincrement())
  tableName String
  operation String   // INSERT | UPDATE | DELETE
  oldData   Json?
  newData   Json?
  projectId String
  createdAt DateTime @default(now())

  @@index([projectId, createdAt])
  @@index([projectId, tableName])
}
```

---

## 7. API Contracts

### Standard Response Format

**Success:**
```json
{
  "data": [ ... ],
  "count": 42,
  "status": 200
}
```

**Error:**
```json
{
  "error": {
    "message": "Row not found",
    "code": "PGRST116",
    "details": null,
    "hint": null
  },
  "status": 404
}
```

### Authentication Headers

All authenticated requests must include:

```
Authorization: Bearer <jwt_access_token>
```

Or use API key:
```
apikey: <anon_key_or_service_role_key>
```

---

## 8. Implementation Phases

### Phase 1: Foundation & Database Setup ⏱️ Week 1

- [ ] **Switch Prisma to MySQL provider** — Update `schema.prisma`, `prisma.config.ts`, and `.env`
- [ ] **Define full schema** — All models (AdminUser, Project, User, ApiKey, etc.)
- [ ] **Run initial migration** — `prisma migrate dev`
- [ ] **Set up `@repo/common` package** — JWT helpers, shared types, error classes, logger (pino)
- [ ] **Set up Docker Compose** — MySQL 8 + MinIO containers
- [ ] **Update `pnpm-workspace.yaml`** — Add new packages/apps

### Phase 2: Auth Service ⏱️ Week 1–2

- [ ] **Scaffold `auth-service`** — Fastify app with TypeScript
- [ ] **Implement `/auth/v1/signup`** — Email + password → bcrypt hash → save to MySQL → return JWT
- [ ] **Implement `/auth/v1/signin`** — Verify credentials → issue access + refresh token
- [ ] **Implement `/auth/v1/signout`** — Revoke refresh token
- [ ] **Implement `/auth/v1/token/refresh`** — Validate refresh → issue new access token
- [ ] **Implement `/auth/v1/user`** — GET (current user) + PUT (update profile)
- [ ] **Implement Admin endpoints** — `/admin/users` (list, delete), `/admin/keys` (API key management)
- [ ] **Fastify request validation** — JSON Schema for all routes
- [ ] **Write tests** — Unit tests for auth flows

### Phase 3: Query Compiler & REST API Service ⏱️ Week 2–3

- [ ] **Build `@repo/query-compiler`** — Core package:
  - [ ] URL query parser (`?select=id,name&status=eq.active`)
  - [ ] Filter operators (eq, neq, gt, lt, like, in, is, etc.)
  - [ ] ORDER BY compiler
  - [ ] LIMIT/OFFSET pagination
  - [ ] Parameterized query builder (SQL injection safe)
  - [ ] Unit tests for every operator
- [ ] **Scaffold `rest-service`** — Fastify app
- [ ] **Implement dynamic table routes** — `/:table` with GET/POST/PATCH/DELETE
- [ ] **Schema introspection** — Read MySQL `INFORMATION_SCHEMA` to list tables/columns
- [ ] **JWT + API Key verification** — Support both auth methods
- [ ] **Integration tests** — Test against live MySQL

### Phase 4: Virtual RLS Engine ⏱️ Week 3

- [ ] **RLS Policy model** — Define how policies are stored and evaluated
- [ ] **Policy evaluation engine** — Given a request (user JWT + table + operation), compute the WHERE clause
- [ ] **`auth.uid()` resolution** — Replace `auth.uid()` in policies with the JWT `sub` value
- [ ] **anon vs authenticated vs service_role** — Respect role-based access
- [ ] **RLS bypass for `service_role`** — Service role skips all policies
- [ ] **RLS management API** — CRUD for policies from dashboard
- [ ] **Tests** — Comprehensive tests for policy evaluation

### Phase 5: Storage Service ⏱️ Week 3–4

- [ ] **Set up MinIO** — Docker container + create initial bucket
- [ ] **Scaffold `storage-service`** — Fastify app
- [ ] **Implement bucket CRUD** — Create, list, update, delete buckets
- [ ] **Implement file upload** — Stream from client → Fastify (auth check) → MinIO
- [ ] **Implement file download** — MinIO → stream to client
- [ ] **Implement signed URLs** — Time-limited presigned URLs via MinIO SDK
- [ ] **Public bucket access** — No auth required for public buckets
- [ ] **File metadata** — Save size, MIME type, owner in MySQL
- [ ] **Storage policies** — Bucket-level access control

### Phase 6: Realtime / WebSocket Server ⏱️ Week 4

- [ ] **Rewrite `ws-server`** — Fastify + `@fastify/websocket`
- [ ] **JWT auth on connection** — Verify token in query params or first message
- [ ] **Channel subscription** — Subscribe to `schema:table` patterns
- [ ] **MySQL CDC via triggers** — Create triggers that INSERT into `_vorebase_changes` table
- [ ] **Change event poller** — Background loop that reads new changes and broadcasts
- [ ] **Filter support** — Only send events matching client's filter
- [ ] **Connection management** — Handle disconnect, reconnect, heartbeat

### Phase 7: Nginx Gateway ⏱️ Week 4–5

- [ ] **Write `nginx.conf`** — Reverse proxy config:
  ```nginx
  upstream auth_service {
      server 127.0.0.1:4001;
  }
  upstream rest_service {
      server 127.0.0.1:4002;
  }
  upstream storage_service {
      server 127.0.0.1:4003;
  }
  upstream ws_service {
      server 127.0.0.1:4004;
  }
  upstream studio {
      server 127.0.0.1:3000;
  }

  server {
      listen 80;
      server_name _;

      # Auth routes
      location /auth/ {
          proxy_pass http://auth_service;
      }

      # REST API routes
      location /rest/ {
          proxy_pass http://rest_service;
      }

      # Storage routes
      location /storage/ {
          proxy_pass http://storage_service;
          client_max_body_size 50M;
      }

      # WebSocket (Realtime)
      location /realtime/ {
          proxy_pass http://ws_service;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
      }

      # Dashboard (catch-all)
      location / {
          proxy_pass http://studio;
      }
  }
  ```
- [ ] **Docker Compose integration** — Add Nginx container
- [ ] **SSL setup** — Self-signed certs for local dev
- [ ] **Rate limiting** — Basic rate limiting via `limit_req_zone`

### Phase 8: Dashboard (Vorebase Studio) ⏱️ Week 5–7

- [ ] **Auth pages** — Login / Register for admin users
- [ ] **Project management** — Create, list, select projects
- [ ] **Table Editor** — Visual table with inline editing, column management
- [ ] **SQL Editor** — Code editor with syntax highlighting (CodeMirror/Monaco)
- [ ] **Auth User Management** — List users, view details, delete
- [ ] **Storage Browser** — Browse buckets, upload files, preview images, download
- [ ] **API Documentation** — Auto-generated from schema introspection
- [ ] **API Key Management** — Generate/revoke anon & service_role keys
- [ ] **RLS Policy Editor** — Create, edit, toggle policies per table
- [ ] **Settings** — Project config, connection details, danger zone

### Phase 9: Client SDK (JavaScript) ⏱️ Week 7–8

- [ ] **Create `@vorebase/js`** — JavaScript/TypeScript client library
  ```typescript
  import { createClient } from '@vorebase/js'

  const vorebase = createClient('http://localhost', 'anon-key')

  // Auth
  await vorebase.auth.signUp({ email: '...', password: '...' })
  await vorebase.auth.signIn({ email: '...', password: '...' })

  // Database
  const { data } = await vorebase
    .from('posts')
    .select('id, title')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(10)

  // Storage
  await vorebase.storage.from('avatars').upload('pic.jpg', file)

  // Realtime
  vorebase.channel('posts').on('INSERT', (payload) => {
    console.log(payload.new)
  }).subscribe()
  ```

### Phase 10: Testing & Polish ⏱️ Week 8

- [ ] **End-to-end tests** — Full flow: signup → create table → insert data → query → realtime
- [ ] **Error handling** — Consistent error responses across all services
- [ ] **Logging** — Structured logging with Pino in all services
- [ ] **Health checks** — `/health` endpoint in every service
- [ ] **Documentation** — API docs, setup guide, architecture docs
- [ ] **Docker Compose (full stack)** — One command to spin up everything

---

## 9. Environment Variables

### Root `.env` (or per-service)

```env
# ==========================================
# DATABASE
# ==========================================
DATABASE_URL="mysql://root:password@localhost:3306/vorebase"

# ==========================================
# JWT
# ==========================================
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_ACCESS_EXPIRY="1h"
JWT_REFRESH_EXPIRY="7d"

# ==========================================
# MINIO (Storage)
# ==========================================
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_USE_SSL=false

# ==========================================
# SERVICE PORTS
# ==========================================
AUTH_SERVICE_PORT=4001
REST_SERVICE_PORT=4002
STORAGE_SERVICE_PORT=4003
WS_SERVICE_PORT=4004
STUDIO_PORT=3000

# ==========================================
# NGINX
# ==========================================
NGINX_PORT=80
```

---

## 10. Development Workflow

### Prerequisites

- Node.js >= 18
- pnpm 9+
- Docker & Docker Compose (for MySQL + MinIO)
- Turborepo (global): `pnpm add -g turbo`

### Getting Started

```bash
# 1. Clone the repo
git clone <repo-url>
cd bms

# 2. Install dependencies
pnpm install

# 3. Start infrastructure (MySQL + MinIO)
docker compose -f infra/docker-compose.yml up -d

# 4. Set up database
cd packages/db
cp .env.example .env        # configure DATABASE_URL
npx prisma migrate dev      # run migrations
npx prisma generate         # generate client
cd ../..

# 5. Start all services in development
pnpm dev
```

### Turborepo Commands

```bash
pnpm dev               # Start ALL apps + packages in dev mode
pnpm build             # Build everything
pnpm lint              # Lint everything

# Run specific service
turbo dev --filter=auth-service
turbo dev --filter=rest-service
turbo dev --filter=web
```

---

## 11. Deployment

### Docker Compose (Full Stack)

```yaml
# infra/docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: vorebase
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"    # API
      - "9001:9001"    # Console
    volumes:
      - minio_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
    depends_on:
      - mysql
      - minio

volumes:
  mysql_data:
  minio_data:
```

### Production Deployment (PM2 — current setup)

The existing GitHub Actions workflows SSH into the server and use PM2:

```bash
pm2 start dist/index.js --name auth-service
pm2 start dist/index.js --name rest-service
pm2 start dist/index.js --name storage-service
pm2 start dist/index.js --name ws-server
pm2 start npm --name web -- start
```

---

## Key Dependencies (per service)

### auth-service
```json
{
  "fastify": "^5.x",
  "@fastify/cors": "^10.x",
  "bcrypt": "^5.x",
  "jsonwebtoken": "^9.x",
  "@repo/db": "workspace:*",
  "@repo/common": "workspace:*"
}
```

### rest-service
```json
{
  "fastify": "^5.x",
  "@fastify/cors": "^10.x",
  "mysql2": "^3.x",
  "@repo/db": "workspace:*",
  "@repo/common": "workspace:*",
  "@repo/query-compiler": "workspace:*"
}
```

### storage-service
```json
{
  "fastify": "^5.x",
  "@fastify/cors": "^10.x",
  "@fastify/multipart": "^9.x",
  "minio": "^8.x",
  "@repo/db": "workspace:*",
  "@repo/common": "workspace:*"
}
```

### ws-server
```json
{
  "fastify": "^5.x",
  "@fastify/websocket": "^11.x",
  "@repo/db": "workspace:*",
  "@repo/common": "workspace:*"
}
```

---

> **Note:** This plan is aligned with the supervisor's updated stack requirements:
> - ✅ **Nginx** as API Gateway (replaces Express Gateway)
> - ✅ **MySQL** as core database
> - ✅ **Fastify** for all Node.js services (replaces Express)
> - ✅ **MinIO** for storage (replaces Multer)
> - ✅ Existing **Turborepo** monorepo structure preserved and extended
