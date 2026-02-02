# Testing Guide - Medical CRM

## Table of Contents

1. [Automated Testing with Jest](#automated-testing-with-jest)
2. [Frontend Manual Testing](#frontend-manual-testing)
3. [API Testing](#api-testing)

---

## Automated Testing with Jest

### 🧪 Setup

The project uses **Jest** with **ts-jest** for TypeScript support and **supertest** for API testing.

#### Prerequisites

```bash
# All test dependencies are already installed
# If you need to reinstall:
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
```

### 📝 Running Tests

#### Run All Tests with Coverage

```bash
npm test
```

This will:

- Run all test files (\*.test.ts)
- Generate coverage report
- Display results in terminal
- Create HTML coverage report in `coverage/` directory

#### Run Tests in Watch Mode

```bash
npm run test:watch
```

Automatically re-runs tests when files change. Perfect for TDD (Test-Driven Development).

#### Run Unit Tests Only

```bash
npm run test:unit
```

Runs only unit tests (excludes integration tests if any).

#### Run Tests with Verbose Output

```bash
npm run test:verbose
```

Shows detailed information about each test case.

### 📊 Understanding Test Coverage

After running `npm test`, you'll see coverage statistics:

```
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
-------------------|---------|----------|---------|---------|-------------------
All files          |   85.5  |   78.2   |   90.1  |   85.5  |
 AuthController.ts |   95.2  |   87.5   |   100   |   95.2  | 15,23
 LeadController.ts |   82.3  |   75.0   |   88.9  |   82.3  | 45-48,102
-------------------|---------|----------|---------|---------|-------------------
```

**Coverage Goals:**

- ✅ **80%+** - Good coverage
- ✅ **90%+** - Excellent coverage
- 🎯 **100%** - Perfect (not always practical)

### 🧩 Test Structure

#### Test Files Location

```
tests/
├── setup.ts                 # Test environment setup
├── AuthController.test.ts   # Auth/JWT tests
├── LeadController.test.ts   # Lead CRUD tests
└── ... (add more tests here)
```

#### Example Test Structure

```typescript
describe('AuthController', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Mudar123!' })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrong' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
```

### 🎯 Available Test Suites

#### 1. AuthController Tests

**File:** `tests/AuthController.test.ts`

**Coverage:**

- ✅ JWT login with valid credentials
- ✅ Login failure with invalid email
- ✅ Login failure with invalid password
- ✅ bcrypt password verification
- ✅ JWT token generation and validation
- ✅ Input validation (empty, null, whitespace)
- ✅ Security: no credential leakage

**Run only Auth tests:**

```bash
npx jest AuthController
```

#### 2. LeadController Tests

**File:** `tests/LeadController.test.ts`

**Coverage:**

- ✅ Create lead (POST /api/leads)
- ✅ List leads (GET /api/leads)
- ✅ Update lead status (PATCH /api/leads/:id)
- ✅ Delete lead (DELETE /api/leads/:id)
- ✅ Dashboard metrics (GET /api/leads/dashboard)
- ✅ Archive/Unarchive leads
- ✅ Authentication middleware
- ✅ Input validation

**Run only Lead tests:**

```bash
npx jest LeadController
```

### 🛠️ Writing New Tests

#### 1. Create Test File

```bash
# Create new test file
touch tests/YourController.test.ts
```

#### 2. Basic Template

```typescript
import request from 'supertest';
import express, { Express } from 'express';
import yourRoutes from '../src/routes/your.routes';

describe('YourController', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/your-endpoint', yourRoutes);
  });

  describe('GET /api/your-endpoint', () => {
    it('should return data', async () => {
      const response = await request(app).get('/api/your-endpoint').expect(200);

      expect(response.body).toBeDefined();
    });
  });
});
```

#### 3. Run Your Test

```bash
npx jest YourController
```

### 🐛 Debugging Tests

#### Run Single Test File

```bash
npx jest AuthController.test.ts
```

#### Run Single Test Case

```bash
npx jest -t "should login successfully"
```

#### Enable Console Output

```bash
npx jest --silent=false
```

### 📋 Test Best Practices

1. **AAA Pattern** (Arrange-Act-Assert)

   ```typescript
   it('should create a lead', async () => {
     // Arrange
     const newLead = { name: 'Test', phone: '11999999999' };

     // Act
     const response = await request(app).post('/api/leads').send(newLead);

     // Assert
     expect(response.status).toBe(201);
     expect(response.body).toHaveProperty('id');
   });
   ```

2. **Test Independence**
   - Each test should be independent
   - Use `beforeEach` for fresh setup
   - Clean up in `afterEach` if needed

3. **Meaningful Descriptions**

   ```typescript
   // ❌ Bad
   it('test 1', () => { ... });

   // ✅ Good
   it('should return 401 when token is missing', () => { ... });
   ```

4. **Test Edge Cases**
   - Empty inputs
   - Null values
   - Invalid formats
   - Boundary conditions

### 🔧 Configuration Files

#### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/server.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

#### tests/setup.ts

Sets up test environment variables and global configuration.

### 🚀 CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
```

---

## Frontend Manual Testing

## Quick Test Checklist

### 🟢 Pre-Test Setup

```bash
# Ensure server is running
pm2 status

# If not running:
cd /home/techlog-api
pm2 start npm --name "techlog-api" -- start

# Check server logs
pm2 logs techlog-api
```

---

## 1. Login Page Tests

**URL**: `http://localhost:3001/login.html`

| Test               | Action                   | Expected Result                                     |
| ------------------ | ------------------------ | --------------------------------------------------- |
| ✅ Page Load       | Open login page          | Page loads without console errors                   |
| ✅ UI Elements     | Check form               | Username, password fields, and login button visible |
| ✅ Invalid Login   | Enter wrong credentials  | Error message displays                              |
| ✅ Admin Login     | Use: `admin` / `123`     | Redirects to admin.html                             |
| ✅ Doctor Login    | Use: `dr.joao` / `123`   | Redirects to admin.html                             |
| ✅ Reception Login | Use: `recepcao1` / `123` | Redirects to admin.html                             |

**Console Commands to Test**:

```javascript
// Check if login page loaded correctly
console.log('Login page loaded:', document.title);

// After login, check stored user
console.log('Current user:', localStorage.getItem('user'));
```

---

## 2. Admin Panel - Authentication Tests

**URL**: `http://localhost:3001/admin.html`

| Test            | Action                         | Expected Result                                                |
| --------------- | ------------------------------ | -------------------------------------------------------------- |
| ✅ Auth Check   | Load admin.html without login  | Redirects to login.html                                        |
| ✅ User Display | Login and load page            | User name shows in header                                      |
| ✅ Team Button  | Login as admin                 | "Gerenciar Equipe" button visible                              |
| ✅ Team Button  | Login as doctor/reception      | "Gerenciar Equipe" button hidden                               |
| ✅ JS Modules   | Check browser DevTools Network | All 4 JS files load (api.js, auth.js, kanban.js, dashboard.js) |
| ✅ No Errors    | Check Console (F12)            | No JavaScript errors                                           |

**Console Commands**:

```javascript
// Verify current user
console.log('User:', currentUser);

// Check if modules loaded
console.log('API URL:', typeof API_URL !== 'undefined' ? API_URL : 'NOT LOADED');
console.log('Load Leads:', typeof loadLeads !== 'undefined' ? 'LOADED' : 'NOT LOADED');
console.log('Open Dashboard:', typeof openDashboard !== 'undefined' ? 'LOADED' : 'NOT LOADED');
```

---

## 3. Admin Panel - Team Management Tests

**Prerequisites**: Login as `admin` / `123`

| Test               | Action                                                                            | Expected Result                            |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------------------------ |
| ✅ Open Modal      | Click "Gerenciar Equipe" button                                                   | Team modal opens                           |
| ✅ Load Users      | Modal opens                                                                       | Existing users display with role icons     |
| ✅ Admin Protected | Check admin user                                                                  | "Protegido" label shown (cannot delete)    |
| ✅ Add User Form   | Fill form with new user data                                                      | Form fields visible                        |
| ✅ Create User     | Submit form: Name: "Test User", Username: "test", Password: "123", Role: "medico" | Success notification, user appears in list |
| ✅ Delete User     | Click "Remover" on test user                                                      | Confirmation dialog, then user removed     |
| ✅ Close Modal     | Click X or outside modal                                                          | Modal closes                               |

**Console Commands**:

```javascript
// Manually trigger team modal
openTeamModal();

// Check users loaded
fetch('/api/users')
  .then((r) => r.json())
  .then((d) => console.log('Users:', d));
```

---

## 4. Admin Panel - Kanban Board Tests

| Test               | Action                              | Expected Result                                  |
| ------------------ | ----------------------------------- | ------------------------------------------------ |
| ✅ Load Leads      | Page loads                          | Leads appear in columns                          |
| ✅ Column Counts   | Check column headers                | Counters show correct lead count                 |
| ✅ Lead Card       | Check any lead card                 | Name, phone, type badge, wait time visible       |
| ✅ Edit Button     | Click pen icon on lead              | Edit modal opens with lead data                  |
| ✅ Edit Save       | Change appointment date, click Save | Success notification, modal closes, lead updates |
| ✅ Delete Lead     | Click trash icon                    | Confirmation dialog                              |
| ✅ Delete Confirm  | Confirm delete                      | Lead removed from board                          |
| ✅ Drag Card       | Drag lead to different column       | Card moves smoothly                              |
| ✅ Drop Card       | Drop in new column                  | Card stays in new column                         |
| ✅ Status Update   | Check after drop                    | Success notification, status updated in backend  |
| ✅ WhatsApp Button | Click "Chat" button on lead         | Opens WhatsApp in new tab                        |
| ✅ Privacy Mode    | Click eye icon in header            | Names and phones blur                            |
| ✅ Privacy Toggle  | Click eye icon again                | Names and phones unblur                          |

**Console Commands**:

```javascript
// Manually reload leads
loadLeads();

// Check lead count
fetch('/api/leads', {
  headers: {
    'x-access-token': 'eviva2026',
  },
})
  .then((r) => r.json())
  .then((d) => console.log('Leads:', d.length));

// Toggle privacy mode
togglePrivacyMode();
```

---

## 5. Admin Panel - Dashboard Tests

| Test                | Action                   | Expected Result                |
| ------------------- | ------------------------ | ------------------------------ |
| ✅ Open Dashboard   | Click "Dashboard" button | Dashboard modal opens          |
| ✅ Total Leads      | Check top metric         | Total leads count displays     |
| ✅ Revenue          | Check revenue estimate   | Calculated value shows         |
| ✅ Status Chart     | Check doughnut chart     | Chart renders with colors      |
| ✅ Type Chart       | Check bar chart          | Bars show lead types           |
| ✅ History Chart    | Check line chart         | Line shows trend over days     |
| ✅ Close Dashboard  | Click X button           | Modal closes, charts destroyed |
| ✅ Reopen Dashboard | Open dashboard again     | Charts re-render correctly     |

**Console Commands**:

```javascript
// Open dashboard
openDashboard();

// Check dashboard data
fetch('/api/leads/dashboard', {
  headers: {
    'x-access-token': 'eviva2026',
  },
})
  .then((r) => r.json())
  .then((d) => console.log('Dashboard:', d));

// Close dashboard
closeDashboard();
```

---

## 6. Landing Page - Chatbot Tests

**URL**: `http://localhost:3001/index.html`

| Test               | Action                     | Expected Result                              |
| ------------------ | -------------------------- | -------------------------------------------- |
| ✅ Page Load       | Open index.html            | Page loads, chatbot button visible           |
| ✅ JS Module       | Check Network tab          | chatbot.js loads                             |
| ✅ No Errors       | Check Console              | No JavaScript errors                         |
| ✅ Open Chat       | Click floating chat button | Chat window opens                            |
| ✅ Welcome Message | Check chat                 | Welcome messages appear                      |
| ✅ Name Input      | Type name and press Enter  | Name accepted, next question appears         |
| ✅ Type Selection  | Click "1ª Consulta" button | Selection registered, phone question appears |
| ✅ Phone Mask      | Type phone number          | Auto-formats as (XX) XXXXX-XXXX              |
| ✅ Submit          | Enter phone, press Enter   | Loading state, then success messages         |
| ✅ Restart Button  | After success              | "Nova Conversa" button appears               |
| ✅ Restart         | Click restart button       | Chat resets to beginning                     |
| ✅ Close Chat      | Click X button             | Chat window closes                           |

**Console Commands**:

```javascript
// Check chatbot loaded
console.log('Chat State:', chatState);

// Open chat manually
openChat();

// Restart chat
restartChat();

// Check if lead was created
fetch('/api/leads', {
  headers: {
    'x-access-token': 'eviva2026',
  },
})
  .then((r) => r.json())
  .then((d) => console.log('Latest lead:', d[d.length - 1]));
```

---

## 7. Auto-Refresh Test

| Test                  | Action                                   | Expected Result                                          |
| --------------------- | ---------------------------------------- | -------------------------------------------------------- |
| ✅ Timer Set          | Open admin.html                          | Console shows no setInterval errors                      |
| ✅ Background Refresh | Wait 60 seconds                          | Board auto-reloads (check timestamp)                     |
| ✅ New Lead Alert     | Create lead via chatbot while admin open | Sound plays, notification shows "🔔 Novo lead recebido!" |

**Console Commands**:

```javascript
// Check last lead count
console.log('Last lead count:', lastLeadCount);

// Manually trigger refresh (to test without waiting)
loadLeads();
```

---

## 8. Browser Compatibility Tests

Test in multiple browsers:

| Browser       | Version | Status |
| ------------- | ------- | ------ |
| Chrome        | Latest  | ✅     |
| Firefox       | Latest  | ✅     |
| Safari        | Latest  | ✅     |
| Edge          | Latest  | ✅     |
| Mobile Chrome | Latest  | ✅     |
| Mobile Safari | Latest  | ✅     |

---

## 9. Performance Tests

### Check Load Times

**Open DevTools → Network Tab → Reload Page**

| Resource       | Expected Load Time |
| -------------- | ------------------ |
| index.html     | < 100ms            |
| admin.html     | < 100ms            |
| api.js         | < 50ms             |
| auth.js        | < 50ms             |
| kanban.js      | < 100ms            |
| dashboard.js   | < 100ms            |
| chatbot.js     | < 100ms            |
| Chart.js (CDN) | < 500ms            |

### Check Memory Usage

**DevTools → Performance → Record → Stop**

| Action          | Expected Memory                           |
| --------------- | ----------------------------------------- |
| Load admin.html | < 50 MB                                   |
| Open dashboard  | < 100 MB                                  |
| Close dashboard | Memory should decrease (charts destroyed) |

---

## 10. Error Handling Tests

| Test                  | Action                             | Expected Result            |
| --------------------- | ---------------------------------- | -------------------------- |
| ✅ API Down           | Stop server, try to load leads     | Error message displays     |
| ✅ Invalid Data       | Edit lead with bad data            | Validation error shows     |
| ✅ Network Error      | Disconnect internet, try action    | Graceful error message     |
| ✅ Duplicate Username | Create user with existing username | Error: "Usuário já existe" |

---

## 11. Regression Tests (Verify Old Features Still Work)

| Feature                           | Status      |
| --------------------------------- | ----------- |
| ✅ Login with correct credentials | Working     |
| ✅ Login with wrong credentials   | Shows error |
| ✅ Logout redirects to home       | Working     |
| ✅ Team management (admin only)   | Working     |
| ✅ Create new user                | Working     |
| ✅ Delete user (not admin)        | Working     |
| ✅ Kanban board loads             | Working     |
| ✅ Drag and drop cards            | Working     |
| ✅ Edit lead modal                | Working     |
| ✅ Delete lead                    | Working     |
| ✅ WhatsApp integration buttons   | Working     |
| ✅ Dashboard charts               | Working     |
| ✅ Chatbot lead capture           | Working     |
| ✅ Privacy mode (LGPD)            | Working     |
| ✅ Auto-refresh every 60s         | Working     |
| ✅ Sound notification             | Working     |

---

## 12. Security Tests

| Test                   | Action                                    | Expected Result                |
| ---------------------- | ----------------------------------------- | ------------------------------ |
| ✅ Direct Admin Access | Open admin.html without login             | Redirects to login             |
| ✅ LocalStorage Auth   | Clear localStorage, reload admin          | Redirects to login             |
| ✅ API Token           | Check requests in Network tab             | x-access-token header present  |
| ✅ XSS Protection      | Enter `<script>alert(1)</script>` in name | Rendered as text, not executed |

---

## 13. Final Checklist

### Files Created ✅

- [x] `/home/techlog-api/public/js/api.js`
- [x] `/home/techlog-api/public/js/auth.js`
- [x] `/home/techlog-api/public/js/kanban.js`
- [x] `/home/techlog-api/public/js/dashboard.js`
- [x] `/home/techlog-api/public/js/chatbot.js`

### Files Modified ✅

- [x] `/home/techlog-api/public/admin.html` (1350 → 430 lines)
- [x] `/home/techlog-api/public/index.html` (854 → 495 lines)

### Documentation Created ✅

- [x] `/home/techlog-api/REFACTORING_SUMMARY.md`
- [x] `/home/techlog-api/ARCHITECTURE_DIAGRAM.md`
- [x] `/home/techlog-api/TESTING_GUIDE.md`

### Functionality Preserved ✅

- [x] Authentication
- [x] Team Management
- [x] Kanban Board
- [x] Dashboard
- [x] Chatbot
- [x] All API integrations

---

## Debugging Tips

### If admin.html doesn't load:

```bash
# Check server logs
pm2 logs techlog-api

# Restart server
pm2 restart techlog-api
```

### If JavaScript doesn't work:

```javascript
// Open browser console (F12) and check:
console.log('Modules loaded:');
console.log('- API:', typeof API_URL);
console.log('- Auth:', typeof currentUser);
console.log('- Kanban:', typeof loadLeads);
console.log('- Dashboard:', typeof openDashboard);
console.log('- Chatbot:', typeof toggleChat);
```

### If charts don't render:

```javascript
// Check Chart.js loaded
console.log('Chart.js:', typeof Chart);

// Manually open dashboard
openDashboard();
```

---

## Success Criteria

✅ **All tests pass**  
✅ **No console errors**  
✅ **No broken functionality**  
✅ **Performance is acceptable**  
✅ **Code is more maintainable**

---

## Reporting Issues

If you find any issues:

1. **Capture the error**:
   - Screenshot of console (F12)
   - Screenshot of Network tab
   - Steps to reproduce

2. **Check the logs**:

   ```bash
   pm2 logs techlog-api
   ```

3. **Verify files**:

   ```bash
   ls -la /home/techlog-api/public/js/
   ```

4. **Test in isolation**:
   - Does api.js load? Check Network tab
   - Are there syntax errors? Check Console tab
   - Is the server running? Check `pm2 status`

---

**Happy Testing! 🚀**
