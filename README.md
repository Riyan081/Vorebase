# @riyan081/vorebase-js

> The official JavaScript/TypeScript client SDK for **Vorebase** — the open-source Supabase alternative.

[![npm version](https://img.shields.io/npm/v/@riyan081/vorebase-js)](https://www.npmjs.com/package/@riyan081/vorebase-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Initialization](#initialization)
- [Authentication](#authentication)
- [Database (Query Builder)](#database-query-builder)
- [Storage](#storage)
- [Realtime](#realtime)
- [RPC (Remote Procedure Call)](#rpc-remote-procedure-call)
- [Error Handling](#error-handling)
- [TypeScript Support](#typescript-support)
- [Framework Examples](#framework-examples)
- [API Reference](#api-reference)

---

## Installation

```bash
npm install @riyan081/vorebase-js
```

or with yarn/pnpm:

```bash
yarn add @riyan081/vorebase-js
pnpm add @riyan081/vorebase-js
```

---

## Quick Start

```typescript
import { createClient } from '@riyan081/vorebase-js'

// 1. Create the client
const vb = createClient('http://localhost', 'your-anon-key')

// 2. Set your project (multi-tenant)
vb.setProjectId('your-project-id')

// 3. Sign up a user
const { data, error } = await vb.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword'
})

// 4. Query your database
const { data: posts } = await vb
  .from('posts')
  .select('*')
  .eq('published', true)
  .limit(10)

// 5. Upload a file
await vb.storage.from('avatars').upload('photo.jpg', file)
```

That's it. If you've used Supabase before, you already know how to use Vorebase.

---

## Initialization

### Step 1: Get Your Credentials

Log into the Vorebase dashboard and go to your project:

| Credential | Where to Find |
|---|---|
| **Project URL** | Your Vorebase server URL (e.g., `http://localhost`) |
| **Anon Key** | Settings → API tab → copy the `anon` key |
| **Project ID** | From the URL: `/project/<project-id>` |

### Step 2: Create the Client

```typescript
import { createClient } from '@riyan081/vorebase-js'

const vb = createClient(
  'http://localhost',              // Your Vorebase URL
  'vb_anon_xxxxxxxxxxxxxxxxxxxx'   // Your anon key
)

// Required: set the project context
vb.setProjectId('your-project-id-here')
```

### Options

```typescript
const vb = createClient('http://localhost', 'your-key', {
  autoRefreshToken: true,  // Auto-refresh JWT tokens (default: true)
  headers: {               // Custom headers sent with every request
    'x-custom-header': 'value'
  }
})
```

---

## Authentication

Vorebase Auth works just like Supabase Auth — email/password based with JWT tokens.

### Sign Up

```typescript
const { data, error } = await vb.auth.signUp({
  email: 'newuser@example.com',
  password: 'MySecurePass123!'
})

if (error) {
  console.error('Signup failed:', error.message)
} else {
  console.log('Welcome!', data.user.email)
  // data.session.access_token is automatically stored
}
```

### Sign In

```typescript
const { data, error } = await vb.auth.signIn({
  email: 'user@example.com',
  password: 'MySecurePass123!'
})

if (error) {
  console.error('Login failed:', error.message)
} else {
  console.log('Logged in as:', data.user.email)
  // Token is automatically attached to all future requests
}
```

### Sign Out

```typescript
await vb.auth.signOut()
// Session cleared, user is logged out
```

### Get Current User

```typescript
const { data: user, error } = await vb.auth.getUser()
console.log(user)
// { id: '...', email: 'user@example.com', role: 'user', ... }
```

### Get Current Session

```typescript
const session = vb.auth.getSession()
// { access_token: '...', refresh_token: '...', expires_in: 3600, ... }
```

### Listen for Auth Changes

```typescript
const { unsubscribe } = vb.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)  // "SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED"
  console.log('Session:', session)
})

// Later: stop listening
unsubscribe()
```

---

## Database (Query Builder)

Query your database with a chainable, Supabase-compatible API. Every query returns `{ data, error }`.

### Select (Read)

```typescript
// Get all rows
const { data, error } = await vb.from('todos').select('*')

// Select specific columns
const { data } = await vb.from('todos').select('id, title, completed')

// Get a single row
const { data: todo } = await vb.from('todos').select('*').eq('id', 1).single()
```

### Insert (Create)

```typescript
// Insert one row
const { data, error } = await vb.from('todos').insert({
  title: 'Buy groceries',
  completed: false
})
// data = { affected_rows: 1, insert_id: 5, message: '...' }

// Insert multiple rows
await vb.from('todos').insert([
  { title: 'Task 1', completed: false },
  { title: 'Task 2', completed: true }
])
```

### Update

```typescript
// Update rows matching a filter
const { data, error } = await vb
  .from('todos')
  .update({ completed: true })
  .eq('id', 1)
// data = { affected_rows: 1, changed_rows: 1, message: '...' }
```

### Delete

```typescript
// Delete rows matching a filter
const { data, error } = await vb
  .from('todos')
  .delete()
  .eq('id', 1)
```

### Filters

Chain any of these filters to narrow down results:

```typescript
const { data } = await vb
  .from('products')
  .select('*')
  .eq('category', 'electronics')       // Equal to
  .neq('status', 'archived')           // Not equal to
  .gt('price', 100)                    // Greater than
  .gte('stock', 1)                     // Greater than or equal
  .lt('price', 1000)                   // Less than
  .lte('discount', 50)                 // Less than or equal
  .like('name', '%phone%')             // Pattern match (case-sensitive)
  .ilike('name', '%PHONE%')            // Pattern match (case-insensitive)
  .in('color', ['red', 'blue'])        // Value in list
  .is('deleted_at', 'null')            // Is null / is true / is false
```

### Ordering & Pagination

```typescript
const { data } = await vb
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false })  // Newest first
  .limit(10)                                  // Max 10 rows
  .offset(20)                                 // Skip first 20

// Or use range (shorthand for offset + limit)
const { data } = await vb
  .from('posts')
  .select('*')
  .range(0, 9)  // First 10 rows (0-indexed)
```

---

## Storage

Upload, download, and manage files — just like Supabase Storage.

### Upload a File

```typescript
// From a file input
const file = document.getElementById('fileInput').files[0]

const { data, error } = await vb.storage
  .from('avatars')
  .upload('users/profile.jpg', file)

if (error) {
  console.error('Upload failed:', error.message)
} else {
  console.log('Uploaded:', data.path)
}
```

### Download a File

```typescript
const { data: blob, error } = await vb.storage
  .from('avatars')
  .download('users/profile.jpg')

// Use the blob (e.g., create an image)
const url = URL.createObjectURL(blob)
```

### Get Public URL

For files in **public** buckets (no auth required):

```typescript
const { data } = vb.storage
  .from('avatars')
  .getPublicUrl('users/profile.jpg')

console.log(data.publicUrl)
// "/storage/v1/object/public/avatars/users/profile.jpg"
```

### Create Signed URL

For files in **private** buckets (temporary access):

```typescript
const { data, error } = await vb.storage
  .from('documents')
  .createSignedUrl('report.pdf', 3600)  // Expires in 1 hour

console.log(data.signed_url)  // Time-limited URL
```

### List Files

```typescript
const { data: files, error } = await vb.storage
  .from('avatars')
  .list('users/', { limit: 50, offset: 0 })

// files = [{ id, name, mimeType, size, createdAt, updatedAt }, ...]
```

### Delete Files

```typescript
const { error } = await vb.storage
  .from('avatars')
  .remove(['users/old-photo.jpg', 'users/temp.png'])
```

---

## Realtime

Subscribe to live database changes over WebSocket.

### Listen for Changes

```typescript
const channel = vb.channel('todos')
  .on('INSERT', (payload) => {
    console.log('New todo:', payload.new)
  })
  .on('UPDATE', (payload) => {
    console.log('Updated:', payload.new)
    console.log('Previous:', payload.old)
  })
  .on('DELETE', (payload) => {
    console.log('Deleted:', payload.old)
  })
  .subscribe()
```

### Listen for All Events

```typescript
vb.channel('todos')
  .on('*', (payload) => {
    console.log('Something changed:', payload)
  })
  .subscribe()
```

### Unsubscribe

```typescript
// Unsubscribe from one channel
channel.unsubscribe()

// Disconnect all channels
vb.disconnect()
```

---

## RPC (Remote Procedure Call)

Call stored procedures / server functions:

```typescript
const { data, error } = await vb.rpc('get_user_stats', {
  user_id: '123'
})

console.log(data)
```

---

## Error Handling

Every SDK method returns `{ data, error }` — never throws exceptions.

```typescript
const { data, error } = await vb.from('todos').select('*')

if (error) {
  // error = {
  //   message: "Table 'todos' not found",
  //   code: "HTTP_ERROR",
  //   details: null,
  //   hint: null
  // }
  console.error('Error:', error.message)
  return
}

// Safe to use data here
console.log('Todos:', data)
```

### Error Shape

Every error follows this structure:

```typescript
interface VorebaseError {
  message: string       // Human-readable error message
  code: string          // Error code (e.g., "AUTH_ERROR", "HTTP_ERROR")
  details: string | null // Additional details
  hint: string | null    // Suggestion to fix the error
}
```

---

## TypeScript Support

The SDK is written in TypeScript and ships with full type definitions.

### Typed Queries

```typescript
// Define your row type
interface Todo {
  id: number
  title: string
  completed: boolean
  created_at: string
}

// Pass it as a generic — data is now Todo[]
const { data, error } = await vb.from<Todo>('todos').select('*')

// data[0].title  ← fully typed, with autocomplete!
```

### All Exported Types

```typescript
import type {
  VorebaseClientOptions,
  AuthSession,
  UserInfo,
  AuthResponse,
  SignUpCredentials,
  SignInCredentials,
  FilterOperator,
  QueryResult,
  MutationResult,
  UploadResult,
  FileObject,
  SignedUrlResult,
  RealtimeEvent,
  RealtimePayload,
  RealtimeCallback,
  VorebaseError,
} from '@riyan081/vorebase-js'
```

---

## Framework Examples

### React / Next.js

```typescript
// lib/vorebase.ts
import { createClient } from '@riyan081/vorebase-js'

export const vb = createClient(
  process.env.NEXT_PUBLIC_VOREBASE_URL!,
  process.env.NEXT_PUBLIC_VOREBASE_ANON_KEY!
)
vb.setProjectId(process.env.NEXT_PUBLIC_VOREBASE_PROJECT_ID!)
```

```tsx
// app/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { vb } from '@/lib/vorebase'

interface Todo {
  id: number
  title: string
  completed: boolean
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    async function fetchTodos() {
      const { data, error } = await vb.from<Todo>('todos').select('*')
      if (data) setTodos(data)
    }
    fetchTodos()
  }, [])

  const addTodo = async (title: string) => {
    await vb.from('todos').insert({ title, completed: false })
    // Refresh
    const { data } = await vb.from<Todo>('todos').select('*')
    if (data) setTodos(data)
  }

  return (
    <div>
      <h1>My Todos</h1>
      {todos.map(t => <p key={t.id}>{t.title}</p>)}
    </div>
  )
}
```

### Vue.js

```typescript
// src/lib/vorebase.ts
import { createClient } from '@riyan081/vorebase-js'

export const vb = createClient(
  import.meta.env.VITE_VOREBASE_URL,
  import.meta.env.VITE_VOREBASE_ANON_KEY
)
vb.setProjectId(import.meta.env.VITE_VOREBASE_PROJECT_ID)
```

```vue
<!-- src/components/TodoList.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { vb } from '@/lib/vorebase'

const todos = ref([])

onMounted(async () => {
  const { data } = await vb.from('todos').select('*')
  if (data) todos.value = data
})
</script>

<template>
  <div v-for="todo in todos" :key="todo.id">
    {{ todo.title }}
  </div>
</template>
```

### Vanilla JavaScript

```html
<script type="module">
  import { createClient } from 'https://esm.sh/@riyan081/vorebase-js'

  const vb = createClient('http://localhost', 'your-anon-key')
  vb.setProjectId('your-project-id')

  // Sign in
  const { data } = await vb.auth.signIn({
    email: 'user@test.com',
    password: 'password123'
  })

  // Fetch data
  const { data: todos } = await vb.from('todos').select('*')
  console.log(todos)
</script>
```

---

## API Reference

### `createClient(url, apiKey, options?)`

Creates a new Vorebase client instance.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | ✅ | Your Vorebase server URL |
| `apiKey` | `string` | ✅ | Your project's anon or service_role key |
| `options` | `VorebaseClientOptions` | ❌ | Optional config |

### `VorebaseClient`

| Method / Property | Returns | Description |
|---|---|---|
| `.auth` | `AuthClient` | Authentication module |
| `.storage` | `StorageClient` | File storage module |
| `.from(table)` | `QueryBuilder` | Start a database query |
| `.channel(name)` | `RealtimeChannel` | Subscribe to live changes |
| `.rpc(fn, params?)` | `Promise<{ data, error }>` | Call a stored procedure |
| `.setProjectId(id)` | `this` | Set the project context |
| `.disconnect()` | `void` | Close all realtime connections |

### `AuthClient`

| Method | Returns | Description |
|---|---|---|
| `.signUp({ email, password })` | `Promise<{ data, error }>` | Register a new user |
| `.signIn({ email, password })` | `Promise<{ data, error }>` | Log in |
| `.signOut()` | `Promise<{ data, error }>` | Log out |
| `.getUser()` | `Promise<{ data, error }>` | Get current user info |
| `.getSession()` | `AuthSession \| null` | Get current session (sync) |
| `.refreshSession()` | `Promise<{ data, error }>` | Manually refresh token |
| `.onAuthStateChange(cb)` | `{ unsubscribe }` | Listen for auth events |

### `QueryBuilder`

| Method | Returns | Description |
|---|---|---|
| `.select(columns?)` | `this` | Read rows (default: `*`) |
| `.insert(values)` | `PromiseLike<MutationResult>` | Insert row(s) |
| `.update(values)` | `PromiseLike<MutationResult>` | Update matching rows |
| `.delete()` | `PromiseLike<MutationResult>` | Delete matching rows |
| `.eq(col, val)` | `this` | Filter: equal to |
| `.neq(col, val)` | `this` | Filter: not equal |
| `.gt(col, val)` | `this` | Filter: greater than |
| `.gte(col, val)` | `this` | Filter: greater or equal |
| `.lt(col, val)` | `this` | Filter: less than |
| `.lte(col, val)` | `this` | Filter: less or equal |
| `.like(col, pattern)` | `this` | Filter: pattern match |
| `.ilike(col, pattern)` | `this` | Filter: case-insensitive pattern |
| `.in(col, values)` | `this` | Filter: value in list |
| `.is(col, value)` | `this` | Filter: is null/true/false |
| `.order(col, opts?)` | `this` | Sort results |
| `.limit(count)` | `this` | Limit row count |
| `.offset(count)` | `this` | Skip rows |
| `.range(from, to)` | `this` | Paginate (offset + limit) |
| `.single()` | `Promise<{ data, error }>` | Return exactly one row |

### `StorageBucketApi` (via `vb.storage.from(bucket)`)

| Method | Returns | Description |
|---|---|---|
| `.upload(path, file)` | `Promise<{ data, error }>` | Upload a file |
| `.download(path)` | `Promise<{ data: Blob, error }>` | Download a file |
| `.getPublicUrl(path)` | `{ data: { publicUrl } }` | Get public URL (sync) |
| `.createSignedUrl(path, expiresIn?)` | `Promise<{ data, error }>` | Generate signed URL |
| `.list(prefix?, opts?)` | `Promise<{ data, error }>` | List files |
| `.remove(paths)` | `Promise<{ data, error }>` | Delete file(s) |

### `RealtimeChannel` (via `vb.channel(name)`)

| Method | Returns | Description |
|---|---|---|
| `.on(event, callback)` | `this` | Register event listener |
| `.subscribe()` | `this` | Start receiving events |
| `.unsubscribe()` | `void` | Stop receiving events |

---

## Architecture

```
createClient(url, apiKey)
  ├── .auth        → AuthClient       → POST /auth/v1/*
  ├── .from()      → QueryBuilder     → GET/POST/PATCH/DELETE /rest/v1/*
  ├── .storage     → StorageClient    → POST/GET /storage/v1/*
  ├── .channel()   → RealtimeClient   → WebSocket /realtime/v1
  └── .rpc()       → HttpClient       → POST /rest/v1/rpc/*
```

The SDK is a **thin client** — all business logic (RLS, SQL compilation, file streaming, change detection) runs on the Vorebase backend services. The SDK just builds URLs and manages tokens.

---

## Comparison with Supabase

| Feature | Supabase | Vorebase |
|---|---|---|
| `npm install` | `@supabase/supabase-js` | `@riyan081/vorebase-js` |
| `createClient(url, key)` | ✅ | ✅ |
| `.from().select().eq()` | ✅ | ✅ |
| `.auth.signUp()` | ✅ | ✅ |
| `.storage.from().upload()` | ✅ | ✅ |
| `.channel().on().subscribe()` | ✅ | ✅ |
| `.rpc()` | ✅ | ✅ |
| Row Level Security | ✅ | ✅ |
| Multi-tenant | ❌ (one project per instance) | ✅ (`.setProjectId()`) |
| Self-hosted | ✅ | ✅ |
| Open Source | ✅ | ✅ |

---

## License

MIT — built with ❤️ by [Riyan](https://github.com/Riyan081)
