# React Integration — Officer Role + Grade Flow

> **New simplified model**
> Seniors = fixed roles (Minister / Secretary / AS / JS).  
> Everyone else = **one `officer` role**, differentiated only by **grade (BPS)**.

**Base URL:** `http://localhost:5000/api`  
**Auth:** `Authorization: Bearer <token>`  
**Password (all test users):** `Password@123`

Pehle `REACT_INTEGRATION_M2.md` (auth/users) complete karo.  
V2 review flow ke liye `REACT_INTEGRATION_V2_FLOW.md` bhi helpful hai — ye doc **role simplification** cover karta hai.

---

## Table of Contents

1. [Kya Change Hua](#1-kya-change-hua)
2. [Role Model (Final)](#2-role-model-final)
3. [Test Users](#3-test-users)
4. [Backend Setup](#4-backend-setup)
5. [Permissions](#5-permissions)
6. [UI Rules — Role vs Grade](#6-ui-rules--role-vs-grade)
7. [API Changes for Frontend](#7-api-changes-for-frontend)
8. [TypeScript Types](#8-typescript-types)
9. [React Components Checklist](#9-react-components-checklist)
10. [Test Flow](#10-test-flow)

---

## 1. Kya Change Hua

### Pehle (Old)
```
Roles: consultant, ds, so, owner  ← alag alag roles, same kaam
Grade: BPS-17, 16, 15, 14        ← duplicate hierarchy
```

### Ab (New)
```
Roles: officer  ← sirf ek worker role
Grade: BPS-17, 16, 15, 14  ← asal hierarchy yahan se
```

**Seniors unchanged:** minister, secretary, as, js  
**Admin unchanged:** super_admin, admin (no grade)

---

## 2. Role Model (Final)

| Role | Type | Grade? | Task Create | Submit Progress | View Tasks | Comment |
|------|------|--------|-------------|-----------------|------------|---------|
| super_admin | System | ❌ | ✅ (skip) | ❌ | all | — |
| admin | System | ❌ | ✅ (skip) | ❌ | all | — |
| minister | Senior | ✅ | ❌ | ❌ | all | ✅ |
| secretary | Senior | ✅ | ❌ | ❌ | all | ✅ |
| as | Senior | ✅ | ❌ | ❌ | all | ✅ |
| js | Senior | ✅ | ❌ | ❌ | all | ✅ |
| **officer** | Staff | ✅ **required** | ✅ | ✅ | dept | ❌ |

**Officer hierarchy = grade level only.**  
UI mein officer ko `"Ali Ahmed (BPS-16)"` dikhao — role name `"officer"` chhupa sakte ho ya secondary rakho.

---

## 3. Test Users

| Email | Role | Grade | Use for |
|-------|------|-------|---------|
| `superadmin@test.com` | super_admin | — | Full access |
| `admin@test.com` | admin | — | User/grade/dept manage |
| `minister@test.com` | minister | BPS-21 | Review + comment |
| `secretary@test.com` | secretary | BPS-20 | Review + comment |
| `as@test.com` | as | BPS-19 | Review + comment |
| `js@test.com` | js | BPS-18 | Review + comment |
| `bps17@test.com` | officer | BPS-17 | Create task → assign junior |
| `bps16@test.com` | officer | BPS-16 | Receive task + submit progress |
| `bps15@test.com` | officer | BPS-15 | Lower grade officer |
| `bps14@test.com` | officer | BPS-14 | Lowest grade (no junior to assign) |

**Legacy emails deactivated:** `consultant@test.com`, `ds@test.com`, `so@test.com`, `owner@test.com`

---

## 4. Backend Setup

```bash
npm run db:seed          # new roles + users
npm run db:clear-tasks   # optional — clean tasks for fresh test
npm run dev
```

Re-login after seed (permissions update).

---

## 5. Permissions

### Officer permissions
```json
[
  "task.create",
  "task.forward_review",
  "task.view_dept",
  "task.submit_update",
  "report.view_own",
  "notification.receive"
]
```

### Senior permissions
```json
[
  "task.view_all",
  "task.comment",
  "task.review_return",
  "task.export",
  "report.view_all",
  "notification.receive"
]
```

### Frontend permission checks
```typescript
const isOfficer = user.role_name === 'officer';
const isSenior = ['minister', 'secretary', 'as', 'js'].includes(user.role_name);
const isAdmin = ['admin', 'super_admin'].includes(user.role_name);

const canCreateTask = permissions.includes('task.create');
const canSubmitUpdate = permissions.includes('task.submit_update');
const canComment = permissions.includes('task.comment');
const canForwardReview = permissions.includes('task.forward_review');
const canManageGrades = permissions.includes('grade.manage');
```

---

## 6. UI Rules — Role vs Grade

### User list / profile
```tsx
// ✅ Good — grade primary for officers
{user.role_name === 'officer'
  ? `${user.full_name} (${user.grade_name})`
  : `${user.full_name} — ${formatRole(user.role_name)}`}
```

### Task assignee dropdown
```
GET /api/users/dropdown?dept_id=1
```

**Display label:** `{full_name} ({grade_name})` — role_name mat dikhao.

### Create user form (admin)
| Field | Rule |
|-------|------|
| Role | minister, secretary, as, js, **officer** |
| Grade | Required for all except admin/super_admin |

### Role dropdown — remove old options
```typescript
// Remove: consultant, ds, so, owner
const ASSIGNABLE_ROLES = [
  { value: 'minister', label: 'Minister' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'as', label: 'AS' },
  { value: 'js', label: 'JS' },
  { value: 'officer', label: 'Officer (grade-based)' },
];
```

---

## 7. API Changes for Frontend

### `/api/auth/me` — officer example
```json
{
  "email": "bps17@test.com",
  "role_name": "officer",
  "grade_name": "BPS-17",
  "grade_level": 17,
  "permissions": ["task.create", "task.forward_review", "task.view_dept", "task.submit_update"]
}
```

### Task create — same as V2
```
POST /api/tasks
{ "title": "...", "dept_id": 1, "assigned_to": 8, "start_date": "...", "end_date": "..." }
```

### Review flow — see REACT_INTEGRATION_V2_FLOW.md
- `POST /tasks/:id/comments`
- `PATCH /tasks/:id/forward-review`
- `PATCH /tasks/:id/return-to-creator`

---

## 8. TypeScript Types

```typescript
export type AppRole =
  | 'super_admin' | 'admin'
  | 'minister' | 'secretary' | 'as' | 'js'
  | 'officer';

export function displayUserLabel(user: AuthUser): string {
  if (user.role_name === 'officer' && user.grade_name) {
    return `${user.full_name} (${user.grade_name})`;
  }
  return user.full_name;
}
```

Frontend search & replace: `consultant | ds | so | owner` → `officer`

---

## 9. React Components Checklist

- [ ] Remove old worker role enums
- [ ] User table: Grade column for officers
- [ ] Assignee dropdown: show grade_name
- [ ] Officers get grade badge, seniors get role badge
- [ ] Hide "Create Task" for minister/secretary/as/js

---

## 10. Test Flow

| Step | Login | Action |
|------|-------|--------|
| 1 | `bps17@test.com` | Create task → assign **bps16** |
| 2 | `minister@test.com` | Comment on task |
| 3 | `bps17@test.com` | Forward for review |
| 4 | `minister@test.com` | Return to creator |
| 5 | `bps16@test.com` | Submit progress 25% |
| 6 | `bps14@test.com` | Create try → no junior in dropdown |

---

## Migration Summary

| Old | New |
|-----|-----|
| consultant + BPS-17 | officer + BPS-17 (`bps17@test.com`) |
| ds + BPS-16 | officer + BPS-16 (`bps16@test.com`) |
| so + BPS-15 | officer + BPS-15 (`bps15@test.com`) |
| owner + BPS-14 | officer + BPS-14 (`bps14@test.com`) |

**Related:** `REACT_INTEGRATION_V2_FLOW.md`, `REACT_INTEGRATION_M2.md`, `REACT_INTEGRATION_M3.md`
