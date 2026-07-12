/**
 * @vorebase/js — Query Builder
 *
 * Chainable query builder that compiles method calls into URL
 * query parameters and sends a single HTTP request.
 *
 * Usage:
 *   const { data, error } = await vb
 *     .from('posts')
 *     .select('id, title')
 *     .eq('published', true)
 *     .order('created_at', { ascending: false })
 *     .limit(10)
 *
 * The builder uses the thenable pattern — calling `await` triggers
 * the actual HTTP request via the `.then()` method.
 */

import type { HttpClient } from "./http.js";
import type { QueryResult, MutationResult, VorebaseError } from "./types.js";

export class QueryBuilder<T = Record<string, unknown>> implements PromiseLike<QueryResult<T>> {
  private http: HttpClient;
  private tableName: string;
  private projectId: string;
  private method: "GET" | "POST" | "PATCH" | "DELETE" = "GET";
  private selectStr: string = "*";
  private filters: string[] = [];
  private filterParams: Record<string, string> = {};
  private orderStr: string = "";
  private limitVal: number | null = null;
  private offsetVal: number | null = null;
  private body: Record<string, unknown> | Record<string, unknown>[] | null = null;

  constructor(http: HttpClient, table: string, projectId: string) {
    this.http = http;
    this.tableName = table;
    this.projectId = projectId;
  }

  // ── Chainable Methods ─────────────────────────────────

  /**
   * Select specific columns.
   * @param columns - Comma-separated column names, e.g., "id, title, created_at"
   */
  select(columns: string = "*"): this {
    this.selectStr = columns.replace(/\s+/g, "");
    this.method = "GET";
    return this;
  }

  /**
   * Insert one or more rows.
   * @param values - A single row object or array of row objects
   */
  insert(values: Record<string, unknown> | Record<string, unknown>[]): PromiseLike<MutationResult> {
    this.method = "POST";
    this.body = values;
    return this as unknown as PromiseLike<MutationResult>;
  }

  /**
   * Update rows matching the current filters.
   * @param values - Object with column-value pairs to update
   */
  update(values: Record<string, unknown>): PromiseLike<MutationResult> {
    this.method = "PATCH";
    this.body = values;
    return this as unknown as PromiseLike<MutationResult>;
  }

  /**
   * Delete rows matching the current filters.
   */
  delete(): PromiseLike<MutationResult> {
    this.method = "DELETE";
    return this as unknown as PromiseLike<MutationResult>;
  }

  // ── Filter Methods ────────────────────────────────────

  /** Equal to */
  eq(column: string, value: unknown): this {
    this.filterParams[column] = `eq.${value}`;
    return this;
  }

  /** Not equal to */
  neq(column: string, value: unknown): this {
    this.filterParams[column] = `neq.${value}`;
    return this;
  }

  /** Greater than */
  gt(column: string, value: unknown): this {
    this.filterParams[column] = `gt.${value}`;
    return this;
  }

  /** Greater than or equal to */
  gte(column: string, value: unknown): this {
    this.filterParams[column] = `gte.${value}`;
    return this;
  }

  /** Less than */
  lt(column: string, value: unknown): this {
    this.filterParams[column] = `lt.${value}`;
    return this;
  }

  /** Less than or equal to */
  lte(column: string, value: unknown): this {
    this.filterParams[column] = `lte.${value}`;
    return this;
  }

  /** Pattern match (case-sensitive) */
  like(column: string, pattern: string): this {
    this.filterParams[column] = `like.${pattern}`;
    return this;
  }

  /** Pattern match (case-insensitive) */
  ilike(column: string, pattern: string): this {
    this.filterParams[column] = `ilike.${pattern}`;
    return this;
  }

  /** Value in list */
  in(column: string, values: unknown[]): this {
    this.filterParams[column] = `in.(${values.join(",")})`;
    return this;
  }

  /** Is null / is true / is false */
  is(column: string, value: "null" | "true" | "false"): this {
    this.filterParams[column] = `is.${value}`;
    return this;
  }

  // ── Ordering & Pagination ─────────────────────────────

  /**
   * Order results by a column.
   * @param column - Column name to order by
   * @param options - { ascending: boolean } — defaults to true (ascending)
   */
  order(column: string, options?: { ascending?: boolean }): this {
    const dir = options?.ascending === false ? "desc" : "asc";
    this.orderStr = `${column}.${dir}`;
    return this;
  }

  /**
   * Limit the number of returned rows.
   */
  limit(count: number): this {
    this.limitVal = count;
    return this;
  }

  /**
   * Skip a number of rows (for pagination).
   */
  offset(count: number): this {
    this.offsetVal = count;
    return this;
  }

  /**
   * Convenience: get a range of rows (offset + limit).
   */
  range(from: number, to: number): this {
    this.offsetVal = from;
    this.limitVal = to - from + 1;
    return this;
  }

  /**
   * Get a single row. Throws if 0 or more than 1 row returned.
   */
  async single(): Promise<{ data: T | null; error: VorebaseError | null }> {
    this.limitVal = 1;
    const result = await this.execute();
    if (result.error) {
      return { data: null, error: result.error };
    }
    if (!result.data || result.data.length === 0) {
      return { data: null, error: null };
    }
    return { data: result.data[0]!, error: null };
  }

  // ── Execution ─────────────────────────────────────────

  /**
   * Build the URL query string from all chained calls.
   */
  private buildQueryString(): string {
    const params = new URLSearchParams();

    if (this.method === "GET" && this.selectStr !== "*") {
      params.set("select", this.selectStr);
    }

    // Add filters
    for (const [key, val] of Object.entries(this.filterParams)) {
      params.set(key, val);
    }

    if (this.orderStr) {
      params.set("order", this.orderStr);
    }

    if (this.limitVal !== null) {
      params.set("limit", String(this.limitVal));
    }

    if (this.offsetVal !== null) {
      params.set("offset", String(this.offsetVal));
    }

    const str = params.toString();
    return str ? `?${str}` : "";
  }

  /**
   * Execute the query. Called automatically when `await`ed.
   */
  private async execute(): Promise<QueryResult<T>> {
    const path = `/rest/v1/${encodeURIComponent(this.tableName)}${this.buildQueryString()}`;
    const headers: Record<string, string> = {
      "x-project-id": this.projectId,
    };

    const options: RequestInit & { headers?: Record<string, string> } = {
      method: this.method,
      headers,
    };

    if (this.body && (this.method === "POST" || this.method === "PATCH")) {
      options.body = JSON.stringify(this.body);
    }

    const res = await this.http.fetch<T[]>(path, options);

    return {
      data: res.error ? null : res.data,
      count: res.count ?? null,
      error: res.error,
      status: res.status,
    };
  }

  /**
   * Thenable implementation — makes the builder work with `await`.
   */
  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}
