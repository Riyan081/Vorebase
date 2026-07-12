/**
 * @vorebase/js — Main Client
 *
 * The central VorebaseClient that ties all modules together.
 * Created via the `createClient()` factory function.
 *
 * Architecture:
 *   VorebaseClient
 *     ├── .auth        → AuthClient    (signup, signin, signout, token mgmt)
 *     ├── .from()      → QueryBuilder  (chainable REST queries)
 *     ├── .storage     → StorageClient (file upload/download/signed URLs)
 *     ├── .channel()   → RealtimeChannel (WebSocket subscriptions)
 *     └── .rpc()       → Direct RPC call to stored procedures
 */

import { HttpClient } from "./http.js";
import { AuthClient } from "./auth.js";
import { QueryBuilder } from "./query-builder.js";
import { StorageClient } from "./storage.js";
import { RealtimeClient } from "./realtime.js";
import type { VorebaseClientOptions, VorebaseError } from "./types.js";

export class VorebaseClient {
  /**
   * Auth module — handles user authentication.
   */
  readonly auth: AuthClient;

  /**
   * Storage module — handles file uploads/downloads.
   */
  readonly storage: StorageClient;

  private http: HttpClient;
  private realtime: RealtimeClient;
  private projectId: string;

  constructor(
    baseUrl: string,
    apiKey: string,
    options?: VorebaseClientOptions
  ) {
    // We use the apiKey as a stand-in project identifier
    // In a real setup, the project ID is embedded in the URL or derived from the API key
    this.projectId = "";

    const autoRefresh = options?.autoRefreshToken ?? true;

    // Create auth client first (to provide getAccessToken to HttpClient)
    // We need a circular reference here — auth needs http, http needs auth's token
    // Solve with a getter function
    this.auth = new AuthClient(null as unknown as HttpClient, this.projectId, autoRefresh);

    // Create HTTP client with a token getter that reads from auth
    this.http = new HttpClient(
      baseUrl,
      apiKey,
      options?.headers ?? {},
      () => this.auth.getAccessToken()
    );

    // Now patch the auth client with the real http client
    // @ts-ignore — intentional: we set http after construction to break the circular dep
    this.auth["http"] = this.http;

    // Create storage client
    this.storage = new StorageClient(this.http, this.projectId);

    // Create realtime client
    this.realtime = new RealtimeClient(
      baseUrl,
      apiKey,
      () => this.auth.getAccessToken()
    );
  }

  /**
   * Set the project context for multi-tenant operations.
   * Required when authenticating with an admin token.
   */
  setProjectId(projectId: string): this {
    this.projectId = projectId;
    // @ts-ignore — update internal project IDs
    this.auth["projectId"] = projectId;
    // @ts-ignore
    this.storage["projectId"] = projectId;
    return this;
  }

  /**
   * Start building a query against a table.
   *
   * @param table - The table name to query
   * @returns A chainable QueryBuilder
   *
   * @example
   * ```ts
   * const { data, error } = await vb
   *   .from('posts')
   *   .select('id, title, created_at')
   *   .eq('published', true)
   *   .order('created_at', { ascending: false })
   *   .limit(10)
   * ```
   */
  from<T = Record<string, unknown>>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(this.http, table, this.projectId);
  }

  /**
   * Subscribe to real-time changes on a table.
   *
   * @param channelName - Channel name, e.g., "posts" or "public:posts"
   * @returns A RealtimeChannel for registering event listeners
   *
   * @example
   * ```ts
   * vb.channel('posts')
   *   .on('INSERT', (payload) => console.log('New:', payload.new))
   *   .on('DELETE', (payload) => console.log('Deleted:', payload.old))
   *   .subscribe()
   * ```
   */
  channel(channelName: string) {
    return this.realtime.channel(channelName);
  }

  /**
   * Call a stored procedure / RPC function.
   *
   * @param fnName - The function name
   * @param params - Parameters to pass to the function
   *
   * @example
   * ```ts
   * const { data, error } = await vb.rpc('get_user_stats', { user_id: '123' })
   * ```
   */
  async rpc<T = unknown>(
    fnName: string,
    params?: Record<string, unknown>
  ): Promise<{ data: T | null; error: VorebaseError | null }> {
    const res = await this.http.fetch<T>(`/rest/v1/rpc/${fnName}`, {
      method: "POST",
      headers: { "x-project-id": this.projectId },
      body: JSON.stringify(params || {}),
    });

    if (res.error) {
      return { data: null, error: res.error };
    }
    return { data: res.data, error: null };
  }

  /**
   * Disconnect all realtime subscriptions and clean up resources.
   */
  disconnect(): void {
    this.realtime.disconnect();
  }
}
