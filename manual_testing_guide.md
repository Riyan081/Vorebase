# Vorebase — Manual Testing Guide

> **Step-by-step walkthrough to test every feature of Vorebase end-to-end.**
> Run the project, create a new project, use it like Supabase, and verify everything works.

---

## Prerequisites

Before starting, make sure you have:

| Requirement | Check |
|---|---|
| **Node.js** ≥ 18 | `node -v` |
| **pnpm** installed | `pnpm -v` |
| **MySQL** running locally | Port 3306, root password set |
| **MinIO** running locally | Ports 9000 (API) + 9001 (Console) |
| **`.env` files** configured | In each service's `apps/` folder |

---

## Phase 0: Start the Project

```bash
# From project root (c:\Users\riyan\Downloads\bms)
pnpm install
pnpm dev
```

This starts **all services** via Turborepo:

| Service | Port | URL |
|---|---|---|
| Dashboard (Next.js) | `3000` | http://localhost:3000 |
| Auth Service | `4001` | http://localhost:4001 |
| REST Service | `4002` | http://localhost:4002 |
| Storage Service | `4003` | http://localhost:4003 |
| WebSocket Service | `4004` | http://localhost:4004 |

> [!TIP]
> The dashboard proxies all API calls through Next.js rewrites, so you only need to open http://localhost:3000

**✅ Checkpoint:** All 5 services should show "listening on port XXXX" in the terminal.

---

## Phase 1: Admin Signup & Login

### 1.1 — Sign Up as Admin

1. Open http://localhost:3000
2. You should be redirected to the **Login** page
3. Click **"Sign up"** (or navigate to `/signup`)
4. Enter:
   - Email: `admin@test.com`
   - Password: `Test1234!` (min 8 chars)
5. Click **Sign Up**

**✅ Checkpoint:** You should be redirected to the **Projects** page (empty state: "No projects yet").

### 1.2 — Log Out & Log In

1. Click the **Logout** button (top-right or sidebar)
2. You should be back on the login page
3. Log in with `admin@test.com` / `Test1234!`

**✅ Checkpoint:** You should land back on the Projects page with your session restored.

### 1.3 — Token Refresh (Verify Silently)

- The access token expires in **15 minutes**
- The frontend automatically refreshes it using the refresh token
- You can verify this by opening **DevTools → Network** and watching for a `POST /auth/v1/admin/token/refresh` call after 15 minutes

---

## Phase 2: Create a Project

### 2.1 — Create New Project

1. Click **"New Project"** or the **+ card**
2. Enter:
   - Project Name: `My Test App`
   - Description: `Testing all Vorebase features` (optional)
3. Click **Create Project**

**✅ Checkpoint:**
- You should be redirected to the project dashboard
- A new MySQL database like `vb_my_test_app_xxxx` was created automatically
- The sidebar should show: Table Editor, SQL Editor, Auth, Storage, Settings

### 2.2 — Verify Project on Dashboard

1. Go back to **Projects** page (click Vorebase logo or /projects)
2. Your project card should show:
   - Project name: `My Test App`
   - Database name: `vb_my_test_app_xxxx`
   - 0 Users, 0 Buckets, 0 Policies

---

## Phase 3: Table Editor

### 3.1 — Create a Table

1. Navigate into your project → **Table Editor** tab
2. Click the **+ button** in the sidebar (or "Create Table" if empty)
3. Enter table name: `todos`
4. Click **Create Table**

**✅ Checkpoint:**
- `todos` appears in the sidebar
- Table has default columns: `id` (INT, PK, auto-increment) and `created_at` (TIMESTAMP)
- Shows "0 rows" and "No rows found"

### 3.2 — Insert a Row

1. Click **"Insert Row"** button in toolbar
2. The modal opens with editable fields (NOT `id` since it's auto-increment)
3. Leave `created_at` blank (defaults to NOW)
4. Click **Insert Row**

**✅ Checkpoint:** Table refreshes and shows 1 row with auto-generated `id=1` and a timestamp.

### 3.3 — Create a Better Table (via SQL)

1. Go to **SQL Editor** tab
2. Paste and run:
   ```sql
   ALTER TABLE todos ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT '';
   ALTER TABLE todos ADD COLUMN completed BOOLEAN NOT NULL DEFAULT false;
   ALTER TABLE todos ADD COLUMN user_id VARCHAR(36);
   ```
3. Go back to **Table Editor** — select `todos`
4. The new columns should appear in the grid

### 3.4 — Insert Rows with Data

1. Click **Insert Row**
2. Fill in:
   - `title`: `Buy groceries`
   - `completed`: `false`
   - `user_id`: leave blank (NULL)
3. Insert a second row:
   - `title`: `Write tests`
   - `completed`: `true`

**✅ Checkpoint:** 3 rows visible. Boolean columns show styled badges (`true` = green, `false` = gray).

### 3.5 — Inline Edit (Double-Click)

1. **Double-click** on the `title` cell of the first row
2. An input field appears — change the text to `Buy organic groceries`
3. Press **Enter** or click away
4. The row is highlighted in yellow with pending changes
5. Click the **✓ (checkmark)** button to save
6. The row refreshes

**✅ Checkpoint:** The change persists after refresh. Click the ✗ to discard changes instead.

### 3.6 — Delete a Row

1. Hover over a row — the **🗑 Delete** button appears
2. Click it
3. Confirm the dialog

**✅ Checkpoint:** Row disappears. Row count updates.

### 3.7 — Filter & Sort

1. Click the **Filter** dropdown
2. Set: Column = `completed`, Operator = `eq`, Value = `true`
3. Click **Apply** — only completed rows show

4. Click the **Sort** dropdown
5. Set: Column = `title`, Direction = `asc`
6. Click **Apply** — rows reorder alphabetically

7. Click **Refresh ↻** — clears all filters and shows all rows

**✅ Checkpoint:** Filtering and sorting work. The row count in the footer updates correctly.

---

## Phase 4: SQL Editor

### 4.1 — Run a SELECT Query

1. Navigate to **SQL Editor** tab
2. Type: `SELECT * FROM todos;`
3. Click **▶ Run** (or press `Ctrl+Enter`)

**✅ Checkpoint:**
- Results table shows all rows
- Footer shows "Query returned X row(s) in Yms"
- Green success message appears

### 4.2 — Run a Mutation

1. Type: `INSERT INTO todos (title, completed) VALUES ('Clean house', false);`
2. Run it

**✅ Checkpoint:** Results show `affected_rows: 1`, `insert_id: X`

### 4.3 — Run DDL

1. Type: `SHOW TABLES;`
2. Run it

**✅ Checkpoint:** Returns a list of all tables in the project's database (including `todos`).

### 4.4 — Test Error Handling

1. Type: `SELECT * FROM nonexistent_table;`
2. Run it

**✅ Checkpoint:** Red error message with MySQL error details (table doesn't exist).

### 4.5 — Query History

1. The right sidebar shows all previously-run queries
2. Click on any history item to restore the SQL
3. Close the history sidebar with the **X** button

---

## Phase 5: Authentication — End Users

### 5.1 — Get API Keys

1. Go to **Settings → API** tab
2. You should see existing keys (generated during project creation):
   - `anon` key — for public client use
   - `service_role` key — for server-side use
3. Copy the `anon` key — you'll need it

**✅ Checkpoint:** Both keys are visible, with copy buttons that work.

### 5.2 — Simulate a User Signup (API call)

Open a **new terminal** and run:

```powershell
$projectId = "<YOUR_PROJECT_ID>"  # from the URL: /project/<this-id>
$anonKey   = "<YOUR_ANON_KEY>"    # from Settings → API

$body = @{
  email    = "user1@test.com"
  password = "UserPass123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4001/auth/v1/signup" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ "apikey" = $anonKey; "x-project-id" = $projectId } `
  -Body $body
```

**✅ Checkpoint:** Returns `access_token`, `refresh_token`, `user` object with role `authenticated`.

### 5.3 — Check User in Dashboard

1. Go back to the dashboard → **Auth → Users** tab
2. You should see `user1@test.com` listed with:
   - Role: `authenticated`
   - Last Sign In: a timestamp
   - Created: just now

### 5.4 — Admin Creates a User

1. Click **"Add User"** button
2. Fill in:
   - Email: `admin-created@test.com`
   - Password: `AdminCreated123!`
   - Role: `authenticated`
3. Click **Create**

**✅ Checkpoint:** User appears in the list. Count updates.

### 5.5 — Delete a User

1. Hover over `admin-created@test.com`
2. Click the **🗑 Delete** button
3. Confirm

**✅ Checkpoint:** User removed. Count decrements.

---

## Phase 6: Storage

### 6.1 — Create a Bucket

1. Navigate to **Storage** tab
2. Click **"New Bucket"**
3. Enter name: `avatars`
4. Toggle public/private as desired
5. Click **Create**

**✅ Checkpoint:** `avatars` appears in the sidebar.

### 6.2 — Upload a File

1. Select the `avatars` bucket
2. Click **"Upload"** button
3. Select any image file (JPG, PNG, etc.)
4. Wait for upload to complete

**✅ Checkpoint:** File appears in the file list with name, size, and type.

### 6.3 — Preview & Download

1. Click the **👁 Preview** button on the uploaded file
2. A preview modal opens (shows image if it's an image)
3. Close the preview
4. Click the **⬇ Download** button

**✅ Checkpoint:** File downloads to your computer.

### 6.4 — Delete a File

1. Click the **🗑 Delete** button on the file
2. Confirm

**✅ Checkpoint:** File removed from the list.

---

## Phase 7: RLS Policies

### 7.1 — Create a Policy

1. Navigate to **Auth → Policies** tab
2. Click **"New Policy"**
3. Fill in:
   - Policy Name: `own_todos`
   - Table Name: `todos`
   - Operation: `SELECT`
   - Check Rule: column=`user_id`, op=`=`, value=`auth.uid()`
   - Roles: `authenticated`
4. Click **Create Policy**

**✅ Checkpoint:** Policy appears grouped under the `todos` table. Shows operation badge (blue for SELECT).

### 7.2 — Toggle a Policy

1. Click the **toggle switch** on the policy
2. It should turn off (gray)
3. Click again — turns on (green/accent)

**✅ Checkpoint:** Toggle state persists on refresh.

### 7.3 — Delete a Policy

1. Hover over the policy
2. Click **🗑 Delete**
3. Confirm

**✅ Checkpoint:** Policy removed. Table group disappears if it was the last policy.

---

## Phase 8: Settings

### 8.1 — General Settings

1. Go to **Settings → General**
2. Change Project Name to `My Renamed App`
3. Click **Save Changes**
4. Refresh the page

**✅ Checkpoint:** Project name updated everywhere (header, sidebar, settings form).

### 8.2 — API Keys — Generate New

1. Go to **Settings → API**
2. Click **"Generate Key"** button
3. Hover/click to see dropdown — choose `anon` or `service_role`
4. New key appears in the list

**✅ Checkpoint:** Key is shown with a copy button. The key prefix matches: `vb_anon_` or `vb_service_`.

### 8.3 — Danger Zone

1. Go to **Settings → Danger**
2. Click **"Pause"** — confirm — shows info toast (UI-only for now)
3. Click **"Delete"** — confirm

**✅ Checkpoint:** Project is deleted. You are redirected to the Projects page. The project no longer appears.

> [!CAUTION]
> Delete is **real and irreversible** — it drops the MySQL database and all data.

---

## Phase 9: Test as "Supabase" — Full Client SDK Flow

This simulates what a developer's app would do when using Vorebase as their backend.

### 9.1 — Setup

Create a new project (Phase 2), then create a `posts` table via SQL Editor:

```sql
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9.2 — Client Signup & Get Token

```powershell
$projectId = "<PROJECT_ID>"
$anonKey   = "<ANON_KEY>"

# Signup
$signup = Invoke-RestMethod -Uri "http://localhost:4001/auth/v1/signup" `
  -Method POST -ContentType "application/json" `
  -Headers @{ "apikey" = $anonKey; "x-project-id" = $projectId } `
  -Body '{"email":"dev@myapp.com","password":"MyPass123!"}'

$token = $signup.access_token
$userId = $signup.user.id
Write-Host "Token: $token"
Write-Host "User ID: $userId"
```

### 9.3 — Insert Data (as authenticated user)

```powershell
Invoke-RestMethod -Uri "http://localhost:4002/rest/v1/posts" `
  -Method POST -ContentType "application/json" `
  -Headers @{
    "Authorization" = "Bearer $token"
    "apikey"        = $anonKey
    "x-project-id"  = $projectId
  } `
  -Body "{`"title`":`"My First Post`",`"body`":`"Hello from the client!`",`"user_id`":`"$userId`"}"
```

**✅ Checkpoint:** Returns `201` with `affected_rows: 1`.

### 9.4 — Read Data

```powershell
Invoke-RestMethod -Uri "http://localhost:4002/rest/v1/posts" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $token"
    "apikey"        = $anonKey
    "x-project-id"  = $projectId
  }
```

**✅ Checkpoint:** Returns your post in `data` array.

### 9.5 — Update Data

```powershell
Invoke-RestMethod -Uri "http://localhost:4002/rest/v1/posts?id=eq.1" `
  -Method PATCH -ContentType "application/json" `
  -Headers @{
    "Authorization" = "Bearer $token"
    "apikey"        = $anonKey
    "x-project-id"  = $projectId
  } `
  -Body '{"title":"Updated Title"}'
```

**✅ Checkpoint:** Returns `affected_rows: 1`.

### 9.6 — Delete Data

```powershell
Invoke-RestMethod -Uri "http://localhost:4002/rest/v1/posts?id=eq.1" `
  -Method DELETE `
  -Headers @{
    "Authorization" = "Bearer $token"
    "apikey"        = $anonKey
    "x-project-id"  = $projectId
  }
```

**✅ Checkpoint:** Returns `affected_rows: 1`. Row is gone.

### 9.7 — Storage (Client-Side)

```powershell
# Create a bucket
Invoke-RestMethod -Uri "http://localhost:4003/storage/v1/bucket" `
  -Method POST -ContentType "application/json" `
  -Headers @{
    "Authorization" = "Bearer $token"
    "apikey"        = $anonKey
    "x-project-id"  = $projectId
  } `
  -Body '{"name":"user-uploads","public":false}'
```

For file upload, use **Postman** or **curl**:
```bash
curl -X POST http://localhost:4003/storage/v1/object/user-uploads/myfile.txt \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "x-project-id: $PROJECT_ID" \
  -F "file=@./myfile.txt"
```

---

## Phase 10: Verify Data in Dashboard

After doing all the API calls above:

1. Go to **Table Editor** — your `posts` table should show the data you inserted
2. Go to **Auth → Users** — `dev@myapp.com` should appear with `lastSignInAt` set
3. Go to **Storage** — `user-uploads` bucket should be visible

---

## Quick Checklist

Use this as a quick pass/fail checklist:

| # | Test | Pass? |
|---|---|---|
| 1 | Admin signup | ☐ |
| 2 | Admin login | ☐ |
| 3 | Create project | ☐ |
| 4 | Create table | ☐ |
| 5 | Insert row (UI) | ☐ |
| 6 | Edit row (double-click) | ☐ |
| 7 | Delete row | ☐ |
| 8 | Filter & sort | ☐ |
| 9 | SQL SELECT | ☐ |
| 10 | SQL INSERT/UPDATE/DELETE | ☐ |
| 11 | SQL DDL (CREATE/ALTER) | ☐ |
| 12 | SQL error handling | ☐ |
| 13 | Query history | ☐ |
| 14 | View API keys | ☐ |
| 15 | Generate new key | ☐ |
| 16 | User signup (API) | ☐ |
| 17 | User appears in dashboard | ☐ |
| 18 | Admin creates user | ☐ |
| 19 | Delete user | ☐ |
| 20 | Create bucket | ☐ |
| 21 | Upload file | ☐ |
| 22 | Download file | ☐ |
| 23 | Delete file | ☐ |
| 24 | Create RLS policy | ☐ |
| 25 | Toggle policy | ☐ |
| 26 | Delete policy | ☐ |
| 27 | Update project name | ☐ |
| 28 | Delete project | ☐ |
| 29 | Client CRUD via API | ☐ |
| 30 | Client storage via API | ☐ |

---

> [!NOTE]
> **Logs tab** is currently a placeholder — log streaming is not yet implemented on the backend. All other features are fully functional.
