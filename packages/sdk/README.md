# @vorebase/js — Client SDK

> The official JavaScript/TypeScript client library for Vorebase.

## Installation

```bash
# From the monorepo
pnpm add @vorebase/js --filter your-app

# Or in a standalone project (once published)
npm install @vorebase/js
```

## Quick Start

```typescript
import { createClient } from '@vorebase/js'

// Initialize
const vb = createClient('http://localhost', 'vb_anon_xxxxxxxxxxxx')

// Auth
const { data, error } = await vb.auth.signIn({
  email: 'user@example.com',
  password: 'securepassword'
})

// Query data
const { data: posts } = await vb
  .from('posts')
  .select('id, title, created_at')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(10)

// Insert data
const { data: newPost } = await vb
  .from('posts')
  .insert({ title: 'Hello World', content: 'My first post' })

// Upload a file
await vb.storage.from('avatars').upload('profile.jpg', file)

// Real-time subscriptions
vb.channel('posts')
  .on('INSERT', (payload) => console.log('New post:', payload.new))
  .subscribe()
```

## Modules

### Auth (`vb.auth`)

| Method | Description |
|--------|-------------|
| `signUp({ email, password })` | Register a new user |
| `signIn({ email, password })` | Log in and get JWT tokens |
| `signOut()` | Sign out and revoke refresh tokens |
| `getUser()` | Get current user info |
| `getSession()` | Get current session (tokens) |
| `refreshSession()` | Manually refresh access token |
| `onAuthStateChange(callback)` | Listen for auth events |

### Query Builder (`vb.from(table)`)

```typescript
// SELECT
const { data } = await vb.from('posts').select('*').eq('id', 1).single()

// INSERT
await vb.from('posts').insert({ title: 'New' })

// UPDATE
await vb.from('posts').update({ title: 'Updated' }).eq('id', 1)

// DELETE
await vb.from('posts').delete().eq('id', 1)
```

**Filter operators:** `.eq()`, `.neq()`, `.gt()`, `.gte()`, `.lt()`, `.lte()`, `.like()`, `.ilike()`, `.in()`, `.is()`

**Modifiers:** `.order()`, `.limit()`, `.offset()`, `.range()`, `.single()`

### Storage (`vb.storage`)

```typescript
const bucket = vb.storage.from('avatars')

await bucket.upload('user/photo.jpg', file)
const { data: blob } = await bucket.download('user/photo.jpg')
const { data: url } = await bucket.createSignedUrl('user/photo.jpg', 3600)
const { data: files } = await bucket.list('user/')
await bucket.remove(['user/photo.jpg'])
```

### Realtime (`vb.channel()`)

```typescript
const channel = vb.channel('posts')
  .on('INSERT', (p) => console.log('Created:', p.new))
  .on('UPDATE', (p) => console.log('Updated:', p.new))
  .on('DELETE', (p) => console.log('Deleted:', p.old))
  .on('*', (p) => console.log('Any change'))
  .subscribe()

// Later
channel.unsubscribe()
vb.disconnect() // Close all connections
```

### RPC (`vb.rpc()`)

```typescript
const { data } = await vb.rpc('get_user_stats', { user_id: '123' })
```

## Architecture

```
createClient(url, apiKey)
  ├── .auth        → AuthClient    → POST /auth/v1/*
  ├── .from()      → QueryBuilder  → GET/POST/PATCH/DELETE /rest/v1/*
  ├── .storage     → StorageClient → POST/GET /storage/v1/*
  ├── .channel()   → RealtimeClient → WebSocket /realtime/v1
  └── .rpc()       → HTTP Client   → POST /rest/v1/rpc/*
```

The SDK is a **thin client** — all business logic (RLS, SQL compilation, file streaming, change detection) runs on the backend services. The SDK just builds URLs and manages tokens.

## Building

```bash
cd packages/sdk
pnpm build   # Compiles TypeScript → dist/
pnpm dev     # Watch mode
```
