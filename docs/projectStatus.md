# Vorebase — Project Status Report

## What is Vorebase?

Vorebase is a **Supabase clone** — a Backend-as-a-Service (BaaS) platform that gives developers a ready-made backend without writing server code. It provides **Authentication, Auto REST APIs, File Storage, Realtime updates, and a Dashboard** — all built on MySQL, Nginx, Fastify, and MinIO inside a Turborepo monorepo.

## Key Features

- **Auth** — Email/password signup, JWT sessions, API key management
- **Auto REST API** — Create a database table → instantly get CRUD endpoints
- **Virtual RLS** — Application-layer row-level security (since MySQL lacks native RLS)
- **Storage** — S3-compatible file storage via MinIO
- **Realtime** — WebSocket subscriptions for live database changes
- **Dashboard (Studio)** — Web UI for managing everything

## ✅ Completed

- Turborepo monorepo setup (pnpm workspaces)
- CI/CD pipelines (GitHub Actions — staging & production)
- Deployment setup with PM2
- Dashboard frontend (Next.js 16) — all pages built with mock data:
  - Login / Register pages
  - Project list & create project
  - Project home with stats
  - **Table Editor** (spreadsheet-like UI)
  - **SQL Editor** (with CodeMirror)
  - Auth user management & RLS policies
  - Storage browser (buckets & files)
  - API documentation page
  - Database schema viewer
  - Logs viewer
  - Settings (general, API keys, danger zone)
- Basic HTTP server and WebSocket server scaffolding

## 🔲 Remaining

- Switch Prisma from PostgreSQL → MySQL
- Auth Service (Fastify — signup, signin, JWT, refresh tokens)
- REST API Service (URL → SQL query compiler, dynamic CRUD)
- Virtual RLS engine (policy evaluation, WHERE clause injection)
- Storage Service (MinIO integration, streaming uploads)
- Realtime WebSocket server (MySQL CDC via triggers/polling)
- Nginx gateway configuration
- Connect frontend to backend (replace mock data with real API calls)
- Client SDK (`@vorebase/js`)
- Testing & documentation
