# 🎤 Mentor Explanation — Vorebase Backend

> Use this as your talking points. Read through it once, then explain in your own words.

---

## 1. Start With the Big Picture (30 seconds)

> "I'm building **Vorebase** — a Supabase clone. It gives developers a ready-made backend with **authentication, auto-generated REST APIs, file storage, and realtime updates** — all from a single dashboard. The key difference is we're using **MySQL instead of PostgreSQL**, and **Nginx instead of Kong** as the API gateway."

---

## 2. The Tech Stack (1 minute)

> "Here's what I'm using and **why**:"

| What | Technology | Why |
|:--|:--|:--|
| API Gateway | **Nginx** | Written in C, zero overhead. Handles SSL, routing, and rate limiting without any Node.js in the proxy layer |
| Database | **MySQL 8** | Supervisor requirement + existing schema compatibility |
| ORM | **Prisma** | Type-safe queries, auto-generated types, easy migrations |
| Backend Services | **Fastify** (Node.js) | 2-3x faster than Express, built-in schema validation, great plugin system |
| File Storage | **MinIO** | Self-hosted S3-compatible storage. We don't depend on AWS |
| Realtime | **WebSockets** (`@fastify/websocket`) | Push DB changes to clients instantly |
| Dashboard | **Next.js 16** | Server components, great DX |
| Monorepo | **Turborepo + pnpm** | Manages all services + shared packages in one repo |

---

## 3. How the Architecture Works (2 minutes)

> "Everything goes through **Nginx** as a single entry point. Nginx looks at the URL path and routes to the right service:"

```
Client (browser/mobile/SDK)
        │
        ▼
   ┌─────────┐
   │  Nginx  │  ← Single entry point (port 80)
   └────┬────┘
        │
        ├── /auth/*     →  Auth Service     (port 4001)
        ├── /rest/*     →  REST API Service  (port 4002)
        ├── /storage/*  →  Storage Service   (port 4003)
        ├── /realtime   →  WebSocket Server  (port 4004)
        └── /*          →  Dashboard/Studio  (port 3000)
```

> "So the client never talks to individual services directly. Nginx handles all the routing, SSL termination, and load balancing."

---

## 4. Explain Each Service (3-4 minutes)

### 🔐 Auth Service (port 4001)

> "This handles all user identity. When a user **signs up**, we hash their password with **bcrypt** (10 salt rounds) and store it in MySQL. Then we issue a **JWT access token** (1 hour expiry) and a **refresh token** (7 days, stored in DB).

> The JWT payload contains the `user_id`, `email`, `role`, and `project_id`. Every other service reads this JWT to know who's making the request.

> We also have **two types of API keys**: 
> - `anon` key — limited access, respects RLS policies
> - `service_role` key — full access, bypasses all security (for server-to-server calls)"

### 📊 REST API Service (port 4002) — *This is the most interesting part*

> "This is where the magic happens. Instead of writing CRUD APIs manually for every table, this service **auto-generates endpoints** from the MySQL schema.

> If you have a `posts` table in MySQL, you automatically get:
> - `GET /rest/v1/posts` — select rows
> - `POST /rest/v1/posts` — insert
> - `PATCH /rest/v1/posts` — update
> - `DELETE /rest/v1/posts` — delete

> It supports **Supabase-compatible query parameters**:
> ```
> GET /rest/v1/posts?select=id,title&published=eq.true&order=created_at.desc&limit=10
> ```

> **How does it convert this URL into SQL?** There's a **compiler pipeline**:"

```
URL query string
      │
      ▼
  ┌────────┐     ┌───────────┐     ┌─────────────┐     ┌───────┐
  │ Parser │ →   │ RLS Engine│ →   │ SQL Builder  │ →   │ MySQL │
  │        │     │ (injects  │     │ (parameterized│     │       │
  │        │     │  WHERE)   │     │  query)       │     │       │
  └────────┘     └───────────┘     └─────────────┘     └───────┘
```

> "The parser breaks down the URL. The RLS engine injects security filters. The SQL builder creates a **parameterized query** (to prevent SQL injection). Then it executes against MySQL."

### 🔒 Virtual RLS (Row Level Security) — *Important to explain*

> "Supabase uses PostgreSQL's native RLS. We can't do that with MySQL — MySQL doesn't have row-level security built in. So we built **Virtual RLS at the application layer**.

> Here's how it works: An admin defines a policy like: *'Users can only see their own posts'*. This is stored as:
> ```json
> { "column": "user_id", "op": "eq", "value": "auth.uid()" }
> ```
> When a request comes in, we extract the `user_id` from the JWT, replace `auth.uid()` with it, and **inject a WHERE clause** into the SQL query automatically. So `SELECT * FROM posts` becomes `SELECT * FROM posts WHERE user_id = '<jwt_user_id>'`.

> The `service_role` API key bypasses RLS entirely — that's for admin/server operations."

### 📁 Storage Service (port 4003)

> "This uses **MinIO** — an open-source S3-compatible object storage. Files are organized into **buckets** (like folders). 

> When a user uploads a file, Fastify checks their JWT, verifies permissions, then **streams the file directly to MinIO** — it doesn't load the whole file into memory. File metadata (size, MIME type, owner) is stored in MySQL.

> We also support **signed URLs** — time-limited links for sharing private files, and **public buckets** where no auth is needed."

### ⚡ Realtime / WebSocket Server (port 4004)

> "This pushes live database changes to connected clients. A client connects via WebSocket and subscribes to a table:
> ```json
> { "type": "subscribe", "channel": "public:posts", "event": "INSERT" }
> ```
> Then whenever a row is inserted into `posts`, the server sends the new data to all subscribers.

> **The challenge with MySQL** is it doesn't have PostgreSQL's WAL/logical replication. So we use a **polling strategy** — MySQL triggers write change events to a `_vorebase_changes` audit table, and a background worker polls this table every 500ms and broadcasts to WebSocket clients."

---

## 5. Database Design (1 minute)

> "We have a **multi-tenant architecture**. There's one central MySQL database with these key models:"

| Model | Purpose |
|:--|:--|
| `AdminUser` | Platform admins who create projects |
| `Project` | Each project gets its own isolated DB namespace (`dbName`) |
| `User` | End-users per project (the developers' users) |
| `ApiKey` | `anon` and `service_role` keys per project |
| `RefreshToken` | Stored refresh tokens with expiry and revocation |
| `StorageBucket` / `StorageObject` | File storage metadata |
| `RlsPolicy` | Virtual RLS rules per table per project |
| `ChangeEvent` | CDC audit log for realtime |

> "All managed through **Prisma** with the MySQL provider. Migrations are version-controlled."

---

## 6. Shared Packages (30 seconds)

> "Since this is a monorepo, I've extracted shared code into packages:"
> - **`@repo/common`** — JWT helpers, error classes, logger (Pino), shared TypeScript types
> - **`@repo/query-compiler`** — The URL-to-SQL compiler engine (reusable and independently testable)
> - **`@repo/db`** — Prisma client singleton, shared across all services
> - **`@repo/ui`** — Shared React components for the dashboard

---

## 7. How Requests Flow End-to-End (1 minute)

> "Let me walk through a real example. Say a user queries their posts:"

```
1. Client sends:  GET /rest/v1/posts?select=id,title&published=eq.true
   with header:   Authorization: Bearer <JWT>

2. Nginx receives it, sees /rest/*, forwards to port 4002

3. REST API Service:
   a. Extracts JWT from header → decodes → gets user_id, role
   b. Looks up RLS policies for "posts" table
   c. Parser converts URL params into query components
   d. RLS engine injects: WHERE user_id = '<from_jwt>'
   e. SQL Builder creates: SELECT id, title FROM posts 
                           WHERE published = ? AND user_id = ?
                           (parameterized — SQL injection safe)
   f. Executes against MySQL
   g. Returns: { "data": [...], "count": 5, "status": 200 }

4. Response flows back through Nginx to the client
```

---

## 8. Client SDK — `@vorebase/js` (1 minute)

> "All the services I described work via raw HTTP and WebSocket — but we don't want developers making raw `fetch` calls. So in **Phase 9**, I'm building a **JavaScript/TypeScript client SDK** called `@vorebase/js`.

> It works exactly like the Supabase JS client. The developer installs one package and gets a clean API for everything:"

```javascript
import { createClient } from '@vorebase/js'
const vb = createClient('http://localhost', 'your-anon-key')

// Auth — no backend code needed
await vb.auth.signUp({ email: 'user@test.com', password: '123456' })
await vb.auth.signIn({ email: 'user@test.com', password: '123456' })

// Database — no SQL, no REST routes to write
const { data } = await vb
  .from('posts')
  .select('id, title, author')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(10)

// Storage — no multer, no S3 config
await vb.storage.from('avatars').upload('pic.jpg', file)
const url = vb.storage.from('avatars').getPublicUrl('pic.jpg')

// Realtime — no WebSocket boilerplate
vb.channel('posts')
  .on('INSERT', (payload) => console.log('New post!', payload.new))
  .on('DELETE', (payload) => console.log('Deleted!', payload.old))
  .subscribe()
```

> "Under the hood, `.from('posts').select('id, title').eq('published', true)` just builds the URL `GET /rest/v1/posts?select=id,title&published=eq.true` and sends it with the JWT in the header. The SDK is a thin wrapper — the real logic is in the backend services.

> **This is what makes it a true BaaS** — the developer creates tables from the dashboard, installs our SDK, and has a full backend without writing any server code."

---

## 9. Deployment (30 seconds)

> "For infrastructure, **Docker Compose** spins up MySQL, MinIO, and Nginx. The Node.js services run via **PM2** in production. We have **GitHub Actions CI/CD** — it SSHs into the server, pulls latest code, builds, and restarts PM2 processes."

---

## 10. Implementation Timeline (30 seconds)

> "I've broken it into 10 phases over 8 weeks:
> 1. **Week 1**: Database setup, Prisma → MySQL, shared packages, Docker
> 2. **Week 1-2**: Auth service (signup, signin, JWT, admin endpoints)
> 3. **Week 2-3**: Query compiler + REST API service
> 4. **Week 3**: Virtual RLS engine
> 5. **Week 3-4**: Storage service with MinIO
> 6. **Week 4**: Realtime WebSocket server
> 7. **Week 4-5**: Nginx gateway config
> 8. **Week 5-7**: Dashboard UI (Vorebase Studio)
> 9. **Week 7-8**: JavaScript client SDK
> 10. **Week 8**: Testing, polish, documentation"

---

## 11. 💡 If Your Mentor Asks These Questions

| Question | Your Answer |
|:--|:--|
| **"Why not just use Supabase?"** | "This is a learning project to deeply understand how BaaS platforms work internally — auth, query compilation, RLS, realtime — by building each piece from scratch." |
| **"Why MySQL over PostgreSQL?"** | "Supervisor requirement. It also forced us to solve interesting problems like implementing RLS at the application layer instead of relying on Postgres-native features." |
| **"Why Nginx instead of an Express gateway?"** | "Nginx is written in C — near-zero latency for proxying. It handles SSL, rate limiting, and load balancing natively. No point running another Node.js process just for routing." |
| **"How do you prevent SQL injection?"** | "The query compiler outputs **parameterized queries** with placeholders (`?`). User values are never concatenated into SQL strings. Plus we have a sanitization layer that validates table/column names against the schema." |
| **"What about horizontal scaling?"** | "Each service is stateless (JWT-based, no server sessions). You can run multiple instances behind Nginx's load balancer. MySQL and MinIO are the only stateful components." |
| **"How is this different from just building a REST API?"** | "The key difference is **auto-generation**. You don't write endpoints — you create a MySQL table and instantly get full CRUD. Plus you get auth, storage, realtime, and RLS out of the box." |
