# Backend Pattern: Service & Repository Layer

To ensure the API is production-ready, we will move away from direct JSON manipulation to a structured 3-layer pattern.

## 🧱 The 3-Layer Pattern

### 1. Route/Controller Layer
**File Example**: `server/routes/leads.js`
- Handles HTTP request parsing (body, query params).
- Calls the appropriate Service method.
- Returns the HTTP response (200 OK, 404 Not Found, etc.).

### 2. Service Layer (Business Logic)
**File Example**: `server/services/leadService.js`
- Validates data beyond basic types.
- Handles complex operations (e.g., "When a lead is created, notify the user").
- Orchestrates multiple Repository calls if needed.

### 3. Repository Layer (Data Access)
**File Example**: `server/repositories/leadRepository.js`
- The ONLY layer that talks to **Prisma**.
- Handlers for specific DB queries: `findAllByUserId()`, `findById()`, `update()`.

## 🧬 Code Example (Proposed)

```javascript
// Repository: Direct DB Access
const leadRepository = {
  async getAllForUser(userId) {
    return prisma.lead.findMany({ where: { userId } });
  }
};

// Service: Business Rules
const leadService = {
  async getLeads(userId) {
    // Add filtering or sorting logic here
    return leadRepository.getAllForUser(userId);
  }
};

// Route: Request/Response
router.get('/', async (req, res) => {
  const leads = await leadService.getLeads(req.user.id);
  res.json(leads);
});
```

## ✅ Benefits for You
- **Maintenance**: If we ever change the database again, we only change the Repository layer.
- **Testing**: We can test business logic (Services) without actually hitting the database.
- **Cleanliness**: Routes stay thin and readable.
