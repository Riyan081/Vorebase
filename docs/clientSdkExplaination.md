# 🧠 How the Client SDK Works — Deep Explanation

> This explains how `@vorebase/js` works **internally** so you can explain it to your mentor.

---

## The Big Idea (Tell Your Mentor This First)

> "The SDK is just a **wrapper around `fetch()` and `WebSocket`**. Every method the developer calls gets converted into an HTTP request or WebSocket message that hits our backend services through Nginx. The developer writes clean JavaScript — the SDK builds the ugly URLs and headers behind the scenes."

```
Developer writes:                    SDK sends:
─────────────────                    ──────────
vb.from('posts')                     GET /rest/v1/posts
  .select('id, title')               ?select=id,title
  .eq('published', true)       →     &published=eq.true
  .order('created_at')               &order=created_at.desc
  .limit(10)                         &limit=10
                                     Authorization: Bearer <jwt>
```

**That's all a client SDK is — a URL builder + HTTP client + token manager.**

---

## How `createClient` Works

```javascript
import { createClient } from '@vorebase/js'
const vb = createClient('http://localhost', 'your-anon-key')
```

Internally, `createClient` does this:

```
createClient('http://localhost', 'anon-key')
        │
        ▼
┌─────────────────────────────────────┐
│  VorebaseClient {                   │
│    baseUrl: 'http://localhost'       │  ← Stores the Nginx URL
│    apiKey: 'anon-key'               │  ← Stored, sent as header on every request
│    accessToken: null                 │  ← Filled after signIn()
│    refreshToken: null               │  ← Filled after signIn()
│                                     │
│    auth: AuthClient(baseUrl)        │  ← Sub-module for /auth/* endpoints
│    storage: StorageClient(baseUrl)  │  ← Sub-module for /storage/* endpoints
│    channel(): RealtimeClient()      │  ← Sub-module for WebSocket
│    from(): QueryBuilder()           │  ← Sub-module for /rest/* endpoints
│  }                                  │
└─────────────────────────────────────┘
```

> **Tell your mentor:** "createClient just saves the server URL and API key, then creates 4 sub-modules — each one knows how to talk to one of our backend services."

---

## How `.from().select().eq()` Works (Query Builder Pattern)

This is the most important part. The developer writes:

```javascript
const { data } = await vb
  .from('posts')
  .select('id, title')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(10)
```

### What Happens Step by Step:

```
Step 1: .from('posts')
        → Creates a new QueryBuilder object
        → Sets: tableName = 'posts'
        → Returns: QueryBuilder (so you can chain)

Step 2: .select('id, title')
        → Sets: selectColumns = 'id,title'
        → Returns: QueryBuilder (chaining continues)

Step 3: .eq('published', true)
        → Adds to filters array: { column: 'published', op: 'eq', value: 'true' }
        → Returns: QueryBuilder

Step 4: .order('created_at', { ascending: false })
        → Sets: orderBy = 'created_at.desc'
        → Returns: QueryBuilder

Step 5: .limit(10)
        → Sets: limitValue = 10
        → Returns: QueryBuilder

Step 6: await (triggers .then() → internally calls execute())
        → Builds URL: /rest/v1/posts?select=id,title&published=eq.true&order=created_at.desc&limit=10
        → Sends: fetch('http://localhost/rest/v1/posts?...', {
             headers: {
               'Authorization': 'Bearer <jwt_token>',
               'apikey': 'anon-key'
             }
           })
        → Parses JSON response
        → Returns: { data: [...], count: 10, status: 200 }
```

### The Actual Code Would Look Like This:

```typescript
class QueryBuilder {
  private tableName: string
  private selectStr: string = '*'
  private filters: string[] = []
  private orderStr: string = ''
  private limitVal: number | null = null
  private baseUrl: string
  private headers: Record<string, string>

  constructor(baseUrl: string, table: string, headers: Record<string, string>) {
    this.baseUrl = baseUrl
    this.tableName = table
    this.headers = headers
  }

  select(columns: string) {
    this.selectStr = columns.replace(/\s/g, '')
    return this  // ← Returns itself, enabling chaining
  }

  eq(column: string, value: any) {
    this.filters.push(`${column}=eq.${value}`)
    return this  // ← Returns itself
  }

  gt(column: string, value: any) {
    this.filters.push(`${column}=gt.${value}`)
    return this
  }

  order(column: string, opts?: { ascending?: boolean }) {
    const dir = opts?.ascending === false ? 'desc' : 'asc'
    this.orderStr = `${column}.${dir}`
    return this
  }

  limit(count: number) {
    this.limitVal = count
    return this
  }

  // This is what actually sends the HTTP request
  async then(resolve: Function, reject: Function) {
    try {
      // Build the URL from all the chained calls
      const params = new URLSearchParams()
      params.set('select', this.selectStr)
      this.filters.forEach(f => {
        const [key, val] = f.split('=')
        params.set(key, val)
      })
      if (this.orderStr) params.set('order', this.orderStr)
      if (this.limitVal) params.set('limit', String(this.limitVal))

      const url = `${this.baseUrl}/rest/v1/${this.tableName}?${params}`

      // Send the actual HTTP request
      const res = await fetch(url, { headers: this.headers })
      const json = await res.json()

      resolve(json)
    } catch (err) {
      reject(err)
    }
  }
}
```

> **Tell your mentor:** "The query builder uses the **Builder Pattern** — each method stores a piece of the query and returns `this` so calls can be chained. When you `await` it, it builds the full URL from all stored pieces and sends a single `fetch()` request to our REST API service."

---

## How Auth Module Works

```javascript
await vb.auth.signUp({ email: 'user@test.com', password: '123456' })
await vb.auth.signIn({ email: 'user@test.com', password: '123456' })
```

### Internally:

```
vb.auth.signUp({ email, password })
        │
        ▼
fetch('http://localhost/auth/v1/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'apikey': 'anon-key' },
  body: JSON.stringify({ email, password })
})
        │
        ▼
Server returns: { access_token: 'eyJ...', refresh_token: 'abc...', user: {...} }
        │
        ▼
SDK stores tokens internally:
  this.accessToken = response.access_token    ← Now used in all future requests
  this.refreshToken = response.refresh_token  ← Used to get new access token when expired
```

### Auto Token Refresh:

```
1. User makes a request
2. SDK sends it with the access token
3. Server returns 401 (token expired)
4. SDK automatically calls /auth/v1/token/refresh with the refresh token
5. Gets new access token
6. Retries the original request with new token
7. Developer never notices — it's seamless
```

> **Tell your mentor:** "After sign-in, the SDK stores the JWT internally and attaches it to every request. It also handles token refresh automatically — if a request fails with 401, it refreshes the token and retries."

---

## How Storage Module Works

```javascript
await vb.storage.from('avatars').upload('profile.jpg', file)
```

### Internally:

```
vb.storage.from('avatars').upload('profile.jpg', file)
        │
        ▼
Creates FormData with the file
        │
        ▼
fetch('http://localhost/storage/v1/object/avatars/profile.jpg', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <jwt>' },
  body: formData   ← File is streamed, not loaded into memory
})
        │
        ▼
Nginx forwards to Storage Service (port 4003)
        │
        ▼
Storage Service verifies JWT → streams file to MinIO → saves metadata in MySQL
```

> **Tell your mentor:** "The storage SDK creates a FormData object and POSTs it to our storage service. The file streams through Fastify directly to MinIO — nothing is buffered in memory."

---

## How Realtime Module Works

```javascript
vb.channel('posts')
  .on('INSERT', (payload) => console.log(payload.new))
  .subscribe()
```

### Internally:

```
Step 1: .channel('posts')
        → Creates a RealtimeChannel object
        → Sets: channelName = 'public:posts'

Step 2: .on('INSERT', callback)
        → Stores: listeners = [{ event: 'INSERT', callback }]
        → Returns itself (chaining)

Step 3: .subscribe()
        → Opens WebSocket: new WebSocket('ws://localhost/realtime/v1?token=<jwt>')
        → Sends subscription message:
          {
            "type": "subscribe",
            "channel": "public:posts",
            "event": "INSERT"
          }
        → Server confirms: { "type": "subscribed", "channel": "public:posts" }

Step 4: When a row is inserted into 'posts' table...
        → Server pushes via WebSocket:
          {
            "type": "postgres_changes",
            "channel": "public:posts",
            "event": "INSERT",
            "payload": { "new": { "id": 1, "title": "Hello" }, "old": null }
          }
        → SDK receives this message
        → Finds matching listener (event === 'INSERT')
        → Calls: callback({ new: { id: 1, title: "Hello" }, old: null })
```

> **Tell your mentor:** "The realtime SDK opens a single WebSocket connection and sends subscription messages. When the server detects a database change (via MySQL triggers + polling), it pushes the event through the WebSocket. The SDK matches it to the right callback and fires it."

---

## Full Picture — How Everything Connects

```
┌──────────────────────────────────────────────────┐
│              Developer's App                      │
│                                                   │
│  import { createClient } from '@vorebase/js'      │
│  const vb = createClient(url, key)                │
│                                                   │
│  ┌─────────┐ ┌───────────┐ ┌─────────┐ ┌──────┐  │
│  │  .auth  │ │  .from()  │ │.storage │ │.chan- │  │
│  │ module  │ │  query    │ │ module  │ │ nel() │  │
│  │         │ │  builder  │ │         │ │       │  │
│  └────┬────┘ └─────┬─────┘ └────┬────┘ └──┬───┘  │
│       │            │            │          │      │
│   fetch()      fetch()      fetch()   WebSocket   │
└───────┼────────────┼────────────┼──────────┼──────┘
        │            │            │          │
        ▼            ▼            ▼          ▼
   ┌─────────────────────────────────────────────┐
   │                  Nginx                       │
   │  /auth/* → :4001                             │
   │  /rest/* → :4002                             │
   │  /storage/* → :4003                          │
   │  /realtime → :4004 (WebSocket upgrade)       │
   └─────────────────────────────────────────────┘
        │            │            │          │
        ▼            ▼            ▼          ▼
   Auth Service  REST Service  Storage   WebSocket
    (Fastify)    (Fastify)    Service    Server
     :4001        :4002       :4003      :4004
        │            │            │          │
        └──────┬─────┘            │          │
               ▼                  ▼          │
            MySQL              MinIO         │
                                             │
                              MySQL ←────────┘
                          (polls for changes)
```

---

## Summary — What to Tell Your Mentor

> "The SDK is a **thin client library** with 4 modules:
>
> 1. **Auth module** — wraps `fetch()` calls to `/auth/*`, stores JWT tokens, auto-refreshes expired tokens
> 2. **Query Builder** — uses the **Builder Pattern** to chain `.from().select().eq()` calls, then builds a URL and sends one `fetch()` to `/rest/*`
> 3. **Storage module** — wraps `fetch()` with `FormData` for file uploads to `/storage/*`
> 4. **Realtime module** — opens a `WebSocket` connection to `/realtime`, manages subscriptions and routes events to callbacks
>
> The SDK itself has **zero business logic**. All the real work — authentication, SQL compilation, RLS, file storage, change detection — happens in the backend services. The SDK is just the developer-friendly interface to those services."
