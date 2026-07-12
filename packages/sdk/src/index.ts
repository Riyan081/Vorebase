/**
 * @vorebase/js — Public API Entry Point
 *
 * Usage:
 *   import { createClient } from '@vorebase/js'
 *
 *   const vb = createClient('http://localhost', 'your-anon-key')
 *
 *   // Auth
 *   await vb.auth.signUp({ email: 'user@test.com', password: 'securepass' })
 *   await vb.auth.signIn({ email: 'user@test.com', password: 'securepass' })
 *
 *   // Query
 *   const { data } = await vb.from('posts').select('*').eq('published', true).limit(10)
 *
 *   // Storage
 *   await vb.storage.from('avatars').upload('profile.jpg', file)
 *
 *   // Realtime
 *   vb.channel('posts').on('INSERT', (p) => console.log(p.new)).subscribe()
 */

import { VorebaseClient } from "./client.js";
import type { VorebaseClientOptions } from "./types.js";

/**
 * Create a new Vorebase client instance.
 *
 * @param url - The base URL of your Vorebase instance (e.g., "http://localhost" or "https://your-project.vorebase.co")
 * @param apiKey - Your project's anon or service_role API key
 * @param options - Optional configuration
 * @returns A VorebaseClient instance
 *
 * @example
 * ```ts
 * import { createClient } from '@vorebase/js'
 *
 * const vb = createClient(
 *   'http://localhost',
 *   'vb_anon_xxxxxxxxxxxx'
 * )
 * ```
 */
export function createClient(
  url: string,
  apiKey: string,
  options?: VorebaseClientOptions
): VorebaseClient {
  if (!url) throw new Error("Vorebase URL is required");
  if (!apiKey) throw new Error("Vorebase API key is required");

  return new VorebaseClient(url, apiKey, options);
}

// Re-export everything developers might need
export { VorebaseClient } from "./client.js";
export { AuthClient } from "./auth.js";
export { QueryBuilder } from "./query-builder.js";
export { StorageClient, StorageBucketApi } from "./storage.js";
export { RealtimeClient, RealtimeChannel } from "./realtime.js";

// Re-export all types
export type {
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
} from "./types.js";
