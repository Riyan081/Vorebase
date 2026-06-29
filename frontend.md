# 🎨 Vorebase Studio — Frontend Implementation Plan

> **Supervisor directive:** Build all frontend pages first. Backend will be wired later.  
> **Status:** Approved and ready to execute.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Design System](#3-design-system)
4. [Page Map & Routes](#4-page-map--routes)
5. [Layouts](#5-layouts)
6. [Page Designs — Detailed Spec](#6-page-designs--detailed-spec)
7. [Shared Components](#7-shared-components)
8. [File Structure](#8-file-structure)
9. [Mock Data](#9-mock-data)
10. [Implementation Phases](#10-implementation-phases)
11. [Checklist](#11-checklist)

---

## 1. Overview

We're building **Vorebase Studio** — a Supabase-like dashboard where developers can:

- Sign up / log in (email + social OAuth buttons)
- Create and manage projects
- Browse and edit database tables (spreadsheet UI)
- Write and run SQL queries
- Manage authenticated users
- Upload, browse, and manage files (storage)
- View auto-generated API documentation
- Manage API keys and RLS policies
- Configure project settings

All pages will use **mock/hardcoded data**. When the backend is ready, we simply replace mock imports with `fetch()` calls.

---

## 2. Tech Stack

| Technology | Version | Purpose |
|:---|:---|:---|
| **Next.js** | 16.x | App Router, Server Components, file-based routing |
| **React** | 19.x | UI framework |
| **TypeScript** | 5.9 | Type safety |
| **Tailwind CSS** | 4.x | Styling (already installed) |
| **`@repo/ui`** | workspace | Shared component library |
| **CodeMirror** | 6.x | SQL Editor (code editing component) |
| **Lucide React** | latest | Icon library (consistent with Supabase's icon style) |

### New Dependencies to Install

```bash
cd apps/web
pnpm add @codemirror/lang-sql @codemirror/theme-one-dark codemirror @codemirror/state @codemirror/view lucide-react
```

---

## 3. Design System

### Color Palette (Dark Mode — Supabase-inspired)

```css
/* Backgrounds */
--bg-root:          #0f0f0f;     /* Page background */
--bg-surface:       #171717;     /* Cards, panels, sidebar */
--bg-overlay:       #1e1e1e;     /* Modals, dropdowns */
--bg-hover:         #252525;     /* Hover states */
--bg-active:        #2a2a2a;     /* Active/selected states */

/* Brand / Accent */
--accent:           #3ecf8e;     /* Primary green (Supabase green) */
--accent-hover:     #34b87a;     /* Green hover */
--accent-muted:     #3ecf8e1a;  /* Green at 10% opacity — subtle highlights */

/* Text */
--text-primary:     #ededed;     /* Main text */
--text-secondary:   #a1a1a1;     /* Muted / descriptions */
--text-tertiary:    #666666;     /* Placeholders, disabled */

/* Borders */
--border:           #2e2e2e;     /* Default borders */
--border-hover:     #404040;     /* Hover borders */

/* Status */
--success:          #3ecf8e;
--warning:          #f59e0b;
--error:            #ef4444;
--info:             #3b82f6;

/* Sidebar */
--sidebar-bg:       #121212;
--sidebar-item-hover: #1e1e1e;
--sidebar-item-active: #1e1e1e;
```

### Typography

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Sizes */
--text-xs:    0.75rem;    /* 12px */
--text-sm:    0.8125rem;  /* 13px — Supabase uses 13px a lot */
--text-base:  0.875rem;   /* 14px — default body */
--text-lg:    1rem;       /* 16px */
--text-xl:    1.125rem;   /* 18px */
--text-2xl:   1.5rem;     /* 24px — page titles */
--text-3xl:   1.875rem;   /* 30px — hero text */
```

### Spacing & Layout

```css
--sidebar-width:           240px;
--sidebar-collapsed-width: 56px;
--header-height:           48px;
--content-max-width:       1200px;
--radius-sm:    4px;
--radius-md:    6px;
--radius-lg:    8px;
--radius-xl:    12px;
```

### Shadows

```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.3);
--shadow-md:  0 4px 12px rgba(0,0,0,0.4);
--shadow-lg:  0 8px 24px rgba(0,0,0,0.5);
--shadow-dropdown: 0 4px 16px rgba(0,0,0,0.6);
```

---

## 4. Page Map & Routes

### Route Structure

```
/                               → Redirect to /projects (if logged in) or /login
│
├── /login                      → Login page (AuthLayout)
├── /register                   → Register page (AuthLayout)
│
├── /projects                   → Project list (DashboardLayout — no sidebar)
├── /projects/new               → Create new project (DashboardLayout)
│
└── /project/[id]/              → Project pages (DashboardLayout — with sidebar)
    ├── /                       → Project overview / home
    │
    ├── /editor                 → Table Editor (main feature page)
    ├── /editor/[table]         → Table Editor — specific table selected
    │
    ├── /sql                    → SQL Editor
    │
    ├── /auth/users             → Auth — User list
    ├── /auth/policies          → Auth — RLS Policies
    │
    ├── /storage                → Storage — Bucket list
    ├── /storage/[bucket]       → Storage — File browser inside bucket
    │
    ├── /api                    → API Documentation
    │
    ├── /database
    │   ├── /tables             → Database — Tables schema view
    │   ├── /roles              → Database — Roles management
    │   └── /extensions         → Database — Extensions list
    │
    ├── /logs                   → Logs viewer
    │
    └── /settings
        ├── /general            → General settings
        ├── /api                → API keys & URL
        └── /danger             → Danger zone (delete project)
```

### Sidebar Navigation Items (inside `/project/[id]`)

```
ICON        LABEL              ROUTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠  Home                /project/[id]
📝  Table Editor        /project/[id]/editor
⌨️   SQL Editor          /project/[id]/sql

── CONNECT ──
🔑  Authentication      /project/[id]/auth/users
📦  Storage             /project/[id]/storage
📄  API Docs            /project/[id]/api

── CONFIGURE ──
🗄️   Database            /project/[id]/database/tables
📊  Logs                /project/[id]/logs
⚙️   Settings            /project/[id]/settings/general
```

---

## 5. Layouts

### Layout 1: `AuthLayout`

Used by: `/login`, `/register`

```
┌────────────────────────────────────────────┐
│                                            │
│                                            │
│         ┌──────────────────────┐           │
│         │    🔥 Vorebase       │           │
│         │                      │           │
│         │   ┌──────────────┐   │           │
│         │   │ Email        │   │           │
│         │   └──────────────┘   │           │
│         │   ┌──────────────┐   │           │
│         │   │ Password     │   │           │
│         │   └──────────────┘   │           │
│         │                      │           │
│         │   [ Sign In ]        │           │
│         │                      │           │
│         │   ── or continue ──  │           │
│         │   [ Google ] [GitHub]│           │
│         │                      │           │
│         │  Don't have account? │           │
│         │  Sign up →           │           │
│         └──────────────────────┘           │
│                                            │
│         Dark bg with subtle grid           │
└────────────────────────────────────────────┘
```

**Characteristics:**
- Full-screen dark background with subtle dot grid or gradient
- Centered card (max-width: 400px)
- Vorebase logo/name at top
- No sidebar, no header

---

### Layout 2: `DashboardLayout`

Used by: All `/project/[id]/*` pages

```
┌──────┬─────────────────────────────────────────┐
│      │  Header: breadcrumbs    [user avatar ▼] │
│  S   ├─────────────────────────────────────────┤
│  I   │                                         │
│  D   │                                         │
│  E   │          Main Content Area              │
│  B   │                                         │
│  A   │     (Page-specific content renders      │
│  R   │      here via {children})               │
│      │                                         │
│      │                                         │
│ 240px│                                         │
└──────┴─────────────────────────────────────────┘
```

**Characteristics:**
- Left sidebar: 240px, fixed, scrollable independently
- Top header: 48px, contains breadcrumbs + project selector + user dropdown
- Main content: fills remaining space, scrollable
- Sidebar collapses to 56px (icon-only) on smaller screens

---

### Layout 3: `ProjectsLayout`

Used by: `/projects`, `/projects/new`

```
┌─────────────────────────────────────────────────┐
│  Header: 🔥 Vorebase    Projects   [user ▼]    │
├─────────────────────────────────────────────────┤
│                                                 │
│          Main Content (centered, max 1200px)    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Characteristics:**
- Full-width, no sidebar
- Simple top navbar with logo + user dropdown
- Content is centered with max-width

---

## 6. Page Designs — Detailed Spec

### 6.1 Login Page (`/login`)

**Layout:** AuthLayout

**Elements:**
- Vorebase logo + "Sign in to your account" heading
- Email input field
- Password input field (with show/hide toggle)
- "Forgot password?" link (disabled/coming soon)
- "Sign In" primary button (green)
- Divider: "or continue with"
- OAuth buttons: "Sign in with Google" + "Sign in with GitHub" (UI only, non-functional)
- Footer text: "Don't have an account? Sign up" (links to `/register`)

**Mock behavior:** Any email/password combo succeeds. Stores a flag in localStorage. Redirects to `/projects`.

---

### 6.2 Register Page (`/register`)

**Layout:** AuthLayout

**Elements:**
- Vorebase logo + "Create your account" heading
- Email input
- Password input (with strength indicator)
- Confirm password input
- "Sign Up" primary button
- Footer: "Already have an account? Sign in"

**Mock behavior:** Always succeeds. Redirects to `/projects`.

---

### 6.3 Projects Page (`/projects`)

**Layout:** ProjectsLayout

**Elements:**
- Page title: "Your Projects"
- "New Project" button (top-right, green)
- Project cards in a grid (2-3 columns):
  - Each card shows:
    - Project name (bold)
    - Database name (muted, monospace)
    - Region badge
    - Created date
    - Status indicator (green dot = active)
  - Clicking a card navigates to `/project/[id]`

**Mock data:** 3-4 sample projects

---

### 6.4 New Project Page (`/projects/new`)

**Layout:** ProjectsLayout

**Elements:**
- "Create a new project" heading
- Form fields:
  - Project name (text input)
  - Database password (auto-generated with copy button)
  - Region selector (dropdown with flags: US East, EU West, Asia)
  - Pricing plan selector (Free tier highlighted)
- "Create Project" button
- Sidebar note: estimated setup time, what's included

**Mock behavior:** Adds to mock data array, redirects to `/project/[newid]`

---

### 6.5 Project Home (`/project/[id]`)

**Layout:** DashboardLayout

**Elements:**
- Welcome section: "Welcome to [Project Name]"
- Quick stats row (4 cards):
  - Tables: count
  - Auth users: count
  - Storage used: "2.4 MB / 1 GB"
  - API requests (24h): count
- "Getting Started" checklist:
  - ☑ Create a project
  - ☐ Create a table
  - ☐ Insert some data
  - ☐ Set up authentication
  - ☐ Configure storage
- Connect section:
  - Project URL: `http://localhost:4000` (copy button)
  - Anon key: `eyJhbGci...` (copy button, masked by default)
  - Code snippet: quick start example

---

### 6.6 Table Editor (`/project/[id]/editor`)

**Layout:** DashboardLayout  
**This is the MOST COMPLEX page — the signature feature.**

```
┌──────┬──────────┬──────────────────────────────────┐
│      │ Tables   │  Toolbar: [+ Insert Row] [Filter]│
│  S   │          │  [Sort] [Columns ▼]   search...  │
│  I   │ ┌──────┐ ├──────────────────────────────────┤
│  D   │ │users │ │ ☐ │ id      │ name    │ email   │
│  E   │ ├──────┤ │───┼─────────┼─────────┼─────────│
│  B   │ │posts │ │ ☐ │ abc-123 │ John    │ j@e.com │
│  A   │ ├──────┤ │ ☐ │ def-456 │ Jane    │ j@e.com │
│  R   │ │cmts  │ │ ☐ │ ghi-789 │ Bob     │ b@e.com │
│      │ └──────┘ │   │         │         │         │
│      │          │───────────────────────────────────│
│      │ [+Table] │  Showing 3 of 3 rows    < 1/1 > │
└──────┴──────────┴──────────────────────────────────┘
```

**Left Panel (Table List):**
- List of all tables in the database (from mock data)
- Clicking a table loads its data
- Search/filter tables
- "New Table" button at bottom → opens modal

**Top Toolbar:**
- "Insert Row" button → opens side panel/modal
- "Filter" button → dropdown to add WHERE filters
- "Sort" button → dropdown to configure ORDER BY
- Column visibility toggle
- Search within table

**Main Grid (Data Table):**
- Spreadsheet-like data grid
- Checkbox column for row selection
- Column headers with type badge (varchar, int, uuid, timestamp)
- Inline cell editing (click to edit)
- Row actions (on hover): Edit, Delete
- Pagination at bottom: "Showing X of Y rows" + page controls

**"New Table" Modal:**
- Table name input
- Column builder:
  - Name, Type (dropdown: varchar, int, text, boolean, datetime, uuid), Default, Nullable, Primary Key
  - "Add column" button
- "Save" button

**"Insert Row" Panel:**
- Slide-out from right
- Form with input fields for each column
- Auto-fills defaults (uuid, timestamp)
- "Save" and "Cancel" buttons

---

### 6.7 SQL Editor (`/project/[id]/sql`)

**Layout:** DashboardLayout

```
┌──────┬──────────────────────────────────────────┐
│      │  Tab: Untitled-1  ×  [+ New Query]       │
│  S   ├──────────────────────────────────────────┤
│  I   │                                          │
│  D   │   SELECT * FROM users                    │
│  E   │   WHERE created_at > '2025-01-01'        │
│  B   │   ORDER BY name ASC                      │
│  A   │   LIMIT 10;                              │
│  R   │                          [▶ Run] (Ctrl+↵)│
│      ├──────────────────────────────────────────┤
│      │  Results (3 rows, 12ms)                  │
│      │  ┌────────┬─────────┬──────────────────┐ │
│      │  │ id     │ name    │ email            │ │
│      │  ├────────┼─────────┼──────────────────┤ │
│      │  │ abc-1  │ John    │ john@example.com │ │
│      │  │ def-2  │ Jane    │ jane@example.com │ │
│      │  └────────┴─────────┴──────────────────┘ │
└──────┴──────────────────────────────────────────┘
```

**Elements:**
- **Tabs bar:** Multiple query tabs (like VS Code). New query button.
- **Code editor area:** CodeMirror 6 with SQL syntax highlighting, dark theme, line numbers, auto-complete
- **Run button:** Green "Run" button + keyboard shortcut `Ctrl+Enter`
- **Resizable split:** Drag handle between editor and results
- **Results panel:**
  - Tab: "Results" | "Messages"
  - Data table showing query results
  - Row count + execution time
  - If error: show error message with line/column highlight

**Mock behavior:** Recognizes a few hardcoded queries (e.g., `SELECT * FROM users`) and returns mock results. Unknown queries show "Query executed successfully (mock mode)".

---

### 6.8 Auth Users (`/project/[id]/auth/users`)

**Layout:** DashboardLayout

**Elements:**
- Page title: "Users" with subtitle "Manage your project's authenticated users"
- "Add User" button (opens modal)
- Sub-navigation tabs: "Users" | "Policies"
- Data table:
  - Columns: User ID (uuid), Email, Provider (badge: email/google/github), Created, Last Sign In
  - Row actions: View details, Delete
- User count footer

**"Add User" Modal:**
- Email input
- Password input (auto-generate option)
- Auto-confirm email toggle
- "Create User" button

---

### 6.9 Auth Policies (`/project/[id]/auth/policies`)

**Layout:** DashboardLayout

**Elements:**
- Sub-navigation tabs: "Users" | "Policies"
- Table selector dropdown at top
- For each table, show policy cards:
  - Policy name
  - Operation badge: SELECT / INSERT / UPDATE / DELETE
  - Target roles: "authenticated", "anon"
  - Enable/disable toggle
  - Edit / Delete buttons
- "New Policy" button → modal
- Empty state: illustration + "No policies. Your table is accessible to all." warning

**"New Policy" Modal:**
- Policy name
- Table selector
- Operation selector (SELECT, INSERT, UPDATE, DELETE, ALL)
- Using expression (code input): e.g., `auth.uid() = user_id`
- Target roles (multi-select)

---

### 6.10 Storage (`/project/[id]/storage`)

**Layout:** DashboardLayout

```
┌──────┬──────────┬──────────────────────────────────┐
│      │ Buckets  │  Breadcrumb: avatars / profiles  │
│  S   │          │  [Upload] [Create Folder] search  │
│  I   │ ┌──────┐ ├──────────────────────────────────┤
│  D   │ │avatar│ │ ☐ │ 📷 │ profile_1.jpg  │ 245KB │
│  E   │ ├──────┤ │ ☐ │ 📷 │ profile_2.png  │ 512KB │
│  B   │ │docs  │ │ ☐ │ 📁 │ thumbnails/    │ --    │
│  A   │ ├──────┤ │ ☐ │ 📄 │ resume.pdf     │ 1.2MB │
│  R   │ │public│ │   │    │                │       │
│      │ └──────┘ │───────────────────────────────────│
│      │ [+Bucket]│  4 items               < 1/1 >  │
└──────┴──────────┴──────────────────────────────────┘
```

**Left Panel (Bucket List):**
- List of storage buckets
- Badge: public / private
- "New Bucket" button → modal

**Main Area (File Browser):**
- Breadcrumb navigation (bucket > folder > subfolder)
- Toolbar: Upload button, Create folder, Search, View toggle (grid/list)
- File list/grid:
  - Icon (image preview thumbnail, folder icon, document icon)
  - File name
  - Size
  - Last modified
  - Checkbox for multi-select
- Actions on selection: Download, Copy URL, Delete

**Upload Area:**
- Drag-and-drop zone
- File picker button
- Upload progress bars

**Image Preview:**
- Click on image file → preview modal with full-size image + metadata

**"New Bucket" Modal:**
- Bucket name input
- Public toggle (with explanation)
- File size limit input
- Allowed MIME types multi-select

---

### 6.11 API Docs (`/project/[id]/api`)

**Layout:** DashboardLayout

**Elements:**
- Left sidebar: list of tables (auto-generated API endpoints)
- Main area for selected table:
  - Section: Introduction (project URL, API key instructions)
  - For each operation (Read, Insert, Update, Delete):
    - Endpoint description
    - HTTP method + URL
    - Code snippet tabs: JavaScript | cURL | Python
    - "Copy" button per snippet
  - Code snippets should use the Supabase client syntax:
    ```javascript
    const { data, error } = await vorebase
      .from('users')
      .select('id, name, email')
      .eq('active', true)
    ```

---

### 6.12 Database Tables (`/project/[id]/database/tables`)

**Layout:** DashboardLayout

**Elements:**
- List of all tables as expandable cards:
  - Table name + row count
  - Expand to show column details:
    - Column name, type, nullable, default, primary key, foreign key
  - Schema visualization (optional: simple ER diagram)
- "Create Table" button (same modal as Table Editor)

---

### 6.13 Logs (`/project/[id]/logs`)

**Layout:** DashboardLayout

**Elements:**
- Filter bar: Service filter (Auth, REST, Storage, Realtime), Log level (info, warn, error), date range
- Log entries table:
  - Timestamp
  - Level badge (green=info, yellow=warn, red=error)
  - Service badge
  - Message (monospace, expandable for long messages)
- Auto-refresh toggle
- "Clear filters" button

---

### 6.14 Settings — General (`/project/[id]/settings/general`)

**Layout:** DashboardLayout

**Settings sub-nav tabs:** General | API | Danger Zone

**Elements:**
- Project name (editable input + save button)
- Project ID (read-only, copy button)
- Database name (read-only)
- Region (read-only badge)
- Created date

---

### 6.15 Settings — API (`/project/[id]/settings/api`)

**Elements:**
- Project URL: read-only with copy button
- API Keys section:
  - `anon` (public) key: masked by default, reveal button, copy button
  - `service_role` (secret) key: masked, reveal, copy. Warning: "This key bypasses RLS"
- JWT Secret: masked, reveal, copy
- Code example: "Initialize your client"

---

### 6.16 Settings — Danger Zone (`/project/[id]/settings/danger`)

**Elements:**
- Red-bordered section
- "Pause project" button (with confirmation dialog)
- "Delete project" button → confirmation dialog:
  - Type project name to confirm
  - Red "Delete" button

---

## 7. Shared Components

### Components to build in `@repo/ui` or `apps/web/components`

| Component | Description | Used In |
|:---|:---|:---|
| `Button` | Primary, secondary, danger, ghost, outline variants. Sizes: sm, md, lg. Loading state. | Everywhere |
| `Input` | Text, email, password (with reveal toggle), search. Label + error message support. | Forms |
| `Select` | Dropdown select with search. Single + multi-select. | Filters, forms |
| `Modal` | Overlay dialog. Header, body, footer. Close on overlay click + Escape. Sizes: sm, md, lg. | Table creation, user creation, etc. |
| `DataTable` | Sortable columns, checkbox selection, pagination, loading skeleton. Fixed header. | Table Editor, Users, Storage, Logs |
| `Tabs` | Horizontal tab navigation. Active state. | SQL Editor, Auth, Settings |
| `Badge` | Colored label. Variants: default, success, warning, error, info. | Status, roles, types |
| `Toast` | Bottom-right notification. Success, error, info variants. Auto-dismiss. | After actions (create, delete, copy) |
| `Tooltip` | Hover tooltip. Arrow. Configurable position. | Icon buttons, truncated text |
| `Dropdown` | Click-triggered dropdown menu with items, separators, and sub-menus. | User avatar, row actions |
| `Breadcrumb` | Path navigation with chevrons. Clickable segments. | Storage browser, header |
| `EmptyState` | Centered illustration + message + CTA button. | Empty tables, no projects, no files |
| `CopyButton` | Click to copy text. Shows "Copied!" feedback. | API keys, URLs, code snippets |
| `Toggle` | On/off switch with label. | Public bucket, enable policy |
| `Skeleton` | Loading placeholder animation. | All data-loading states |
| `SidePanel` | Slide-in panel from right. Header + scrollable body. | Insert row, file details |
| `SearchInput` | Input with search icon, debounced onChange, clear button. | Table list, file browser |
| `CodeBlock` | Syntax-highlighted code display with copy button. Language tabs (JS, curl, Python). | API docs |
| `ConfirmDialog` | "Are you sure?" modal with configurable message and destructive action. | Delete operations |

---

## 8. File Structure

```
apps/web/
├── app/
│   ├── globals.css                             # Design system tokens + base styles
│   ├── layout.tsx                              # Root layout (fonts, metadata)
│   ├── page.tsx                                # "/" → redirect logic
│   │
│   ├── (auth)/                                 # Auth route group (AuthLayout)
│   │   ├── layout.tsx                          # AuthLayout wrapper
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── login.module.css
│   │   └── register/
│   │       ├── page.tsx
│   │       └── register.module.css
│   │
│   ├── (main)/                                 # Main app route group
│   │   ├── layout.tsx                          # Top navbar layout (projects pages)
│   │   ├── projects/
│   │   │   ├── page.tsx                        # Project list
│   │   │   ├── projects.module.css
│   │   │   └── new/
│   │   │       ├── page.tsx                    # Create project form
│   │   │       └── new-project.module.css
│   │   │
│   │   └── project/
│   │       └── [id]/
│   │           ├── layout.tsx                  # DashboardLayout (sidebar + header)
│   │           ├── page.tsx                    # Project home/overview
│   │           │
│   │           ├── editor/
│   │           │   ├── page.tsx                # Table editor (default table)
│   │           │   ├── [table]/
│   │           │   │   └── page.tsx            # Table editor (specific table)
│   │           │   └── editor.module.css
│   │           │
│   │           ├── sql/
│   │           │   ├── page.tsx                # SQL editor
│   │           │   └── sql.module.css
│   │           │
│   │           ├── auth/
│   │           │   ├── users/
│   │           │   │   └── page.tsx            # Auth users list
│   │           │   └── policies/
│   │           │       └── page.tsx            # RLS policies
│   │           │
│   │           ├── storage/
│   │           │   ├── page.tsx                # Storage bucket list
│   │           │   ├── [bucket]/
│   │           │   │   └── page.tsx            # File browser
│   │           │   └── storage.module.css
│   │           │
│   │           ├── api/
│   │           │   └── page.tsx                # API documentation
│   │           │
│   │           ├── database/
│   │           │   ├── tables/
│   │           │   │   └── page.tsx            # Schema viewer
│   │           │   ├── roles/
│   │           │   │   └── page.tsx
│   │           │   └── extensions/
│   │           │       └── page.tsx
│   │           │
│   │           ├── logs/
│   │           │   └── page.tsx                # Log viewer
│   │           │
│   │           └── settings/
│   │               ├── general/
│   │               │   └── page.tsx
│   │               ├── api/
│   │               │   └── page.tsx            # API keys
│   │               └── danger/
│   │                   └── page.tsx            # Danger zone
│
├── components/                                 # App-specific components
│   ├── layouts/
│   │   ├── auth-layout.tsx
│   │   ├── dashboard-layout.tsx
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── project-selector.tsx
│   │
│   ├── table-editor/
│   │   ├── table-grid.tsx                      # Main data grid
│   │   ├── table-sidebar.tsx                   # Table list panel
│   │   ├── column-header.tsx                   # Column header with type badge
│   │   ├── cell-editor.tsx                     # Inline cell editing
│   │   ├── insert-row-panel.tsx                # Side panel for new row
│   │   ├── create-table-modal.tsx              # Modal for new table
│   │   ├── filter-dropdown.tsx                 # Filter configuration
│   │   └── sort-dropdown.tsx                   # Sort configuration
│   │
│   ├── sql-editor/
│   │   ├── editor.tsx                          # CodeMirror wrapper
│   │   ├── results-table.tsx                   # Query results display
│   │   ├── query-tabs.tsx                      # Tab bar for multiple queries
│   │   └── messages-panel.tsx                  # Error/success messages
│   │
│   ├── storage/
│   │   ├── bucket-sidebar.tsx                  # Bucket list
│   │   ├── file-browser.tsx                    # File grid/list
│   │   ├── upload-zone.tsx                     # Drag & drop upload area
│   │   ├── file-preview.tsx                    # Image/file preview modal
│   │   └── create-bucket-modal.tsx             # New bucket form
│   │
│   ├── auth/
│   │   ├── user-table.tsx                      # Users data table
│   │   ├── create-user-modal.tsx               # Add user form
│   │   └── policy-card.tsx                     # RLS policy display card
│   │
│   ├── api-docs/
│   │   ├── endpoint-card.tsx                   # Single endpoint documentation
│   │   ├── code-snippet.tsx                    # Tabbed code examples
│   │   └── table-nav.tsx                       # Table navigation sidebar
│   │
│   └── shared/
│       ├── stat-card.tsx                       # Metric card for overview
│       ├── getting-started.tsx                 # Onboarding checklist
│       └── connect-info.tsx                    # API URL + key display
│
├── lib/
│   ├── mock-data.ts                            # ALL mock data in one file
│   ├── utils.ts                                # Helper functions (cn, formatDate, etc.)
│   └── constants.ts                            # Route constants, config values
│
├── public/
│   └── vorebase-logo.svg                       # Logo asset
│
├── next.config.js
├── postcss.config.mjs
├── package.json
└── tsconfig.json
```

---

## 9. Mock Data

All mock data lives in `apps/web/lib/mock-data.ts`:

```typescript
// ============ PROJECTS ============
export const mockProjects = [
  {
    id: 'proj_1',
    name: 'My SaaS App',
    dbName: 'my_saas_db',
    region: 'us-east-1',
    status: 'active',
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    id: 'proj_2',
    name: 'E-commerce Store',
    dbName: 'ecom_db',
    region: 'eu-west-1',
    status: 'active',
    createdAt: '2025-03-22T14:00:00Z',
  },
  {
    id: 'proj_3',
    name: 'Blog Platform',
    dbName: 'blog_db',
    region: 'ap-south-1',
    status: 'paused',
    createdAt: '2025-06-01T08:15:00Z',
  },
]

// ============ TABLES ============
export const mockTables = [
  {
    name: 'users',
    schema: 'public',
    rowCount: 1250,
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, default: 'gen_random_uuid()' },
      { name: 'email', type: 'varchar(255)', isPrimary: false, isNullable: false, default: null },
      { name: 'name', type: 'varchar(100)', isPrimary: false, isNullable: true, default: null },
      { name: 'avatar_url', type: 'text', isPrimary: false, isNullable: true, default: null },
      { name: 'is_active', type: 'boolean', isPrimary: false, isNullable: false, default: 'true' },
      { name: 'created_at', type: 'timestamp', isPrimary: false, isNullable: false, default: 'now()' },
    ],
    rows: [
      { id: 'a1b2c3d4', email: 'john@example.com', name: 'John Doe', avatar_url: null, is_active: true, created_at: '2025-01-15 10:30:00' },
      { id: 'e5f6g7h8', email: 'jane@example.com', name: 'Jane Smith', avatar_url: null, is_active: true, created_at: '2025-02-20 14:22:00' },
      { id: 'i9j0k1l2', email: 'bob@example.com', name: 'Bob Wilson', avatar_url: null, is_active: false, created_at: '2025-03-05 09:15:00' },
      // ... more rows
    ],
  },
  {
    name: 'posts',
    schema: 'public',
    rowCount: 3420,
    columns: [
      { name: 'id', type: 'int', isPrimary: true, isNullable: false, default: 'auto_increment' },
      { name: 'title', type: 'varchar(255)', isPrimary: false, isNullable: false, default: null },
      { name: 'content', type: 'text', isPrimary: false, isNullable: true, default: null },
      { name: 'user_id', type: 'uuid', isPrimary: false, isNullable: false, default: null, foreignKey: 'users.id' },
      { name: 'published', type: 'boolean', isPrimary: false, isNullable: false, default: 'false' },
      { name: 'created_at', type: 'timestamp', isPrimary: false, isNullable: false, default: 'now()' },
    ],
    rows: [
      { id: 1, title: 'Getting Started with Vorebase', content: 'Learn how to...', user_id: 'a1b2c3d4', published: true, created_at: '2025-01-20 11:00:00' },
      { id: 2, title: 'Building REST APIs', content: 'In this guide...', user_id: 'e5f6g7h8', published: true, created_at: '2025-02-25 16:30:00' },
      { id: 3, title: 'Draft Post', content: 'Work in progress...', user_id: 'a1b2c3d4', published: false, created_at: '2025-03-10 08:45:00' },
    ],
  },
  {
    name: 'comments',
    schema: 'public',
    rowCount: 8900,
    columns: [
      { name: 'id', type: 'int', isPrimary: true, isNullable: false, default: 'auto_increment' },
      { name: 'body', type: 'text', isPrimary: false, isNullable: false, default: null },
      { name: 'post_id', type: 'int', isPrimary: false, isNullable: false, default: null, foreignKey: 'posts.id' },
      { name: 'user_id', type: 'uuid', isPrimary: false, isNullable: false, default: null, foreignKey: 'users.id' },
      { name: 'created_at', type: 'timestamp', isPrimary: false, isNullable: false, default: 'now()' },
    ],
    rows: [
      { id: 1, body: 'Great article!', post_id: 1, user_id: 'e5f6g7h8', created_at: '2025-01-21 09:30:00' },
      { id: 2, body: 'Very helpful, thanks!', post_id: 1, user_id: 'i9j0k1l2', created_at: '2025-01-22 14:15:00' },
      { id: 3, body: 'Interesting approach', post_id: 2, user_id: 'a1b2c3d4', created_at: '2025-02-26 10:00:00' },
    ],
  },
]

// ============ AUTH USERS ============
export const mockAuthUsers = [
  { id: 'a1b2c3d4', email: 'john@example.com', provider: 'email', role: 'authenticated', createdAt: '2025-01-15T10:30:00Z', lastSignIn: '2025-06-20T08:00:00Z' },
  { id: 'e5f6g7h8', email: 'jane@example.com', provider: 'google', role: 'authenticated', createdAt: '2025-02-20T14:22:00Z', lastSignIn: '2025-06-19T16:30:00Z' },
  { id: 'i9j0k1l2', email: 'bob@example.com', provider: 'github', role: 'authenticated', createdAt: '2025-03-05T09:15:00Z', lastSignIn: '2025-06-15T11:45:00Z' },
  { id: 'm3n4o5p6', email: 'alice@example.com', provider: 'email', role: 'authenticated', createdAt: '2025-04-10T12:00:00Z', lastSignIn: null },
]

// ============ STORAGE ============
export const mockBuckets = [
  { id: 'bkt_1', name: 'avatars', isPublic: true, fileCount: 45, size: '12.4 MB', createdAt: '2025-01-15T10:30:00Z' },
  { id: 'bkt_2', name: 'documents', isPublic: false, fileCount: 23, size: '156.2 MB', createdAt: '2025-02-01T09:00:00Z' },
  { id: 'bkt_3', name: 'public-assets', isPublic: true, fileCount: 89, size: '45.7 MB', createdAt: '2025-03-15T14:30:00Z' },
]

export const mockFiles = [
  { name: 'profile_john.jpg', type: 'image/jpeg', size: 245000, lastModified: '2025-06-15T10:00:00Z' },
  { name: 'profile_jane.png', type: 'image/png', size: 512000, lastModified: '2025-06-16T14:30:00Z' },
  { name: 'thumbnails/', type: 'folder', size: null, lastModified: '2025-06-10T08:00:00Z' },
  { name: 'resume_bob.pdf', type: 'application/pdf', size: 1200000, lastModified: '2025-06-18T16:45:00Z' },
]

// ============ RLS POLICIES ============
export const mockPolicies = [
  { id: 'pol_1', name: 'Users can view own data', tableName: 'users', operation: 'SELECT', roles: ['authenticated'], expression: 'auth.uid() = id', isEnabled: true },
  { id: 'pol_2', name: 'Users can update own data', tableName: 'users', operation: 'UPDATE', roles: ['authenticated'], expression: 'auth.uid() = id', isEnabled: true },
  { id: 'pol_3', name: 'Anyone can read published posts', tableName: 'posts', operation: 'SELECT', roles: ['anon', 'authenticated'], expression: 'published = true', isEnabled: true },
  { id: 'pol_4', name: 'Authors can manage own posts', tableName: 'posts', operation: 'ALL', roles: ['authenticated'], expression: 'auth.uid() = user_id', isEnabled: false },
]

// ============ API KEYS ============
export const mockApiKeys = {
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTcxOTEwMDAwMH0.mock_anon_key_signature',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzE5MTAwMDAwfQ.mock_service_role_signature',
  projectUrl: 'http://localhost:4000',
  jwtSecret: 'super-secret-jwt-key-change-in-production-please',
}

// ============ LOGS ============
export const mockLogs = [
  { id: '1', timestamp: '2025-06-20T08:00:12Z', level: 'info', service: 'auth', message: 'User john@example.com signed in successfully' },
  { id: '2', timestamp: '2025-06-20T08:01:30Z', level: 'info', service: 'rest', message: 'GET /rest/v1/posts - 200 OK (12ms)' },
  { id: '3', timestamp: '2025-06-20T08:02:45Z', level: 'warn', service: 'storage', message: 'File upload rate limit approaching for bucket: avatars' },
  { id: '4', timestamp: '2025-06-20T08:05:00Z', level: 'error', service: 'rest', message: 'RLS policy violation: user e5f6g7h8 attempted to access restricted row in users table' },
  { id: '5', timestamp: '2025-06-20T08:10:22Z', level: 'info', service: 'realtime', message: 'New WebSocket connection from client 192.168.1.105' },
]
```

---

## 10. Implementation Phases

### Phase A: Foundation ⏱️ Day 1-2

| # | Task | Output |
|:--|:--|:--|
| A1 | Set up design system in `globals.css` — CSS variables, dark theme, typography (Inter + JetBrains Mono) | Design tokens ready |
| A2 | Install new deps: `lucide-react`, CodeMirror packages | Dependencies installed |
| A3 | Create `lib/mock-data.ts` with all mock data | Mock data ready |
| A4 | Create `lib/utils.ts` — helper functions (formatDate, formatBytes, cn, copyToClipboard) | Utils ready |
| A5 | Build shared components: `Button`, `Input`, `Badge`, `Toast`, `CopyButton`, `Toggle` | Core UI kit |

### Phase B: Auth + Projects ⏱️ Day 2-3

| # | Task | Output |
|:--|:--|:--|
| B1 | Build `AuthLayout` component | Auth pages layout |
| B2 | Build Login page (`/login`) | Working login |
| B3 | Build Register page (`/register`) | Working register |
| B4 | Build `ProjectsLayout` (top navbar, no sidebar) | Projects layout |
| B5 | Build Projects list page (`/projects`) | Project cards |
| B6 | Build New Project page (`/projects/new`) | Project form |

### Phase C: Dashboard Shell ⏱️ Day 3-4

| # | Task | Output |
|:--|:--|:--|
| C1 | Build `Sidebar` component with all nav items + icons | Sidebar navigation |
| C2 | Build `Header` component with breadcrumbs + project name | Top header |
| C3 | Build `DashboardLayout` combining sidebar + header | Dashboard shell |
| C4 | Build Project Home page (`/project/[id]`) with stat cards + getting started | Overview page |
| C5 | Build `Modal`, `Dropdown`, `Tabs`, `EmptyState` components | More UI kit |

### Phase D: Table Editor (flagship) ⏱️ Day 4-6

| # | Task | Output |
|:--|:--|:--|
| D1 | Build `DataTable` component (sortable, selectable, paginated) | Core data grid |
| D2 | Build `TableSidebar` — table list panel | Table navigation |
| D3 | Build Table Editor page layout (sidebar + toolbar + grid) | Editor structure |
| D4 | Wire up mock data — load tables, display rows | Working table view |
| D5 | Add inline cell editing (click to edit, Enter to save) | Editable cells |
| D6 | Build "Create Table" modal with column builder | New table flow |
| D7 | Build "Insert Row" side panel | Row insertion |
| D8 | Build filter and sort dropdowns | Filtering + sorting |

### Phase E: SQL Editor ⏱️ Day 6-7

| # | Task | Output |
|:--|:--|:--|
| E1 | Integrate CodeMirror 6 with SQL language + dark theme | Code editor |
| E2 | Build SQL Editor page with resizable split (editor + results) | Editor layout |
| E3 | Build query tabs (multiple queries) | Tab management |
| E4 | Build results table + messages panel | Result display |
| E5 | Add Run button + Ctrl+Enter shortcut | Query execution |
| E6 | Mock query execution (hardcoded results for known queries) | Working demo |

### Phase F: Auth, Storage, API ⏱️ Day 7-9

| # | Task | Output |
|:--|:--|:--|
| F1 | Build Auth Users page with user table + add user modal | User management |
| F2 | Build Auth Policies page with policy cards + create policy modal | RLS management |
| F3 | Build Storage Bucket sidebar | Bucket navigation |
| F4 | Build Storage File Browser (list + grid view) | File browsing |
| F5 | Build Upload zone (drag & drop UI) | Upload interface |
| F6 | Build file preview modal (images) | Image preview |
| F7 | Build API Docs page with endpoint cards + code snippets | API documentation |

### Phase G: Remaining Pages ⏱️ Day 9-10

| # | Task | Output |
|:--|:--|:--|
| G1 | Build Database Tables (schema viewer) page | Schema browser |
| G2 | Build Logs page with filters | Log viewer |
| G3 | Build Settings — General | Settings form |
| G4 | Build Settings — API (keys display + copy) | Key management |
| G5 | Build Settings — Danger Zone (delete project confirmation) | Danger actions |
| G6 | Final polish: responsive tweaks, loading states, empty states | Polished UI |

---

## 11. Checklist

- [ ] **Phase A:** Foundation (design system, mock data, core UI components)
- [ ] **Phase B:** Auth pages + Projects pages
- [ ] **Phase C:** Dashboard shell (sidebar, header, layout, project home)
- [ ] **Phase D:** Table Editor (the big one)
- [ ] **Phase E:** SQL Editor
- [ ] **Phase F:** Auth Users, Storage Browser, API Docs
- [ ] **Phase G:** Database, Logs, Settings pages + polish

**Estimated total: ~10 working days**

---

> When all pages are built, swapping mock data for real API calls is straightforward — just replace imports from `mock-data.ts` with `fetch()` calls to the backend services.
