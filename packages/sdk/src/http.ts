/**
 * @vorebase/js — HTTP Client Utility
 *
 * Internal helper for making authenticated HTTP requests.
 * Handles token attachment, JSON parsing, and error normalization.
 */

import type { VorebaseError } from "./types.js";

export interface FetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

export interface FetchResponse<T> {
  data: T;
  count?: number;
  status: number;
  error: VorebaseError | null;
}

export class HttpClient {
  private baseUrl: string;
  private apiKey: string;
  private customHeaders: Record<string, string>;
  private getAccessToken: () => string | null;

  constructor(
    baseUrl: string,
    apiKey: string,
    customHeaders: Record<string, string>,
    getAccessToken: () => string | null
  ) {
    // Remove trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.customHeaders = customHeaders;
    this.getAccessToken = getAccessToken;
  }

  /**
   * Build the full set of headers for a request.
   */
  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      apikey: this.apiKey,
      ...this.customHeaders,
    };

    const token = this.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (extra) {
      Object.assign(headers, extra);
    }

    // Don't set Content-Type if it's already set (e.g., for FormData)
    if (!headers["Content-Type"] && !extra?.["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  /**
   * Make an HTTP request and return a typed response.
   */
  async fetch<T>(
    path: string,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const { headers: extraHeaders, ...fetchOpts } = options;

    const headers = this.buildHeaders(extraHeaders);

    // Remove Content-Type for FormData (browser sets it with boundary)
    if (fetchOpts.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const res = await fetch(url, {
      ...fetchOpts,
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        data: null as unknown as T,
        status: res.status,
        error: {
          message: body.error?.message || body.message || `HTTP ${res.status}`,
          code: body.error?.code || "HTTP_ERROR",
          details: body.error?.details || null,
          hint: body.error?.hint || null,
        },
      };
    }

    const body = await res.json();
    return {
      data: body.data,
      count: body.count,
      status: body.status || res.status,
      error: null,
    };
  }

  /**
   * Make a raw fetch (for auth endpoints that have different response shapes).
   */
  async rawFetch(
    path: string,
    options: FetchOptions = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const { headers: extraHeaders, ...fetchOpts } = options;
    const headers = this.buildHeaders(extraHeaders);

    return fetch(url, {
      ...fetchOpts,
      headers,
    });
  }
}
