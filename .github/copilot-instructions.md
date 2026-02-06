# TechLog Clinic OS - GitHub Copilot Instructions

## Project Overview

TechLog Clinic OS is a **SaaS medical clinic scheduling system** built with Node.js, TypeScript,
Express, and SQLite. The system emphasizes **simplicity, intuitive design, and modern
architecture**.

## Critical Architecture Rules

### Layered Architecture (MANDATORY)

```
Controllers → Services → Repositories → Database
```

**NEVER violate this separation:**

- ❌ **FORBIDDEN**: Controllers accessing `db` directly
- ✅ **REQUIRED**: Controllers use Services, Services use Repositories
- ✅ **REQUIRED**: All SQL queries must be in Repositories only

### Example Pattern

```typescript
// Controller (thin - orchestration only)
static async getPatient(req, res, next) {
    try {
        const patient = await PatientService.findById(id, clinicId);
        res.json({ success: true, data: patient });
    } catch (error) {
        next(error);
    }
}

// Service (business logic)
static async findById(id: number, clinicId: number): Promise<Patient> {
    const patient = await PatientRepository.findById(id, clinicId);
    if (!patient) throw new NotFoundError('Paciente não encontrado');
    return patient;
}

// Repository (data access only)
static async findById(id: number, clinicId: number): Promise<Patient | null> {
    return dbAsync.get('SELECT * FROM patients WHERE id = ? AND clinic_id = ?', [id, clinicId]);
}
```

## Directory Structure

```
src/
├── config/              # All constants and configuration
│   └── constants.ts     # System-wide constants (use this!)
├── controllers/         # Thin orchestration layer
├── services/           # Business logic layer
├── repositories/       # Data access layer (SQL only here)
├── middleware/         # Express middleware
├── validators/         # Zod validation schemas
├── types/              # TypeScript interfaces
├── routes/             # Route definitions
└── shared/
    ├── errors/         # Custom error classes
    └── utils/          # Pure utility functions

public/js/
├── pages/              # Entry points per page
├── components/         # Reusable UI components
├── services/           # API calls (use api.service.js)
└── utils/              # Frontend utilities
```

## Mandatory Patterns

### 1. Centralized Constants

**Always use** `src/config/constants.ts` for:

- API endpoints
- Error messages
- Status values
- Cache keys
- Routes
- Configuration values

### 2. Error Handling

Use custom error classes from `src/shared/errors/`:

- `NotFoundError` (404)
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)

### 3. API Response Format

**Success:**

```json
{
    "success": true,
    "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "error": "User-friendly message",
  "code": "ERROR_CODE"
}
```

### 4. Validation

- Use Zod for all input validation
- Place schemas in `src/validators/`
- Validate at controller level

### 5. Frontend API Calls

- **ONLY** use `api.service.js` for API requests
- Never use `fetch()` directly in pages
- Use centralized token management

## Build & Test Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build TypeScript

# Testing
npm test                # Run all tests
npm run test:unit       # Unit tests only
npm run test:e2e        # E2E tests with Playwright

# Linting
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix issues

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed test data
```

## Code Quality Standards

- **File size limit**: Max 300 lines per file
- **TypeScript**: Full typing required (no `any`)
- **No console.log**: Remove debug logs before commit
- **Tests required**: Add tests for new features
- **Code coverage target**: 60%

## Security Rules

1. Never commit secrets or credentials
2. Always validate and sanitize user input
3. Use parameterized queries (prevent SQL injection)
4. Implement proper authentication checks
5. Check multi-tenant isolation (clinic_id)

## Never Do This

- ❌ Import `db` in controllers
- ❌ Put SQL in services or controllers
- ❌ Hardcode values (use constants)
- ❌ Skip validation
- ❌ Ignore errors (always handle)
- ❌ Mix business logic with presentation
- ❌ Create files > 300 lines
- ❌ Use `console.log` for production logging

## Always Do This

- ✅ Follow Controller → Service → Repository pattern
- ✅ Use TypeScript with full typing
- ✅ Validate input with Zod
- ✅ Use centralized constants
- ✅ Handle errors with custom classes
- ✅ Write tests for new code
- ✅ Keep files small and focused
- ✅ Document public functions

## Multi-Tenant Context

This is a **multi-tenant SaaS** system:

- Every query MUST filter by `clinic_id`
- Check `clinic_id` in middleware
- Prevent cross-tenant data access
- Soft delete with `deleted_at` (never hard delete)

## Performance Targets

- API response time: < 200ms
- Page load time: < 1s
- Database queries: Use indexes efficiently
- Frontend: Minimize bundle size

## Documentation

For detailed architecture and migration plans, see:

- `/COPILOT_GUIDELINES.md` - Complete guidelines
- `/docs/PROJETO.md` - Project documentation
- `/docs/DESENVOLVIMENTO.md` - Development guide

---

**Remember**: This system prioritizes **simplicity and maintainability**. When in doubt, choose the
simpler, more explicit solution.
