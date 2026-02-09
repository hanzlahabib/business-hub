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

> **Note**: This is a development-grade auth system. Not suitable for production.
