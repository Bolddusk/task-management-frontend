# React Integration — Multi-Assignee Tasks

> **Backend live**
> Ek task pe **multiple people assign** ho sakte hain.  
> Har assignee apna **alag progress %** update karta hai.  
> Task ka overall % = **average** of all assignees.  
> Task **completed** tab jab **sab** 100% ho jayein.

**Base URL:** `http://localhost:5000/api`  
**Auth:** `Authorization: Bearer <token>`

Related: `REACT_INTEGRATION_OFFICER_FLOW.md`, `REACT_INTEGRATION_V2_FLOW.md`

---

## 1. Backend Setup

```bash
npm run db:migrate:020
npm run db:clear-tasks   # optional fresh test
npm run dev
```

---

## 2. Create Task — Multiple Assignees

### Preferred body
```json
POST /api/tasks
{
  "title": "Prepare briefing notes",
  "dept_id": 1,
  "assignee_ids": [8, 9, 10],
  "start_date": "2026-07-16",
  "end_date": "2026-07-30",
  "priority": "high"
}
```

### Still supported (single)
```json
{ "assigned_to": 8, ... }
```

Ya array:
```json
{ "assigned_to": [8, 9], ... }
```

**Rules (same as before):**
- Same department
- Lower grade than creator (officers)
- Worker/officer roles only

---

## 3. Response Shape Changes

### List / Detail — new `assignees` array
```json
{
  "id": 12,
  "title": "Prepare briefing notes",
  "completion_percentage": 40,
  "status": "in_progress",
  "assignee": { "id": 8, "full_name": "Fatima Noor", "role_name": "officer" },
  "assignees": [
    {
      "id": 8,
      "full_name": "Fatima Noor",
      "role_name": "officer",
      "grade_name": "BPS-16",
      "completion_percentage": 50
    },
    {
      "id": 10,
      "full_name": "Hassan Raza",
      "role_name": "officer",
      "grade_name": "BPS-14",
      "completion_percentage": 30
    }
  ]
}
```

| Field | Meaning |
|-------|---------|
| `assignees[]` | **Use this** — sab assignees + unka personal % |
| `assignee` | Backward compatible — pehla assignee |
| `completion_percentage` | Task **overall** (average) |

### Submit update response (extra fields)
```json
{
  "id": 5,
  "completion_percentage": 50,
  "is_submitted": true,
  "my_progress": 50,
  "task_overall_percentage": 40,
  "task_status": "in_progress"
}
```

---

## 4. Progress Rules

| Rule | Behavior |
|------|----------|
| Who can update | Sirf jo `assignees` mein hai |
| Personal % | Har bande ka apna; dusre pe asar nahi |
| % only goes up | Per-user (apni last value se kam nahi) |
| Task overall | `AVG(assignees.completion_percentage)` |
| Task completed | Jab **sab** assignees 100% |

Example:
- Fatima → 50%
- Hassan → 30%
- Overall → **40%**
- Status → `in_progress` until both 100%

---

## 5. TypeScript Types

```typescript
export interface TaskAssignee {
  id: number;
  full_name: string;
  email?: string;
  role_name: string;
  grade_name: string | null;
  grade_level: number | null;
  completion_percentage: number;
  updated_at?: string;
}

export interface TaskListItem {
  id: number;
  title: string;
  completion_percentage: number; // overall average
  status: string;
  assignee: { id: number; full_name: string; role_name: string }; // first
  assignees: TaskAssignee[];
  // ...existing fields
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  dept_id: number;
  assignee_ids: number[];   // preferred
  // assigned_to?: number | number[];  // also ok
  start_date: string;
  end_date: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}
```

---

## 6. Frontend UI Checklist

### Create Task form
- [ ] Assignee dropdown → **multi-select**
- [ ] Send `assignee_ids: number[]`
- [ ] Show selected chips: `Fatima Noor (BPS-16)`, `Hassan Raza (BPS-14)`

### Tasks list
- [ ] "Assigned To" column: show **all names** (comma / avatars), not just one
- [ ] Progress column = **overall** `%`
- [ ] Optional tooltip: per-person breakdown

### Task detail
- [ ] **Assignees panel:**
  ```
  Fatima Noor     ████████░░  50%
  Hassan Raza     █████░░░░░  30%
  Overall                    40%
  ```
- [ ] Progress submit form: sirf tab dikhao jab `assignees.some(a => a.id === me.id)`
- [ ] Updates list: har update pe submitter name clearly dikhao

### My progress helper
```typescript
function myProgress(task: TaskListItem, userId: number): number | null {
  return task.assignees.find((a) => a.id === userId)?.completion_percentage ?? null;
}

function canSubmitProgress(task: TaskListItem, userId: number): boolean {
  return task.assignees.some((a) => a.id === userId);
}
```

### Visibility (unchanged)
- Officer: tasks jahan wo assignee **OR** creator hai
- Senior: all tasks

---

## 7. API Client Snippet

```typescript
export const createTask = (data: CreateTaskPayload) =>
  client.post('/tasks', data);

// Example
await createTask({
  title: 'Quarterly file',
  dept_id: 1,
  assignee_ids: [fatimaId, hassanId],
  start_date: '2026-07-16',
  end_date: '2026-07-30',
  priority: 'high',
});
```

Progress APIs same as M3:
```
POST   /tasks/:id/updates
PATCH  /tasks/:id/updates/:updateId/submit
```

---

## 8. Quick Test

1. Login `ahmed.khan@test.com`
2. Create task with `assignee_ids: [fatima, hassan]`
3. Login Fatima → submit 50%
4. Login Hassan → submit 30%
5. Detail pe dekho: Fatima 50, Hassan 30, overall ~40
6. Ahmed (creator) dono dikhengi; Fatima sirf apni assigned list mein ye task

---

## Frontend ko short message

> Multi-assignee live hai.
> Create pe `assignee_ids: number[]` bhejo (multi-select).
> List/detail pe `assignees[]` use karo — har bande ka alag `completion_percentage`.
> Task `completion_percentage` overall average hai.
> Progress submit sirf apne assignee ke liye; personal % dusre ko change nahi karta.
> Doc: `REACT_INTEGRATION_MULTI_ASSIGNEE.md`
