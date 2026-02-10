# E2E Regression Test Plan — Business Hub

> This document describes every test step for comprehensive regression testing.
> Use this as the source of truth when implementing Playwright tests.

## Prerequisites

```bash
# 1. Start PostgreSQL via Docker
docker compose up -d db

# 2. Wait for DB to be healthy
docker compose exec db pg_isready -U postgres

# 3. Start backend server
DATABASE_URL="postgresql://postgres:postgres_password@localhost:5432/business_hub?schema=public" \
TARGET_EMAIL="test@example.com" node server/index.js

# 4. Start frontend dev server
npx vite --port 5173
```

---

## Test Suite 1: API Health & Connectivity

### Test 1.1: Health Check
```
GET /api/health
Expected: 200 { status: 'ok', database: 'prisma/postgresql', timestamp: <ISO> }
```

### Test 1.2: CORS Headers
```
OPTIONS /api/health (Origin: http://localhost:5173)
Expected: Access-Control-Allow-Origin header present
```

---

## Test Suite 2: Authentication

### Test 2.1: Register New User
```
POST /api/auth/register
Body: { email: "e2e-user@test.com", password: "test123", name: "E2E User" }
Expected: 200 { success: true, user: { id, email, name, settings: { config: { theme, notifications } } } }
Save: USER_ID = response.user.id
```

### Test 2.2: Login
```
POST /api/auth/login
Body: { email: "e2e-user@test.com", password: "test123" }
Expected: 200 { success: true, user: { id, email, name, settings } }
```

### Test 2.3: Duplicate Registration
```
POST /api/auth/register
Body: { email: "e2e-user@test.com", password: "test123", name: "Dup" }
Expected: 400 or 409 error
```

---

## Test Suite 3: Leads CRUD

### Test 3.1: List Leads (Empty)
```
GET /api/leads
Headers: { x-user-id: USER_ID }
Expected: 200 [] (empty array)
```

### Test 3.2: Create Lead
```
POST /api/leads
Headers: { x-user-id: USER_ID, Content-Type: application/json }
Body: { name: "Test Corp", email: "info@testcorp.com", status: "new", company: "Test Corp Inc" }
Expected: 200 { id, name, email, status, company, userId: USER_ID }
Save: LEAD_ID = response.id
```

### Test 3.3: Get Lead by ID
```
GET /api/leads/:LEAD_ID
Headers: { x-user-id: USER_ID }
Expected: 200 { id: LEAD_ID, name: "Test Corp", ... }
```

### Test 3.4: Update Lead
```
PUT /api/leads/:LEAD_ID
Headers: { x-user-id: USER_ID, Content-Type: application/json }
Body: { status: "contacted" }
Expected: 200 { id: LEAD_ID, status: "contacted" }
```

### Test 3.5: Delete Lead
```
DELETE /api/leads/:LEAD_ID
Headers: { x-user-id: USER_ID }
Expected: 200
```

---

## Test Suite 4: Jobs CRUD

### Test 4.1: List Jobs (Empty)
```
GET /api/jobs
Headers: { x-user-id: USER_ID }
Expected: 200 []
```

### Test 4.2: Create Job
```
POST /api/jobs
Headers: { x-user-id: USER_ID, Content-Type: application/json }
Body: { title: "Senior Dev", company: "Acme", status: "saved", url: "https://example.com/job" }
Expected: 200 { id, title, company, status }
Save: JOB_ID = response.id
```

### Test 4.3: Update Job
```
PUT /api/jobs/:JOB_ID
Headers: { x-user-id: USER_ID, Content-Type: application/json }
Body: { status: "applied" }
Expected: 200 { id: JOB_ID, status: "applied" }
```

---

## Test Suite 5: Task Boards

### Test 5.1: List Boards (Empty)
```
GET /api/resources/taskboards
Headers: { x-user-id: USER_ID }
Expected: 200 []
```

### Test 5.2: Create Board
```
POST /api/resources/taskboards
Headers: { x-user-id: USER_ID, Content-Type: application/json }
Body: { name: "Sprint Board" }
Expected: 200 { id, name: "Sprint Board", userId: USER_ID }
Save: BOARD_ID = response.id
```

### Test 5.3: Get Board by ID
```
GET /api/resources/taskboards/:BOARD_ID
Headers: { x-user-id: USER_ID }
Expected: 200 { id: BOARD_ID, name, tasks: [] }
```

---

## Test Suite 6: Templates

### Test 6.1: List Templates (Empty)
```
GET /api/resources/templates
Headers: { x-user-id: USER_ID }
Expected: 200 []
```

### Test 6.2: Create Template
```
POST /api/resources/templates
Headers: { x-user-id: USER_ID, Content-Type: application/json }
Body: { name: "Cold Email", type: "email", subject: "Hi {{name}}", body: "I'd love to connect..." }
Expected: 200 { id, name, type, subject, body }
Save: TEMPLATE_ID = response.id
```

---

## Test Suite 7: Outreach & Automation

### Test 7.1: Get Uncontacted Leads
```
GET /api/outreach/uncontacted
Headers: { x-user-id: USER_ID }
Expected: 200 { success: true, count: <N>, leads: [...] }
```

### Test 7.2: Get Outreach History (Empty)
```
GET /api/outreach/history
Headers: { x-user-id: USER_ID }
Expected: 200 { success: true, stats: { sentToday: 0, sentThisWeek: 0, totalSent: 0 }, messages: [] }
```

### Test 7.3: Scraper Search (requires internet)
```
POST /api/scraper/search
Headers: { x-user-id: USER_ID, Content-Type: application/json }
Body: { query: "web design agency Toronto", enrich: false }
Expected: 200 { success: true, leads: [...] }
Note: Results depend on external Google scraping — may need to mock
```

---

## Test Suite 8: CV File Management

### Test 8.1: List CVs (Empty)
```
GET /api/cvs
Headers: { x-user-id: USER_ID }
Expected: 200 []
```

---

## Test Suite 9: Email Settings

### Test 9.1: Get Email Settings
```
GET /api/resources/emailsettings
Headers: { x-user-id: USER_ID }
Expected: 200 (null or settings object)
```

### Test 9.2: Get Email Templates
```
GET /api/resources/emailtemplates
Headers: { x-user-id: USER_ID }
Expected: 200 []
```

---

## Test Suite 10: Skill Mastery

### Test 10.1: Get Dashboard
```
GET /api/skillmastery/dashboard
Headers: { x-user-id: USER_ID }
Expected: 200 { skills: [], totalMastered: 0, ... }
```

---

## Test Suite 11: Browser UI Tests

### Full Regression Recording

![Full browser regression test recording](assets/full-regression-test.webp)

### Test 11.1: Login Page Renders

![Login Page](assets/login-page.png)

```
Navigate: http://localhost:5173
Assert: Email input visible, Password input visible, "Sign In" button visible
Assert: "Create one" registration link visible
```

### Test 11.2: Registration Flow

![Dashboard after registration](assets/dashboard-home.png)

```
1. Click "Create one" link
2. Fill: Name = "E2E User", Email = "e2e@test.com", Password = "test123", Confirm = "test123"
3. Click "Create Account"
4. Assert: Redirected to dashboard (Calendar view)
5. Assert: User name "E2E User" in top-right header
```

### Test 11.3: Sidebar Navigation

| Page | Screenshot |
|---|---|
| Leads | ![Leads](assets/leads-page.png) |
| Jobs | ![Jobs](assets/jobs-page.png) |
| Task Boards | ![Task Boards](assets/taskboards-page.png) |
| Templates | ![Templates](assets/templates-page.png) |
| Automation | ![Automation Hub](assets/automation-hub.png) |

```
For each sidebar item:
  Calendar       → Assert: Calendar view renders
  Content Studio → Assert: Content page renders
  Leads          → Assert: "Lead Board" header, columns (New, Contacted, Replied, Meeting, Won)
  Task Boards    → Assert: Board list or "No boards yet"
  Jobs           → Assert: "Jobs Board" header, columns (Saved, Applied, Interview)
  Templates      → Assert: Template categories (LinkedIn, Email)
  Skill Mastery  → Assert: Dashboard renders
  AI Calling     → Assert: AI calling view renders
  Automation     → Assert: "Automation Hub" header, 3 tabs
```

### Test 11.4: Leads Page — Automation Widget

![Automation Widget on Leads Page](assets/automation-widget.png)

```
1. Navigate to Leads page
2. Assert: Bottom-right shows Automation widget with stats (Uncontacted, Sent Today, All Time)
3. Assert: "Find Leads" and "Campaign" buttons visible
4. Click "Open Hub →"
5. Assert: Navigates to Automation page
```

### Test 11.5: Automation Hub — Tabs
```
1. Navigate to /automation
2. Assert: "Lead Scraper" tab is active by default
3. Assert: Search input with placeholder text visible
4. Assert: "Enrich with contact info" checkbox visible
5. Click "Auto-Outreach" tab
6. Assert: Auto-Outreach panel renders
7. Click "History" tab
8. Assert: History panel renders
```

### Test 11.6: Lead CRUD via UI
```
1. Navigate to Leads
2. Click "+ Add Lead"
3. Fill form: Name, Email, Company
4. Submit
5. Assert: New lead card appears in "New" column
6. Click lead card
7. Assert: Lead detail panel opens
8. Close panel
```

### Test 11.7: Job CRUD via UI
```
1. Navigate to Jobs
2. Click "+ Add Job"
3. Fill form: Title, Company, URL
4. Submit
5. Assert: New job card appears in "Saved" column
```

### Test 11.8: Theme Toggle
```
1. Click settings icon (⚙️) in top-right
2. Assert: Settings panel opens
3. Toggle dark mode
4. Assert: Background color changes to dark theme
```

---

## Test Suite 12: Cleanup

### Test 12.1: Delete Test Data
```
DELETE all created resources (leads, jobs, boards, templates)
DELETE test user (if supported)
```

---

## Environment Variables for Tests

```env
BASE_URL=http://localhost:5173
API_URL=http://localhost:3002
DB_URL=postgresql://postgres:postgres_password@localhost:5432/business_hub?schema=public
TEST_USER_EMAIL=e2e-user@test.com
TEST_USER_PASSWORD=test123
```

## Run Order

Tests should run in the order listed above, as later suites may depend on data created in earlier ones (e.g., USER_ID from auth tests is used in all subsequent suites).
