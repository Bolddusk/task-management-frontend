# React Integration Guide — V2 Flow (Grade + Review)

> **Backend V2 — Done**
> Workers create & assign by **grade** (same dept). Seniors **review only** (view all, comment, return). Admin manages **grades**.

**Base URL:** `http://localhost:5000/api`  
**Auth:** `Authorization: Bearer <token>`  
**Seed password (all users):** `Password@123`

Pehle `REACT_INTEGRATION_M2.md` (auth/users) aur `REACT_INTEGRATION_M3.md` (tasks/updates) complete karo. Ye doc **V2 flow changes** cover karta hai.

---

## Table of Contents

1. [Business Flow (V2)](#1-business-flow-v2)
2. [Role Matrix](#2-role-matrix)
3. [Pehle Ye Karo (Backend)](#3-pehle-ye-karo-backend)
4. [New Permissions](#4-new-permissions)
5. [Grades API](#5-grades-api)
6. [User Changes (grade_id)](#6-user-changes-grade_id)
7. [Assignment Dropdown (Grade-based)](#7-assignment-dropdown-grade-based)
8. [Task Create (Grade Assignment)](#8-task-create-grade-assignment)
9. [Review Flow (Comment / Forward / Return)](#9-review-flow-comment--forward--return)
10. [Task Response Fields (New)](#10-task-response-fields-new)
11. [TypeScript Types](#11-typescript-types)
12. [API Client Snippets](#12-api-client-snippets)
13. [React UI Checklist](#13-react-ui-checklist)
14. [Test Accounts & Sample Flow](#14-test-accounts--sample-flow)

---

## 1. Business Flow (V2)

```
Workers (Consultant / DS / SO / Owner)
  → task create
  → same department mein junior ko assign (grade level se — higher grade → lower grade)
  → assignee progress submit karta hai (draft → submit, % sirf upar ja sakta hai)

Senior Officers (Minister / Secretary / AS / JS)
  → saari tasks dikhen (task.view_all)
  → kisi bhi task par comment
  → optional: creator review ke liye forward kare
  → comment ke baad senior task creator ko wapas bheje (return-to-creator)

Admin
  → users + departments + grades manage
```

**Important:** Seniors **task create nahi** karte aur **progress submit nahi** karte. Wo sirf oversight/review karte hain.

---

## 2. Role Matrix

| Role | Create Task | Assign (grade) | Submit Progress | View Tasks | Comment | Forward Review | Return to Creator | Manage Grades |
|------|-------------|----------------|-----------------|------------|---------|----------------|-------------------|---------------|
| super_admin | ✅ | ✅ (skip) | — | all | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ (on_behalf) | ✅ (skip) | — | all | — | — | — | ✅ |
| minister | ❌ | ❌ | ❌ | **all** | ✅ | ❌ | ✅ | ❌ |
| secretary | ❌ | ❌ | ❌ | **all** | ✅ | ❌ | ✅ | ❌ |
| as | ❌ | ❌ | ❌ | **all** | ✅ | ❌ | ✅ | ❌ |
| js | ❌ | ❌ | ❌ | **all** | ✅ | ❌ | ✅ | ❌ |
| consultant | ✅ | ✅ | ✅ | dept | ❌ | ✅ | ❌ | ❌ |
| ds | ✅ | ✅ | ✅ | dept | ❌ | ✅ | ❌ | ❌ |
| so | ✅ | ✅ | ✅ | dept | ❌ | ✅ | ❌ | ❌ |
| owner | ✅ | ✅ | ✅ | own | ❌ | ✅ | ❌ | ❌ |

### Seed Grades (BPS scale — higher level = senior)

| Grade | Level | Example User |
|-------|-------|--------------|
| BPS-22 | 22 | admin, super_admin |
| BPS-21 | 21 | minister@test.com |
| BPS-20 | 20 | secretary@test.com |
| BPS-19 | 19 | as@test.com |
| BPS-18 | 18 | js@test.com |
| BPS-17 | 17 | consultant@test.com |
| BPS-16 | 16 | ds@test.com |
| BPS-15 | 15 | so@test.com |
| BPS-14 | 14 | owner@test.com |

**Assignment rule:** Assigner ka `grade_level` > assignee ka `grade_level`, dono same `dept_id` mein hon, assignee worker role ho.

---

## 3. Pehle Ye Karo (Backend)

```bash
npm run db:migrate:015   # grades table
npm run db:migrate:016   # users.grade_id
npm run db:migrate:017   # task_comments
npm run db:migrate:018   # tasks.review_status, review_assignee_id
npm run db:seed          # updated permissions + grades
npm run dev
```

---

## 4. New Permissions

Frontend mein `AuthContext.permissions` se check karo:

| Permission | Use |
|------------|-----|
| `task.comment` | Senior comment form dikhao |
| `task.forward_review` | Creator "Send for Review" button |
| `task.review_return` | Senior "Return to Creator" button |
| `grade.manage` | Admin grades CRUD page |

**Removed from seniors:** `task.create`, `task.submit_update`  
**Added to ds/so:** `task.create`, `task.forward_review`

---

## 5. Grades API

### List grades (all authenticated users)

```
GET /api/grades
```

**Response:**
```json
[
  { "id": 1, "org_id": 1, "name": "BPS-21", "level": 21, "created_at": "..." }
]
```

### Create grade (admin)

```
POST /api/grades
Authorization: Bearer <admin_token>

{ "name": "BPS-13", "level": 13 }
```

### Update grade (admin)

```
PATCH /api/grades/:id
{ "name": "BPS-13A", "level": 13 }
```

---

## 6. User Changes (grade_id)

### `/api/auth/me` — ab grade bhi aata hai

```json
{
  "id": 7,
  "full_name": "Consultant",
  "role_name": "consultant",
  "grade_id": 7,
  "grade_name": "BPS-17",
  "grade_level": 17,
  "permissions": ["task.create", "task.forward_review", ...],
  "departments": [{ "id": 1, "name": "Administration", "is_primary": 1 }]
}
```

### Create user — `grade_id` required

```
POST /api/users
{
  "full_name": "New DS",
  "email": "newds@test.com",
  "password": "Password@123",
  "role_id": 8,
  "grade_id": 7,
  "dept_ids": [1]
}
```

### Update user

```
PATCH /api/users/:id
{ "grade_id": 6 }
```

### User list response — grade fields

```json
{
  "users": [{
    "id": 8,
    "full_name": "DS User",
    "grade_id": 7,
    "grade_name": "BPS-16",
    "grade_level": 16,
    "role_name": "ds"
  }]
}
```

---

## 7. Assignment Dropdown (Grade-based)

**Purana:** hierarchy_level se junior users  
**Naya:** grade level se, same department, worker roles only

```
GET /api/users/dropdown?dept_id=1
```

**Response:**
```json
[
  {
    "id": 8,
    "full_name": "DS User",
    "role_name": "ds",
    "grade_name": "BPS-16",
    "grade_level": 16,
    "departments": [{ "id": 1, "name": "Administration" }]
  }
]
```

**UI tip:** Task create form mein pehle department select karo, phir `dept_id` ke saath dropdown call karo.

### Senior dropdown (review forward ke liye)

```
GET /api/users/dropdown/seniors
```

**Response:**
```json
[
  { "id": 3, "full_name": "Minister Test", "role_name": "minister", "grade_name": "BPS-21", "grade_level": 21 }
]
```

---

## 8. Task Create (Grade Assignment)

```
POST /api/tasks
Authorization: Bearer <worker_token>

{
  "title": "Prepare quarterly report",
  "description": "...",
  "dept_id": 1,
  "assigned_to": 8,
  "start_date": "2026-07-14",
  "end_date": "2026-07-30",
  "priority": "medium"
}
```

**Validation errors:**
- `403` — `{ "error": "Cannot assign to equal or higher grade" }`
- `400` — assignee worker role nahi hai ya same dept mein nahi

**Admin on_behalf:** `{ ..., "on_behalf_of": 7 }` — grade check on_behalf user ke grade se hota hai.

---

## 9. Review Flow (Comment / Forward / Return)

### List comments

```
GET /api/tasks/:id/comments
```

**Response:**
```json
[
  {
    "id": 1,
    "comment_text": "Please revise timeline",
    "is_review_comment": true,
    "created_at": "2026-07-14T...",
    "author": { "id": 3, "full_name": "Minister Test", "role_name": "minister" }
  }
]
```

### Add comment (senior only — `task.comment`)

```
POST /api/tasks/:id/comments
{ "comment_text": "Looks good, minor edits needed" }
```

Creator ko notification jati hai.

### Forward for review (creator — `task.forward_review`)

```
PATCH /api/tasks/:id/forward-review
{ "senior_id": 3 }
```

**Response:**
```json
{
  "message": "Task forwarded to Minister Test for review",
  "review_status": "with_senior",
  "review_assignee": { "id": 3, "full_name": "Minister Test", "role_name": "minister" }
}
```

### Return to creator (senior — `task.review_return`)

```
PATCH /api/tasks/:id/return-to-creator
```

**Response:**
```json
{
  "message": "Task returned to creator",
  "review_status": "returned"
}
```

### Review status values

| Value | Meaning |
|-------|---------|
| `none` | Default — normal workflow |
| `with_senior` | Creator ne review ke liye bheja |
| `returned` | Senior ne wapas bhej diya |

---

## 10. Task Response Fields (New)

Task list aur detail mein ab ye fields hain:

```json
{
  "id": 4,
  "title": "V2 Test Task",
  "review_status": "returned",
  "review_assignee": {
    "id": 3,
    "full_name": "Minister Test",
    "role_name": "minister"
  }
}
```

`review_assignee` sirf tab populated jab `review_status === "with_senior"`.

**Removed endpoint:** `PATCH /api/tasks/:id/forward` (purana hierarchy forward) — ab use mat karo.

---

## 11. TypeScript Types

```typescript
export interface Grade {
  id: number;
  org_id: number;
  name: string;
  level: number;
  created_at: string;
}

export interface UserGradeInfo {
  grade_id: number | null;
  grade_name: string | null;
  grade_level: number | null;
}

export type ReviewStatus = 'none' | 'with_senior' | 'returned';

export interface TaskComment {
  id: number;
  comment_text: string;
  is_review_comment: boolean;
  created_at: string;
  author: { id: number; full_name: string; role_name: string };
}

export interface TaskListItem {
  id: number;
  title: string;
  priority: string;
  status: string;
  completion_percentage: number;
  review_status: ReviewStatus;
  review_assignee: { id: number; full_name: string; role_name: string } | null;
  assignee: { id: number; full_name: string; role_name: string };
  creator: { id: number; full_name: string; role_name: string };
  dept: { id: number; name: string };
}

export interface AssigneeOption {
  id: number;
  full_name: string;
  role_name: string;
  grade_name: string;
  grade_level: number;
  departments: { id: number; name: string }[];
}

export interface SeniorOption {
  id: number;
  full_name: string;
  role_name: string;
  grade_name: string;
  grade_level: number;
}
```

---

## 12. API Client Snippets

### `src/api/grades.ts`

```typescript
import client from './client';
import type { Grade } from '../types/v2';

export const listGrades = () => client.get<Grade[]>('/grades');
export const createGrade = (data: { name: string; level: number }) =>
  client.post<Grade>('/grades', data);
export const updateGrade = (id: number, data: Partial<{ name: string; level: number }>) =>
  client.patch<Grade>(`/grades/${id}`, data);
```

### `src/api/tasksReview.ts`

```typescript
import client from './client';
import type { TaskComment } from '../types/v2';

export const listComments = (taskId: number) =>
  client.get<TaskComment[]>(`/tasks/${taskId}/comments`);

export const addComment = (taskId: number, comment_text: string) =>
  client.post(`/tasks/${taskId}/comments`, { comment_text });

export const forwardForReview = (taskId: number, senior_id: number) =>
  client.patch(`/tasks/${taskId}/forward-review`, { senior_id });

export const returnToCreator = (taskId: number) =>
  client.patch(`/tasks/${taskId}/return-to-creator`);
```

### `src/api/users.ts` — add

```typescript
export const getAssignableUsers = (deptId: number) =>
  client.get(`/users/dropdown?dept_id=${deptId}`);

export const getSeniorOfficers = () =>
  client.get('/users/dropdown/seniors');
```

---

## 13. React UI Checklist

### Admin Panel
- [ ] **Grades page** — list, create, edit (`grade.manage`)
- [ ] **User form** — grade dropdown (required on create)
- [ ] User table mein grade column

### Task Create (Workers)
- [ ] Department select → phir assignee dropdown (`GET /users/dropdown?dept_id=X`)
- [ ] Assignee option mein grade dikhao: `"DS User (BPS-16)"`
- [ ] Error toast: "Cannot assign to equal or higher grade"

### Task Detail — Worker (creator)
- [ ] "Send for Review" button — `task.forward_review` permission
- [ ] Senior select modal (`GET /users/dropdown/seniors`)
- [ ] Review status badge: `none` / `with_senior` / `returned`

### Task Detail — Senior
- [ ] Comments section (read + add) — `task.comment`
- [ ] "Return to Creator" button — `task.review_return`
- [ ] Saari tasks list mein sab tasks dikhen (no dept filter needed — server `view_all`)

### Task Detail — Assignee (DS/SO/etc.)
- [ ] Progress submit (existing M3 flow — unchanged)
- [ ] Comments read-only dikhao

### Permissions-based nav
```typescript
const canComment = permissions.includes('task.comment');
const canForwardReview = permissions.includes('task.forward_review');
const canReturn = permissions.includes('task.review_return');
const canManageGrades = permissions.includes('grade.manage');
```

### Remove / Hide (V2)
- [ ] Senior users se "Create Task" button hatao
- [ ] `PATCH /tasks/:id/forward` UI hatao (deprecated)
- [ ] Hierarchy-based assignee dropdown logic hatao

---

## 14. Test Accounts & Sample Flow

### Login credentials

| Email | Role | Grade |
|-------|------|-------|
| consultant@test.com | consultant | BPS-17 |
| ds@test.com | ds | BPS-16 |
| minister@test.com | minister | BPS-21 |
| admin@test.com | admin | BPS-22 |

Password: `Password@123`

### End-to-end test

1. **Login as consultant** → Create task → assign to DS (BPS-16)
2. **Login as minister** → Task detail → add comment
3. **Login as consultant** → Forward for review → select Minister
4. **Login as minister** → Return to creator
5. **Login as ds** → Submit progress 25% → 50% → 100%

### cURL quick test

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"consultant@test.com","password":"Password@123"}' | jq -r .token)

# Assignable users
curl -s "http://localhost:5000/api/users/dropdown?dept_id=1" \
  -H "Authorization: Bearer $TOKEN"

# Create task
curl -s -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","dept_id":1,"assigned_to":8,"start_date":"2026-07-14","end_date":"2026-07-30"}'
```

---

## Migration from M3 UI

| M3 (Old) | V2 (New) |
|----------|----------|
| Hierarchy dropdown (`hierarchy_level > me`) | Grade dropdown (`grade_level < me`, same dept) |
| Secretary forward chain (`PATCH /forward`) | Creator forward review (`PATCH /forward-review`) |
| Senior creates tasks | Senior comments only |
| No grades | Admin manages grades, users have `grade_id` |
| Dept-scoped seniors | Seniors see **all** tasks |

---

**Questions?** Backend health: `GET /api/health` → `{ "success": true, "status": "ok" }`
