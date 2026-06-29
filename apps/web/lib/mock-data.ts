// ===== Mock Data for Vorebase Studio =====
// Replace with real API calls when backend is ready.

export interface Project {
  id: string;
  name: string;
  dbName: string;
  region: string;
  status: 'active' | 'paused' | 'inactive';
  createdAt: string;
  tablesCount: number;
  usersCount: number;
  storageUsed: string;
}

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isUnique: boolean;
}

export interface TableInfo {
  name: string;
  schema: string;
  rowCount: number;
  columns: TableColumn[];
}

export interface TableRow {
  [key: string]: string | number | boolean | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  provider: string;
  lastSignIn: string | null;
  createdAt: string;
  metadata: Record<string, string>;
}

export interface RlsPolicy {
  id: string;
  name: string;
  tableName: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  roles: string[];
  check: string;
  isEnabled: boolean;
  createdAt: string;
}

export interface StorageBucket {
  id: string;
  name: string;
  isPublic: boolean;
  fileCount: number;
  totalSize: string;
  createdAt: string;
}

export interface StorageFile {
  id: string;
  name: string;
  bucketId: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  role: 'anon' | 'service_role';
  createdAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
}

export interface SqlQuery {
  id: string;
  sql: string;
  executedAt: string;
  duration: number;
  rowsAffected: number;
}

// ===== Projects =====
export const mockProjects: Project[] = [
  {
    id: 'proj_1',
    name: 'My SaaS App',
    dbName: 'my_saas_db',
    region: 'us-east-1',
    status: 'active',
    createdAt: '2025-01-15T10:30:00Z',
    tablesCount: 12,
    usersCount: 1250,
    storageUsed: '2.4 GB',
  },
  {
    id: 'proj_2',
    name: 'E-commerce Store',
    dbName: 'ecom_db',
    region: 'eu-west-1',
    status: 'active',
    createdAt: '2025-03-22T14:00:00Z',
    tablesCount: 8,
    usersCount: 540,
    storageUsed: '890 MB',
  },
  {
    id: 'proj_3',
    name: 'Blog Platform',
    dbName: 'blog_db',
    region: 'ap-south-1',
    status: 'paused',
    createdAt: '2025-06-10T09:15:00Z',
    tablesCount: 5,
    usersCount: 89,
    storageUsed: '124 MB',
  },
];

// ===== Tables =====
export const mockTables: TableInfo[] = [
  {
    name: 'users',
    schema: 'public',
    rowCount: 1250,
    columns: [
      { name: 'id', type: 'uuid', nullable: false, defaultValue: 'uuid()', isPrimaryKey: true, isUnique: true },
      { name: 'email', type: 'varchar(255)', nullable: false, defaultValue: null, isPrimaryKey: false, isUnique: true },
      { name: 'username', type: 'varchar(100)', nullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false },
      { name: 'avatar_url', type: 'text', nullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false },
      { name: 'role', type: 'varchar(50)', nullable: false, defaultValue: "'authenticated'", isPrimaryKey: false, isUnique: false },
      { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isUnique: false },
      { name: 'updated_at', type: 'timestamp', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isUnique: false },
    ],
  },
  {
    name: 'posts',
    schema: 'public',
    rowCount: 3420,
    columns: [
      { name: 'id', type: 'int', nullable: false, defaultValue: 'auto_increment', isPrimaryKey: true, isUnique: true },
      { name: 'title', type: 'varchar(255)', nullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false },
      { name: 'content', type: 'text', nullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false },
      { name: 'published', type: 'boolean', nullable: false, defaultValue: 'false', isPrimaryKey: false, isUnique: false },
      { name: 'author_id', type: 'uuid', nullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false },
      { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isUnique: false },
      { name: 'updated_at', type: 'timestamp', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isUnique: false },
    ],
  },
  {
    name: 'comments',
    schema: 'public',
    rowCount: 8900,
    columns: [
      { name: 'id', type: 'int', nullable: false, defaultValue: 'auto_increment', isPrimaryKey: true, isUnique: true },
      { name: 'body', type: 'text', nullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false },
      { name: 'post_id', type: 'int', nullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false },
      { name: 'user_id', type: 'uuid', nullable: false, defaultValue: null, isPrimaryKey: false, isUnique: false },
      { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isUnique: false },
    ],
  },
  {
    name: 'categories',
    schema: 'public',
    rowCount: 24,
    columns: [
      { name: 'id', type: 'int', nullable: false, defaultValue: 'auto_increment', isPrimaryKey: true, isUnique: true },
      { name: 'name', type: 'varchar(100)', nullable: false, defaultValue: null, isPrimaryKey: false, isUnique: true },
      { name: 'slug', type: 'varchar(100)', nullable: false, defaultValue: null, isPrimaryKey: false, isUnique: true },
      { name: 'description', type: 'text', nullable: true, defaultValue: null, isPrimaryKey: false, isUnique: false },
    ],
  },
  {
    name: 'tags',
    schema: 'public',
    rowCount: 156,
    columns: [
      { name: 'id', type: 'int', nullable: false, defaultValue: 'auto_increment', isPrimaryKey: true, isUnique: true },
      { name: 'name', type: 'varchar(50)', nullable: false, defaultValue: null, isPrimaryKey: false, isUnique: true },
      { name: 'color', type: 'varchar(7)', nullable: true, defaultValue: "'#3ecf8e'", isPrimaryKey: false, isUnique: false },
    ],
  },
];

// ===== Table Row Data =====
export const mockTableRows: Record<string, TableRow[]> = {
  users: [
    { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', email: 'john@example.com', username: 'johndoe', avatar_url: null, role: 'authenticated', created_at: '2025-01-15 10:30:00', updated_at: '2025-06-20 14:00:00' },
    { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', email: 'jane@example.com', username: 'janesmith', avatar_url: 'https://i.pravatar.cc/150?u=jane', role: 'authenticated', created_at: '2025-02-20 08:15:00', updated_at: '2025-06-18 09:30:00' },
    { id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', email: 'admin@vorebase.io', username: 'admin', avatar_url: null, role: 'admin', created_at: '2025-01-01 00:00:00', updated_at: '2025-06-25 16:45:00' },
    { id: 'd4e5f6a7-b8c9-0123-defa-234567890123', email: 'alice@startup.io', username: 'alice_dev', avatar_url: 'https://i.pravatar.cc/150?u=alice', role: 'authenticated', created_at: '2025-03-10 12:00:00', updated_at: '2025-06-15 11:20:00' },
    { id: 'e5f6a7b8-c9d0-1234-efab-345678901234', email: 'bob@company.com', username: null, avatar_url: null, role: 'authenticated', created_at: '2025-04-05 16:30:00', updated_at: '2025-06-22 08:00:00' },
  ],
  posts: [
    { id: 1, title: 'Getting Started with Vorebase', content: 'Learn how to set up your first project...', published: true, author_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', created_at: '2025-02-01 10:00:00', updated_at: '2025-02-01 10:00:00' },
    { id: 2, title: 'Advanced SQL Queries', content: 'Deep dive into complex SQL patterns...', published: true, author_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', created_at: '2025-03-15 14:30:00', updated_at: '2025-03-16 09:00:00' },
    { id: 3, title: 'Draft: API Best Practices', content: 'Tips for building scalable APIs...', published: false, author_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', created_at: '2025-04-20 08:00:00', updated_at: '2025-04-22 16:00:00' },
    { id: 4, title: 'Real-time Features Guide', content: 'How to use WebSocket subscriptions...', published: true, author_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', created_at: '2025-05-10 11:00:00', updated_at: '2025-05-10 11:00:00' },
  ],
  comments: [
    { id: 1, body: 'Great article! Very helpful.', post_id: 1, user_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', created_at: '2025-02-02 09:00:00' },
    { id: 2, body: 'Thanks for sharing this.', post_id: 1, user_id: 'd4e5f6a7-b8c9-0123-defa-234567890123', created_at: '2025-02-03 14:30:00' },
    { id: 3, body: 'Could you add more examples?', post_id: 2, user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', created_at: '2025-03-16 10:00:00' },
  ],
  categories: [
    { id: 1, name: 'Technology', slug: 'technology', description: 'Tech related posts' },
    { id: 2, name: 'Design', slug: 'design', description: 'UI/UX and design topics' },
    { id: 3, name: 'Tutorial', slug: 'tutorial', description: 'Step-by-step guides' },
  ],
  tags: [
    { id: 1, name: 'javascript', color: '#f7df1e' },
    { id: 2, name: 'typescript', color: '#3178c6' },
    { id: 3, name: 'react', color: '#61dafb' },
    { id: 4, name: 'nextjs', color: '#ffffff' },
    { id: 5, name: 'database', color: '#3ecf8e' },
  ],
};

// ===== Auth Users =====
export const mockAuthUsers: AuthUser[] = [
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', email: 'john@example.com', role: 'authenticated', provider: 'email', lastSignIn: '2025-06-25T14:30:00Z', createdAt: '2025-01-15T10:30:00Z', metadata: { name: 'John Doe' } },
  { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', email: 'jane@example.com', role: 'authenticated', provider: 'email', lastSignIn: '2025-06-24T09:15:00Z', createdAt: '2025-02-20T08:15:00Z', metadata: { name: 'Jane Smith' } },
  { id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', email: 'admin@vorebase.io', role: 'admin', provider: 'email', lastSignIn: '2025-06-26T16:45:00Z', createdAt: '2025-01-01T00:00:00Z', metadata: { name: 'Admin' } },
  { id: 'd4e5f6a7-b8c9-0123-defa-234567890123', email: 'alice@startup.io', role: 'authenticated', provider: 'email', lastSignIn: '2025-06-20T11:20:00Z', createdAt: '2025-03-10T12:00:00Z', metadata: { name: 'Alice Dev' } },
  { id: 'e5f6a7b8-c9d0-1234-efab-345678901234', email: 'bob@company.com', role: 'authenticated', provider: 'email', lastSignIn: null, createdAt: '2025-04-05T16:30:00Z', metadata: { name: 'Bob Builder' } },
];

// ===== RLS Policies =====
export const mockPolicies: RlsPolicy[] = [
  { id: 'pol_1', name: 'Users can read own data', tableName: 'users', operation: 'SELECT', roles: ['authenticated'], check: 'auth.uid() = id', isEnabled: true, createdAt: '2025-01-15T10:30:00Z' },
  { id: 'pol_2', name: 'Users can update own profile', tableName: 'users', operation: 'UPDATE', roles: ['authenticated'], check: 'auth.uid() = id', isEnabled: true, createdAt: '2025-01-15T10:30:00Z' },
  { id: 'pol_3', name: 'Anyone can read published posts', tableName: 'posts', operation: 'SELECT', roles: ['authenticated', 'anon'], check: 'published = true', isEnabled: true, createdAt: '2025-02-01T10:00:00Z' },
  { id: 'pol_4', name: 'Authors can edit own posts', tableName: 'posts', operation: 'UPDATE', roles: ['authenticated'], check: 'auth.uid() = author_id', isEnabled: true, createdAt: '2025-02-01T10:00:00Z' },
  { id: 'pol_5', name: 'Authors can delete own posts', tableName: 'posts', operation: 'DELETE', roles: ['authenticated'], check: 'auth.uid() = author_id', isEnabled: false, createdAt: '2025-02-01T10:00:00Z' },
];

// ===== Storage =====
export const mockBuckets: StorageBucket[] = [
  { id: 'bkt_1', name: 'avatars', isPublic: true, fileCount: 234, totalSize: '45.2 MB', createdAt: '2025-01-15T10:30:00Z' },
  { id: 'bkt_2', name: 'documents', isPublic: false, fileCount: 89, totalSize: '1.2 GB', createdAt: '2025-02-10T09:00:00Z' },
  { id: 'bkt_3', name: 'media', isPublic: true, fileCount: 567, totalSize: '890 MB', createdAt: '2025-03-05T14:30:00Z' },
];

export const mockFiles: Record<string, StorageFile[]> = {
  bkt_1: [
    { id: 'f1', name: 'profile-pic-001.jpg', bucketId: 'bkt_1', mimeType: 'image/jpeg', size: 245760, createdAt: '2025-02-15T10:30:00Z', updatedAt: '2025-02-15T10:30:00Z' },
    { id: 'f2', name: 'avatar-default.png', bucketId: 'bkt_1', mimeType: 'image/png', size: 102400, createdAt: '2025-01-20T08:00:00Z', updatedAt: '2025-01-20T08:00:00Z' },
    { id: 'f3', name: 'team/john-doe.jpg', bucketId: 'bkt_1', mimeType: 'image/jpeg', size: 358400, createdAt: '2025-03-10T14:00:00Z', updatedAt: '2025-03-10T14:00:00Z' },
  ],
  bkt_2: [
    { id: 'f4', name: 'report-q1-2025.pdf', bucketId: 'bkt_2', mimeType: 'application/pdf', size: 5242880, createdAt: '2025-04-01T09:00:00Z', updatedAt: '2025-04-01T09:00:00Z' },
    { id: 'f5', name: 'invoice-march.pdf', bucketId: 'bkt_2', mimeType: 'application/pdf', size: 1048576, createdAt: '2025-03-30T16:00:00Z', updatedAt: '2025-03-30T16:00:00Z' },
  ],
  bkt_3: [
    { id: 'f6', name: 'hero-banner.mp4', bucketId: 'bkt_3', mimeType: 'video/mp4', size: 52428800, createdAt: '2025-05-01T10:00:00Z', updatedAt: '2025-05-01T10:00:00Z' },
    { id: 'f7', name: 'product-demo.webm', bucketId: 'bkt_3', mimeType: 'video/webm', size: 31457280, createdAt: '2025-05-10T11:00:00Z', updatedAt: '2025-05-10T11:00:00Z' },
    { id: 'f8', name: 'thumbnail-01.webp', bucketId: 'bkt_3', mimeType: 'image/webp', size: 204800, createdAt: '2025-05-15T14:30:00Z', updatedAt: '2025-05-15T14:30:00Z' },
  ],
};

// ===== API Keys =====
export const mockApiKeys: ApiKey[] = [
  { id: 'key_1', name: 'anon (public)', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZopqoUt20...', role: 'anon', createdAt: '2025-01-15T10:30:00Z' },
  { id: 'key_2', name: 'service_role (secret)', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0...', role: 'service_role', createdAt: '2025-01-15T10:30:00Z' },
];

// ===== Logs =====
export const mockLogs: LogEntry[] = [
  { id: 'log_1', timestamp: '2025-06-26T16:45:32Z', level: 'info', service: 'auth-service', message: 'User admin@vorebase.io signed in successfully' },
  { id: 'log_2', timestamp: '2025-06-26T16:44:18Z', level: 'info', service: 'rest-service', message: 'GET /rest/v1/posts?select=id,title&limit=10 - 200 (12ms)' },
  { id: 'log_3', timestamp: '2025-06-26T16:43:55Z', level: 'warn', service: 'storage-service', message: 'Upload exceeds recommended size: 52MB (limit: 50MB)' },
  { id: 'log_4', timestamp: '2025-06-26T16:42:01Z', level: 'error', service: 'rest-service', message: 'RLS policy violation: user does not have SELECT permission on table "admin_logs"' },
  { id: 'log_5', timestamp: '2025-06-26T16:41:30Z', level: 'info', service: 'ws-server', message: 'WebSocket connection established: client_abc123' },
  { id: 'log_6', timestamp: '2025-06-26T16:40:15Z', level: 'debug', service: 'rest-service', message: 'Query compiled: SELECT id, title FROM posts WHERE published = true ORDER BY created_at DESC LIMIT 10' },
  { id: 'log_7', timestamp: '2025-06-26T16:39:00Z', level: 'info', service: 'auth-service', message: 'New user registered: alice@startup.io' },
  { id: 'log_8', timestamp: '2025-06-26T16:38:45Z', level: 'error', service: 'auth-service', message: 'Failed login attempt for unknown@example.com - invalid credentials' },
];

// ===== SQL Query History =====
export const mockQueryHistory: SqlQuery[] = [
  { id: 'q_1', sql: 'SELECT * FROM users LIMIT 10;', executedAt: '2025-06-26T16:45:00Z', duration: 12, rowsAffected: 10 },
  { id: 'q_2', sql: "SELECT id, title, published FROM posts WHERE published = true ORDER BY created_at DESC;", executedAt: '2025-06-26T16:40:00Z', duration: 8, rowsAffected: 3 },
  { id: 'q_3', sql: "INSERT INTO tags (name, color) VALUES ('graphql', '#e535ab');", executedAt: '2025-06-26T16:35:00Z', duration: 5, rowsAffected: 1 },
  { id: 'q_4', sql: 'SELECT COUNT(*) as total FROM comments GROUP BY post_id;', executedAt: '2025-06-26T16:30:00Z', duration: 15, rowsAffected: 4 },
];

// ===== Database Roles =====
export interface DbRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  color: string;
}

export const mockRoles: DbRole[] = [
  {
    id: "anon",
    name: "anon",
    description: "Anonymous (unauthenticated) users",
    permissions: ["SELECT on public tables (with RLS)"],
    isDefault: true,
    color: "bg-info-muted text-info",
  },
  {
    id: "authenticated",
    name: "authenticated",
    description: "Authenticated users",
    permissions: ["SELECT", "INSERT", "UPDATE", "DELETE on allowed tables"],
    isDefault: true,
    color: "bg-accent-muted text-accent",
  },
  {
    id: "service_role",
    name: "service_role",
    description: "Backend service role — bypasses RLS",
    permissions: ["ALL on ALL tables", "Bypasses Row Level Security"],
    isDefault: true,
    color: "bg-danger-muted text-danger",
  },
];

// ===== Database Extensions =====
export interface DbExtension {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  category: string;
}

export const mockExtensions: DbExtension[] = [
  { id: "uuid-ossp", name: "uuid-ossp", version: "1.1", description: "Generate universally unique identifiers (UUIDs)", enabled: true, category: "Utilities" },
  { id: "pgcrypto", name: "pgcrypto", version: "1.3", description: "Cryptographic functions for PostgreSQL", enabled: true, category: "Security" },
  { id: "pg_trgm", name: "pg_trgm", version: "1.6", description: "Text similarity measurement and index searching based on trigrams", enabled: false, category: "Search" },
  { id: "fuzzystrmatch", name: "fuzzystrmatch", version: "1.1", description: "Fuzzy string matching functions", enabled: false, category: "Search" },
  { id: "vector", name: "vector", version: "0.5.1", description: "Open-source vector similarity search for Postgres", enabled: true, category: "AI/ML" },
  { id: "pg_stat_statements", name: "pg_stat_statements", version: "1.10", description: "Track execution statistics of all SQL statements", enabled: false, category: "Monitoring" },
  { id: "postgis", name: "postgis", version: "3.4", description: "Geographic Objects for PostgreSQL", enabled: false, category: "Geospatial" },
  { id: "timescaledb", name: "timescaledb", version: "2.13", description: "Time-series data extension for PostgreSQL", enabled: false, category: "Time-series" },
];

// ===== Helpers =====
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateString);
}

export function getProjectById(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id);
}

export function getTableByName(name: string): TableInfo | undefined {
  return mockTables.find((t) => t.name === name);
}
