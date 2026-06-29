// ===== Route Constants & App Configuration =====

// Brand
export const APP_NAME = "Vorebase";
export const APP_DESCRIPTION = "Open-source Backend-as-a-Service platform";

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PROJECTS: "/projects",
  NEW_PROJECT: "/projects/new",

  // Project-scoped routes (use with project ID)
  project: (id: string) => ({
    HOME: `/project/${id}`,
    EDITOR: `/project/${id}/editor`,
    EDITOR_TABLE: (table: string) => `/project/${id}/editor/${table}`,
    SQL: `/project/${id}/sql`,
    AUTH_USERS: `/project/${id}/auth/users`,
    AUTH_POLICIES: `/project/${id}/auth/policies`,
    STORAGE: `/project/${id}/storage`,
    STORAGE_BUCKET: (bucket: string) => `/project/${id}/storage/${bucket}`,
    API: `/project/${id}/api`,
    DATABASE_TABLES: `/project/${id}/database/tables`,
    DATABASE_ROLES: `/project/${id}/database/roles`,
    DATABASE_EXTENSIONS: `/project/${id}/database/extensions`,
    LOGS: `/project/${id}/logs`,
    SETTINGS_GENERAL: `/project/${id}/settings/general`,
    SETTINGS_API: `/project/${id}/settings/api`,
    SETTINGS_DANGER: `/project/${id}/settings/danger`,
  }),
} as const;

// Sidebar navigation structure
export interface NavItem {
  label: string;
  icon: string; // icon component name
  href: string;
  section?: string;
}

export function getSidebarNavItems(projectId: string): NavItem[] {
  const r = ROUTES.project(projectId);
  return [
    { label: "Home", icon: "IconHome", href: r.HOME },
    { label: "Table Editor", icon: "IconTable", href: r.EDITOR, section: "Database" },
    { label: "SQL Editor", icon: "IconCode", href: r.SQL },
    { label: "Database", icon: "IconDatabase", href: r.DATABASE_TABLES },
    { label: "Auth Users", icon: "IconUsers", href: r.AUTH_USERS, section: "Authentication" },
    { label: "Policies", icon: "IconShield", href: r.AUTH_POLICIES },
    { label: "Storage", icon: "IconFolder", href: r.STORAGE, section: "Storage" },
    { label: "API Docs", icon: "IconFileText", href: r.API, section: "API" },
    { label: "API Keys", icon: "IconKey", href: r.SETTINGS_API },
    { label: "Logs", icon: "IconLogs", href: r.LOGS, section: "System" },
    { label: "Settings", icon: "IconSettings", href: r.SETTINGS_GENERAL },
  ];
}

// Settings sub-navigation
export function getSettingsNavItems(projectId: string) {
  const r = ROUTES.project(projectId);
  return [
    { label: "General", href: r.SETTINGS_GENERAL },
    { label: "API", href: r.SETTINGS_API },
    { label: "Danger Zone", href: r.SETTINGS_DANGER },
  ];
}

// Default ports
export const PORTS = {
  STUDIO: 3000,
  AUTH: 4001,
  REST: 4002,
  STORAGE: 4003,
  REALTIME: 4004,
} as const;
