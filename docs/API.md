# API Reference

## JSON Server (Port 3005)

Base URL: `http://localhost:3005`

JSON Server provides a full REST API from `db.json`. All endpoints support GET, POST, PUT, PATCH, DELETE.

### Endpoints

| Endpoint            | Description                 |
|---------------------|-----------------------------|
| `/contents`         | Video content items         |
| `/templates`        | Template documents          |
| `/templateFolders`  | Template folder hierarchy   |
| `/templateHistory`  | Template version history    |
| `/templateComments` | Template comments/reactions |
| `/jobs`             | Job applications            |
| `/leads`            | Business leads              |
| `/taskBoards`       | Task board definitions      |
| `/tasks`            | Individual tasks            |
| `/users`            | User accounts (auth)        |
| `/skills`           | Skill mastery data          |
| `/quizzes`          | Skill quizzes               |
| `/cvs`              | CV/resume data              |

### Query Parameters

JSON Server supports filtering, sorting, pagination, and full-text search:

```
GET /contents?status=published           # Filter
GET /contents?_sort=createdAt&_order=desc # Sort
GET /contents?_page=1&_limit=10          # Paginate
GET /contents?q=react                    # Full-text search
```

### Example Requests

```bash
# Get all contents
curl http://localhost:3005/contents

# Create a new content
curl -X POST http://localhost:3005/contents \
  -H "Content-Type: application/json" \
  -d '{"title":"New Video","status":"idea","type":"long"}'

# Update a content
curl -X PATCH http://localhost:3005/contents/pub-1 \
  -H "Content-Type: application/json" \
  -d '{"status":"editing"}'

# Delete a content
curl -X DELETE http://localhost:3005/contents/pub-1
```

---

## Express API Server (Port 3002)

Base URL: `http://localhost:3002`

Handles operations that require server-side processing.

### Endpoints

| Method | Endpoint       | Description          |
|--------|----------------|----------------------|
| GET    | `/api/health`  | Health check         |
| POST   | `/api/email`   | Send email           |
| POST   | `/api/messages`| Send message         |
| POST   | `/api/upload`  | File upload          |
| GET    | `/api/read`    | Read markdown files  |

---

## Authentication

Authentication is handled client-side via the `AuthContext`:

1. **Login**: Checks email/password against `GET /users?email=<email>` from JSON Server
2. **Register**: Creates user via `POST /users`
3. **Token**: Base64-encoded user data stored in `localStorage`

> **Note**: Authentication now uses `x-user-id` header verified against PostgreSQL.

---

## New Endpoints (2026-02-17 Release)

### Dashboard Trends

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/trends` | 7-day trend data for sparklines |

**Response:**
```json
{
  "leads": [3, 5, 2, 8, 4, 6, 7],
  "calls": [1, 2, 0, 3, 1, 4, 2],
  "conversions": [0, 1, 0, 2, 1, 1, 3]
}
```

### Bulk Email

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/send-bulk` | Send emails to multiple leads |

**Request Body:**
```json
{
  "leadIds": ["lead-1", "lead-2"],
  "templateId": "template-1",
  "subject": "Follow up on {{company}}",
  "body": "Hi {{contactPerson}}, ..."
}
```

### Email Templates CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resources/emailtemplates` | List email templates |
| POST | `/api/resources/emailtemplates` | Create email template |
| PATCH | `/api/resources/emailtemplates/:id` | Update email template |
| DELETE | `/api/resources/emailtemplates/:id` | Delete email template |

### Template History CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resources/templatehistory?templateId=X` | List history entries |
| GET | `/api/resources/templatehistory/:id` | Get specific entry |
| POST | `/api/resources/templatehistory` | Create history entry |
| DELETE | `/api/resources/templatehistory/:id` | Delete history entry |

### Template Comments CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resources/templatecomments?templateId=X` | List comments |
| POST | `/api/resources/templatecomments` | Create comment |
| PATCH | `/api/resources/templatecomments/:id` | Edit comment |
| DELETE | `/api/resources/templatecomments/:id` | Delete comment |
