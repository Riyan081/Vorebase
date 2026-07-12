/**
 * @vorebase/js — Storage Client
 *
 * Manages file uploads, downloads, and bucket operations.
 *
 * Usage:
 *   // Upload
 *   const { data, error } = await vb.storage.from('avatars').upload('profile.jpg', file)
 *
 *   // Download (get public URL)
 *   const { data } = vb.storage.from('avatars').getPublicUrl('profile.jpg')
 *
 *   // Signed URL
 *   const { data, error } = await vb.storage.from('avatars').createSignedUrl('profile.jpg', 3600)
 *
 *   // Delete
 *   const { error } = await vb.storage.from('avatars').remove(['profile.jpg'])
 *
 *   // List files
 *   const { data, error } = await vb.storage.from('avatars').list('folder/')
 */

import type { HttpClient } from "./http.js";
import type {
  UploadResult,
  FileObject,
  SignedUrlResult,
  VorebaseError,
} from "./types.js";

interface StorageResult<T> {
  data: T | null;
  error: VorebaseError | null;
}

/**
 * Operations scoped to a specific bucket.
 */
export class StorageBucketApi {
  private http: HttpClient;
  private bucketName: string;
  private projectId: string;

  constructor(http: HttpClient, bucketName: string, projectId: string) {
    this.http = http;
    this.bucketName = bucketName;
    this.projectId = projectId;
  }

  /**
   * Upload a file to the bucket.
   * @param path - File path within the bucket (e.g., "avatars/user1.jpg")
   * @param file - File or Blob to upload
   */
  async upload(
    path: string,
    file: File | Blob
  ): Promise<StorageResult<UploadResult>> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await this.http.fetch<UploadResult>(
      `/storage/v1/object/${encodeURIComponent(this.bucketName)}/${path}`,
      {
        method: "POST",
        headers: { "x-project-id": this.projectId },
        body: formData,
      }
    );

    if (res.error) {
      return { data: null, error: res.error };
    }
    return { data: res.data, error: null };
  }

  /**
   * Download a file from the bucket.
   * Returns a Blob that can be used to create an object URL.
   */
  async download(path: string): Promise<StorageResult<Blob>> {
    const url = `/storage/v1/object/${encodeURIComponent(this.bucketName)}/${path}`;
    try {
      const res = await this.http.rawFetch(url, {
        headers: { "x-project-id": this.projectId },
      });

      if (!res.ok) {
        return {
          data: null,
          error: {
            message: `Download failed: ${res.status}`,
            code: "DOWNLOAD_ERROR",
            details: null,
            hint: null,
          },
        };
      }

      const blob = await res.blob();
      return { data: blob, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: {
          message: err.message || "Download failed",
          code: "DOWNLOAD_ERROR",
          details: null,
          hint: null,
        },
      };
    }
  }

  /**
   * Get the public URL for a file in a public bucket.
   * Does NOT make an HTTP request — just constructs the URL.
   */
  getPublicUrl(path: string): { data: { publicUrl: string } } {
    // This reconstructs the public URL based on the base URL
    const publicUrl = `/storage/v1/object/public/${encodeURIComponent(this.bucketName)}/${path}`;
    return { data: { publicUrl } };
  }

  /**
   * Create a signed URL for temporary access to a private file.
   * @param path - File path within the bucket
   * @param expiresIn - Seconds until the URL expires (default: 3600)
   */
  async createSignedUrl(
    path: string,
    expiresIn: number = 3600
  ): Promise<StorageResult<SignedUrlResult>> {
    const res = await this.http.fetch<SignedUrlResult>(
      `/storage/v1/object/sign/${encodeURIComponent(this.bucketName)}/${path}`,
      {
        method: "POST",
        headers: { "x-project-id": this.projectId },
        body: JSON.stringify({ expiresIn }),
      }
    );

    if (res.error) {
      return { data: null, error: res.error };
    }
    return { data: res.data, error: null };
  }

  /**
   * List files in the bucket with optional prefix filtering.
   * @param prefix - Filter files by path prefix (e.g., "avatars/")
   * @param options - { limit, offset }
   */
  async list(
    prefix: string = "",
    options?: { limit?: number; offset?: number }
  ): Promise<StorageResult<FileObject[]>> {
    const res = await this.http.fetch<FileObject[]>(
      `/storage/v1/object/list/${encodeURIComponent(this.bucketName)}`,
      {
        method: "POST",
        headers: { "x-project-id": this.projectId },
        body: JSON.stringify({
          prefix,
          limit: options?.limit ?? 100,
          offset: options?.offset ?? 0,
        }),
      }
    );

    if (res.error) {
      return { data: null, error: res.error };
    }
    return { data: res.data, error: null };
  }

  /**
   * Remove one or more files from the bucket.
   * @param paths - Array of file paths to delete
   */
  async remove(paths: string[]): Promise<StorageResult<null>> {
    const errors: VorebaseError[] = [];

    for (const path of paths) {
      const res = await this.http.fetch(
        `/storage/v1/object/${encodeURIComponent(this.bucketName)}/${path}`,
        {
          method: "DELETE",
          headers: { "x-project-id": this.projectId },
        }
      );
      if (res.error) {
        errors.push(res.error);
      }
    }

    if (errors.length > 0) {
      return { data: null, error: errors[0]! };
    }
    return { data: null, error: null };
  }
}

/**
 * Top-level storage client. Use `.from(bucket)` to get bucket-scoped operations.
 */
export class StorageClient {
  private http: HttpClient;
  private projectId: string;

  constructor(http: HttpClient, projectId: string) {
    this.http = http;
    this.projectId = projectId;
  }

  /**
   * Get a bucket-scoped API for file operations.
   * @param bucketName - Name of the storage bucket
   */
  from(bucketName: string): StorageBucketApi {
    return new StorageBucketApi(this.http, bucketName, this.projectId);
  }
}
