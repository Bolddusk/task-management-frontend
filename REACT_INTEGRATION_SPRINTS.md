# React Integration — Sprints

> **Backend live**
> Sprints = fixed time boxes (e.g. 2 weeks) jisme tasks group hote hain.  
> Tasks optional sprint se link ho sakti hain.  
> Board / list pe sprint filter + progress stats.

**Base URL:** `http://localhost:5000/api`  
**Auth:** `Authorization: Bearer <token>`

---

## 1. Setup

```bash
npm run db:migrate:021
npm run db:seed          # adds sample sprint + sprint.manage permission
npm run dev
```

Re-login after seed.

---

## 2. Concept (UI language)

| Term | Meaning |
|------|---------|
| Sprint | Named cycle with `start_date` → `end_date` |
| Status | `planned` → `active` → `completed` |
| Goal | Optional one-line target |
| Stats | Task counts + avg completion (scoped to viewer) |

```
Sprint 1 (14–28 Jul) [active]
  ├── Task A  40%
  ├── Task B  100%
  └── Stats: 2 tasks, avg 70%
```

---

## 3. Permissions

| Action | Who |
|--------|-----|
| List / view sprints | Any logged-in user |
| Create / edit sprint | `sprint.manage` **OR** `task.create` (admin + officers) |
| Add/remove tasks | Same |
| Seniors | Can view all; cannot create (no `task.create`) unless you grant them |

```typescript
const canManageSprints =
  permissions.includes('sprint.manage') || permissions.includes('task.create');
```

---

## 4. APIs

### List sprints
```
GET /api/sprints
GET /api/sprints?status=active
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Sprint 1 — July 2026",
    "goal": "Complete priority administration files",
    "start_date": "2026-07-14",
    "end_date": "2026-07-28",
    "status": "active",
    "created_by": { "id": 2, "full_name": "Admin User" },
    "stats": {
      "total_tasks": 3,
      "completed_tasks": 1,
      "in_progress_tasks": 2,
      "pending_tasks": 0,
      "cancelled_tasks": 0,
      "avg_completion": 45
    }
  }
]
```

> `stats` viewer-scoped hain: officer sirf apni visible tasks count karega; senior/admin sab.

### Get one
```
GET /api/sprints/:id
```

### Create
```
POST /api/sprints
{
  "name": "Sprint 2 — August",
  "goal": "Clear backlog files",
  "start_date": "2026-07-29",
  "end_date": "2026-08-11",
  "status": "planned"
}
```

### Update (edit or change status)
```
PATCH /api/sprints/:id
{ "status": "active" }

PATCH /api/sprints/:id
{ "name": "Sprint 2", "goal": "..." }
```

### Add existing tasks to sprint
```
POST /api/sprints/:id/tasks
{ "task_ids": [10, 11, 12] }
```

### Remove task from sprint
```
DELETE /api/sprints/:id/tasks/:taskId
```

---

## 5. Tasks + Sprint

### Create task with sprint
```json
POST /api/tasks
{
  "title": "...",
  "dept_id": 1,
  "assignee_ids": [8, 9],
  "sprint_id": 1,
  "start_date": "2026-07-16",
  "end_date": "2026-07-25"
}
```

### Move / unlink via task edit
```json
PATCH /api/tasks/:id
{ "sprint_id": 2 }

PATCH /api/tasks/:id
{ "sprint_id": null }
```

### Filter tasks by sprint
```
GET /api/tasks?sprint_id=1
GET /api/tasks?sprint_id=none    # backlog (no sprint)
GET /api/tasks/kanban?sprint_id=1
```

### Task response includes
```json
{
  "sprint": {
    "id": 1,
    "name": "Sprint 1 — July 2026",
    "status": "active",
    "start_date": "2026-07-14",
    "end_date": "2026-07-28"
  }
}
```
`sprint: null` if backlog.

---

## 6. TypeScript

```typescript
export type SprintStatus = 'planned' | 'active' | 'completed';

export interface SprintStats {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  cancelled_tasks: number;
  avg_completion: number;
}

export interface Sprint {
  id: number;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  created_by: { id: number; full_name: string };
  stats?: SprintStats;
}

export interface SprintRef {
  id: number;
  name: string;
  status: SprintStatus;
  start_date: string;
  end_date: string;
}
```

---

## 7. Frontend UI Checklist

- [ ] Sidebar: **Sprints** page (list cards with status badge + stats)
- [ ] Create Sprint modal (name, goal, dates, status)
- [ ] Sprint detail: tasks table filtered `?sprint_id=X` + progress bar (`avg_completion`)
- [ ] Tasks page: sprint dropdown filter (All / Active sprint / Backlog)
- [ ] Create Task: optional Sprint select
- [ ] Task detail: sprint chip + “Move to sprint” / “Remove from sprint”
- [ ] Kanban: respect `sprint_id` query
- [ ] Hide create/edit for seniors without permission

### Suggested labels
```typescript
const SPRINT_STATUS_LABEL: Record<SprintStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed',
};
```

---

## 8. Sample seed data

| Name | Status | Dates |
|------|--------|-------|
| Sprint 1 — July 2026 | active | 14–28 Jul 2026 |

Password: `Password@123`  
Create tasks as `ahmed.khan@test.com` with `sprint_id: 1`.

---

## 9. Frontend message (copy-paste)

> Sprints module live hai.
>
> APIs: `GET/POST /api/sprints`, `PATCH /api/sprints/:id`,  
> `POST /api/sprints/:id/tasks`, `DELETE /api/sprints/:id/tasks/:taskId`
>
> Tasks: create/update pe `sprint_id`, filter `GET /tasks?sprint_id=1` ya `none` for backlog.
> Response pe `sprint: { id, name, status, dates }` aata hai.
>
> Officers/admin create kar sakte hain (`task.create` / `sprint.manage`).  
> Doc: `REACT_INTEGRATION_SPRINTS.md`
