# React Integration Guide — Milestone 3

> **Milestone 3 (Backend) — Done**
> Task CRUD, Kanban, Updates, Documents, Activity Trail APIs live hain.
> Pehle `REACT_INTEGRATION_M2.md` complete karo, phir ye follow karo.

**Base URL:** `http://localhost:5000/api`  
**Auth:** `Authorization: Bearer <token>`

---

## Table of Contents

1. [Kya Live Hai (M3)](#1-kya-live-hai-m3)
2. [Pehle Ye Karo](#2-pehle-ye-karo)
3. [Permission & Scoping Rules](#3-permission--scoping-rules)
4. [Live API Reference](#4-live-api-reference)
5. [TypeScript Types](#5-typescript-types)
6. [API Client Files](#6-api-client-files)
7. [React Pages & Components](#7-react-pages--components)
8. [Kanban Board](#8-kanban-board)
9. [Task Assignment Dropdown](#9-task-assignment-dropdown)
10. [File Upload](#10-file-upload)
11. [Activity Trail UI](#11-activity-trail-ui)
12. [Integration Checklist](#12-integration-checklist)

---

## 1. Kya Live Hai (M3)

| Module | Endpoints |
|--------|-----------|
| Tasks | `GET/POST /tasks`, `GET/PATCH /tasks/:id`, `PATCH /tasks/:id/status` |
| Kanban | `GET /tasks/kanban` |
| Updates | `GET/POST /tasks/:id/updates`, `PATCH .../submit`, `PATCH .../:updateId` |
| Documents | `GET/POST/DELETE /tasks/:id/documents` |
| Trail | `GET /tasks/:id/trail` (+ included in task detail) |
| Request Update | `POST /tasks/:id/request-update` |

**File uploads:** `multipart/form-data`, field name `files` (max 5, 10MB each)  
**Static files:** `http://localhost:5000/uploads/tasks/:taskId/:filename`

---

## 2. Pehle Ye Karo

M2 se ye already hona chahiye:
- `src/api/client.ts` with JWT interceptor
- `AuthContext` with `permissions` array
- `ProtectedRoute` component

M3 ke liye extra packages (optional):
```bash
npm install @dnd-kit/core @dnd-kit/sortable   # kanban drag-drop (optional)
```

---

## 3. Permission & Scoping Rules

### Task list scoping (automatic server-side)

| Permission | Kya dikhega |
|------------|-------------|
| `task.view_all` | Saari org tasks (admin, super_admin) |
| `task.view_dept` | Sirf apne department ki tasks |
| `task.view_own` | Sirf `assigned_to = me` (owner) |

### Action permissions

| Action | Permission | Extra rule |
|--------|------------|------------|
| Create task | `task.create` | Hierarchy check on assign |
| Edit task | `task.create` | Creator ya admin/super_admin |
| Change status | `task.create` | Creator ya admin/super_admin |
| Submit update | `task.submit_update` | Sirf assignee |
| Request update | `task.request_update` | Senior → junior only |
| Upload document | — | Creator, assignee, ya admin |
| Delete document | `task.create` | Uploader ya admin |

### Hierarchy (assignment)

```
Higher rank (lower hierarchy_level) → junior ko assign kar sakta hai

task.assign_skip wale (minister, admin):
  → kisi bhi junior ko assign (skip levels OK)

Bina skip ke (as, js, etc.):
  → sirf exactly ONE level neeche

403 error: { "error": "Cannot assign task to equal or senior rank" }
```

### Status transitions

```
pending     → in_progress | cancelled
in_progress → completed   | cancelled
completed   → (locked)
cancelled   → (locked)
```

### Completion %

- Sirf **submitted** updates se change hota hai
- Percentage kabhi neeche nahi ja sakti
- 100% submit → auto `status = completed`

---

## 4. Live API Reference

### 4.1 `POST /tasks` — Create

**Permission:** `task.create`

**Body:**
```json
{
  "title": "Budget Review Q3",
  "description": "Review quarterly budget",
  "priority": "high",
  "dept_id": 1,
  "assigned_to": 4,
  "start_date": "2026-07-01",
  "end_date": "2026-07-31",
  "on_behalf_of": null
}
```

- `priority`: `low` | `medium` | `high` | `critical` (default: medium)
- `on_behalf_of`: optional, **sirf admin/super_admin** set kar sakte hain
- Assignee same department mein hona chahiye

**Success 201:**
```json
{
  "id": 1,
  "title": "Budget Review Q3",
  "status": "pending",
  "completion_percentage": 0,
  "assignee": { "id": 4, "full_name": "Secretary", "role_name": "secretary", "email": "..." },
  "creator": { "id": 3, "full_name": "Minister Test", "role_name": "minister" },
  "dept": { "id": 1, "name": "Administration" }
}
```

---

### 4.2 `GET /tasks` — List (paginated)

**Permission:** view scoping automatic

**Query params:**

| Param | Example |
|-------|---------|
| `page` | `1` |
| `page_size` | `20` |
| `status` | `pending` |
| `priority` | `high` |
| `dept_id` | `1` |
| `assigned_to` | `5` |
| `created_by` | `3` |
| `date_from` | `2026-07-01` |
| `date_to` | `2026-07-31` |
| `search` | `budget` |

**Response:**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Budget Review Q3",
      "priority": "high",
      "status": "pending",
      "completion_percentage": 0,
      "start_date": "2026-07-01",
      "end_date": "2026-07-31",
      "created_at": "2026-07-13T10:00:00.000Z",
      "assignee": { "id": 4, "full_name": "Secretary", "role_name": "secretary" },
      "creator": { "id": 3, "full_name": "Minister Test", "role_name": "minister" },
      "dept": { "id": 1, "name": "Administration" },
      "latest_update": null
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "summary": { "pending": 1, "in_progress": 0, "completed": 0, "cancelled": 0 }
}
```

---

### 4.3 `GET /tasks/kanban` — Kanban board

**Same scoping as list.** Optional same filters as `GET /tasks`.

**Response:**
```json
{
  "pending": [
    {
      "id": 1,
      "title": "Budget Review Q3",
      "priority": "high",
      "completion_percentage": 0,
      "assignee_name": "Secretary",
      "end_date": "2026-07-31",
      "update_count": 0
    }
  ],
  "in_progress": [],
  "completed": [],
  "cancelled": []
}
```

---

### 4.4 `GET /tasks/:id` — Full detail

**Response includes:** task fields + assignee + creator + on_behalf_of_user + dept + documents + updates + activity_trail

```json
{
  "id": 1,
  "title": "Budget Review Q3",
  "description": "...",
  "priority": "high",
  "status": "pending",
  "completion_percentage": 0,
  "start_date": "2026-07-01",
  "end_date": "2026-07-31",
  "assignee": { "id": 4, "full_name": "Secretary", "role_name": "secretary", "email": "secretary@test.com" },
  "creator": { "id": 3, "full_name": "Minister Test", "role_name": "minister" },
  "on_behalf_of_user": null,
  "dept": { "id": 1, "name": "Administration" },
  "documents": [],
  "updates": [],
  "activity_trail": [
    {
      "id": 1,
      "action": "task_created",
      "actor": { "id": 3, "full_name": "Minister Test", "role_name": "minister" },
      "details": { "title": "Budget Review Q3", "assigned_to": 4, "priority": "high" },
      "created_at": "2026-07-13T10:00:00.000Z"
    }
  ]
}
```

---

### 4.5 `PATCH /tasks/:id` — Edit

**Permission:** `task.create` + creator/admin  
**Cannot edit:** completed/cancelled tasks  
**Editable:** `title`, `description`, `priority`, `end_date`  
**Immutable:** `dept_id`, `assigned_to`, `created_by`

---

### 4.6 `PATCH /tasks/:id/status`

**Body:** `{ "status": "in_progress" }`

---

### 4.7 `POST /tasks/:id/request-update`

**Permission:** `task.request_update`  
Senior junior se update maang sakta hai.

**Response:** `{ "message": "Update requested, assignee notified" }`

---

### 4.8 Task Updates

#### `POST /tasks/:id/updates` — Create draft

**Permission:** `task.submit_update` — sirf assignee

**Body:**
```json
{ "update_text": "Completed initial review", "completion_percentage": 25 }
```

**Response 201:** draft with `is_submitted: false`

#### `PATCH /tasks/:id/updates/:updateId` — Edit draft

Sirf draft (`is_submitted = 0`). Submitted = locked.

**Error 400:** `{ "error": "Submitted updates cannot be edited" }`

#### `PATCH /tasks/:id/updates/:updateId/submit` — Submit

- Locks update permanently
- Updates `tasks.completion_percentage`
- 100% → auto `status = completed`
- Notifies task creator

---

### 4.9 Documents

#### `POST /tasks/:id/documents`

**Content-Type:** `multipart/form-data`  
**Field:** `files` (array, max 5)

Allowed: `.pdf`, `.doc`, `.docx`, `.png`, `.jpg`, `.jpeg`, `.xlsx`

**Response:**
```json
{
  "uploaded": [
    { "id": 1, "file_url": "/uploads/tasks/1/1720000000-123.pdf", "original_filename": "report.pdf" }
  ]
}
```

**Full URL:** `http://localhost:5000/uploads/tasks/1/1720000000-123.pdf`

#### `DELETE /tasks/:id/documents/:docId`

**Permission:** `task.create` + uploader ya admin

---

### 4.10 `GET /tasks/:id/trail`

Complete activity log (immutable, append-only).

**Activity actions:**
`task_created` | `task_assigned` | `task_updated` | `update_submitted` | `update_requested` | `status_changed` | `document_uploaded` | `document_deleted`

---

## 5. TypeScript Types

Add to `src/types/tasks.ts`:

```typescript
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type ActivityAction =
  | 'task_created' | 'task_assigned' | 'task_updated'
  | 'update_submitted' | 'update_requested' | 'status_changed'
  | 'document_uploaded' | 'document_deleted';

export interface TaskUserRef {
  id: number;
  full_name: string;
  role_name: string;
  email?: string;
}

export interface TaskListItem {
  id: number;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  completion_percentage: number;
  start_date: string;
  end_date: string;
  created_at: string;
  assignee: TaskUserRef;
  creator: TaskUserRef;
  dept: { id: number; name: string };
  latest_update: { update_text: string; submitted_at: string } | null;
}

export interface TaskListResponse {
  tasks: TaskListItem[];
  total: number;
  page: number;
  page_size: number;
  summary: Record<TaskStatus, number>;
}

export interface KanbanTask {
  id: number;
  title: string;
  priority: TaskPriority;
  completion_percentage: number;
  assignee_name: string;
  end_date: string;
  update_count: number;
}

export interface KanbanResponse {
  pending: KanbanTask[];
  in_progress: KanbanTask[];
  completed: KanbanTask[];
  cancelled: KanbanTask[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dept_id: number;
  assigned_to: number;
  start_date: string;
  end_date: string;
  on_behalf_of?: number;
}

export interface TaskUpdate {
  id: number;
  update_text: string;
  completion_percentage: number;
  is_submitted: boolean;
  submitted_at: string | null;
  created_at: string;
  submitted_by: TaskUserRef;
}

export interface TaskDocument {
  id: number;
  file_url: string;
  original_filename: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by_name?: string;
}

export interface ActivityTrailEntry {
  id: number;
  action: ActivityAction;
  actor: TaskUserRef;
  details: Record<string, unknown>;
  created_at: string;
}

export interface TaskDetail {
  id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completion_percentage: number;
  start_date: string;
  end_date: string;
  assignee: TaskUserRef;
  creator: TaskUserRef;
  on_behalf_of_user: { id: number; full_name: string } | null;
  dept: { id: number; name: string };
  documents: TaskDocument[];
  updates: TaskUpdate[];
  activity_trail: ActivityTrailEntry[];
}
```

---

## 6. API Client Files

### `src/api/tasks.ts`

```typescript
import apiClient from './client';
import type {
  TaskListResponse, KanbanResponse, TaskDetail,
  CreateTaskRequest, TaskStatus, TaskUpdate,
} from '../types/tasks';

export interface TaskListParams {
  page?: number;
  page_size?: number;
  status?: TaskStatus;
  priority?: string;
  dept_id?: number;
  assigned_to?: number;
  created_by?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export async function getTasks(params?: TaskListParams) {
  const { data } = await apiClient.get<TaskListResponse>('/tasks', { params });
  return data;
}

export async function getKanban(params?: TaskListParams) {
  const { data } = await apiClient.get<KanbanResponse>('/tasks/kanban', { params });
  return data;
}

export async function getTask(id: number) {
  const { data } = await apiClient.get<TaskDetail>(`/tasks/${id}`);
  return data;
}

export async function createTask(payload: CreateTaskRequest) {
  const { data } = await apiClient.post(`/tasks`, payload);
  return data;
}

export async function updateTask(id: number, payload: Partial<CreateTaskRequest>) {
  const { data } = await apiClient.patch(`/tasks/${id}`, payload);
  return data;
}

export async function updateTaskStatus(id: number, status: TaskStatus) {
  const { data } = await apiClient.patch(`/tasks/${id}/status`, { status });
  return data;
}

export async function requestTaskUpdate(id: number) {
  const { data } = await apiClient.post(`/tasks/${id}/request-update`);
  return data;
}

export async function getTaskTrail(id: number) {
  const { data } = await apiClient.get(`/tasks/${id}/trail`);
  return data;
}

// Updates
export async function getTaskUpdates(taskId: number) {
  const { data } = await apiClient.get<TaskUpdate[]>(`/tasks/${taskId}/updates`);
  return data;
}

export async function createTaskUpdate(taskId: number, update_text: string, completion_percentage: number) {
  const { data } = await apiClient.post(`/tasks/${taskId}/updates`, { update_text, completion_percentage });
  return data;
}

export async function editTaskUpdate(taskId: number, updateId: number, payload: { update_text?: string; completion_percentage?: number }) {
  const { data } = await apiClient.patch(`/tasks/${taskId}/updates/${updateId}`, payload);
  return data;
}

export async function submitTaskUpdate(taskId: number, updateId: number) {
  const { data } = await apiClient.patch(`/tasks/${taskId}/updates/${updateId}/submit`);
  return data;
}

// Documents
export async function getTaskDocuments(taskId: number) {
  const { data } = await apiClient.get(`/tasks/${taskId}/documents`);
  return data;
}

export async function uploadTaskDocuments(taskId: number, files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  const { data } = await apiClient.post(`/tasks/${taskId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteTaskDocument(taskId: number, docId: number) {
  const { data } = await apiClient.delete(`/tasks/${taskId}/documents/${docId}`);
  return data;
}

export function getFileUrl(fileUrl: string) {
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${base}${fileUrl}`;
}
```

---

## 7. React Pages & Components

### Routes to add

```tsx
<Route path="/tasks" element={<ProtectedRoute><TaskList /></ProtectedRoute>} />
<Route path="/tasks/kanban" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
<Route path="/tasks/new" element={
  <ProtectedRoute permission="task.create"><CreateTask /></ProtectedRoute>
} />
<Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
```

### Sidebar links (permission-based)

```tsx
const { hasPermission, hasAnyPermission } = useAuth();

const taskNav = [
  { label: 'All Tasks', path: '/tasks', show: hasPermission('task.view_all') },
  { label: 'Dept Tasks', path: '/tasks', show: hasPermission('task.view_dept') },
  { label: 'My Tasks', path: '/tasks?scope=own', show: hasPermission('task.view_own') },
  { label: 'Kanban', path: '/tasks/kanban', show: hasAnyPermission('task.view_all', 'task.view_dept', 'task.view_own') },
  { label: 'Create Task', path: '/tasks/new', show: hasPermission('task.create') },
].filter((i) => i.show);
```

### Pages to build

| Page | Key APIs |
|------|----------|
| TaskList | `GET /tasks` + filters + pagination |
| KanbanBoard | `GET /tasks/kanban` |
| CreateTask | `POST /tasks`, `GET /users/dropdown`, `GET /departments` |
| TaskDetail | `GET /tasks/:id` |
| SubmitUpdate (modal) | `POST/PATCH/submit updates` |
| DocumentUpload | `POST /tasks/:id/documents` |
| ActivityTimeline | `activity_trail` from detail |

---

## 8. Kanban Board

### Simple column layout (no drag-drop)

```tsx
import { getKanban } from '../api/tasks';
import type { KanbanResponse, TaskStatus } from '../types/tasks';

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: '#f59e0b' },
  { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { key: 'completed', label: 'Completed', color: '#22c55e' },
  { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];

export function KanbanBoard() {
  const [board, setBoard] = useState<KanbanResponse | null>(null);

  useEffect(() => {
    getKanban().then(setBoard);
  }, []);

  if (!board) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
      {COLUMNS.map((col) => (
        <div key={col.key} style={{ minWidth: 280, background: '#f8fafc', borderRadius: 8, padding: 12 }}>
          <h3 style={{ color: col.color }}>
            {col.label} ({board[col.key].length})
          </h3>
          {board[col.key].map((task) => (
            <div key={task.id} style={{ background: '#fff', padding: 12, marginBottom: 8, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <strong>{task.title}</strong>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {task.assignee_name} · {task.completion_percentage}% · Due {task.end_date}
              </div>
              <span style={{ fontSize: 11, padding: '2px 6px', background: col.color, color: '#fff', borderRadius: 4 }}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Status change via drag (optional)

`PATCH /tasks/:id/status` call karo jab card move ho — sirf creator/admin ke paas permission hogi.

---

## 9. Task Assignment Dropdown

Create Task form mein:

```tsx
import { getUserDropdown } from '../api/users';  // M2 API

const [assignees, setAssignees] = useState([]);

useEffect(() => {
  getUserDropdown().then(setAssignees);  // hierarchy-filtered list
}, []);

<select value={assignedTo} onChange={(e) => setAssignedTo(Number(e.target.value))}>
  <option value="">Select assignee</option>
  {assignees.map((u) => (
    <option key={u.id} value={u.id}>
      {u.full_name} ({u.role_name})
    </option>
  ))}
</select>
```

> Backend automatically filters — sirf junior rank users dikhenge.

---

## 10. File Upload

```tsx
async function handleUpload(taskId: number, files: FileList) {
  const fileArray = Array.from(files).slice(0, 5);
  const result = await uploadTaskDocuments(taskId, fileArray);
  console.log('Uploaded:', result.uploaded);
}

<input
  type="file"
  multiple
  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx"
  onChange={(e) => e.target.files && handleUpload(taskId, e.target.files)}
/>
```

Download link:
```tsx
<a href={getFileUrl(doc.file_url)} target="_blank" rel="noreferrer">
  {doc.original_filename}
</a>
```

---

## 11. Activity Trail UI

```tsx
const ACTION_LABELS: Record<string, string> = {
  task_created: 'Task created',
  task_assigned: 'Task assigned',
  task_updated: 'Task updated',
  update_submitted: 'Update submitted',
  update_requested: 'Update requested',
  status_changed: 'Status changed',
  document_uploaded: 'Document uploaded',
  document_deleted: 'Document deleted',
};

function ActivityTimeline({ trail }: { trail: ActivityTrailEntry[] }) {
  return (
    <div className="timeline">
      {trail.map((entry) => (
        <div key={entry.id} className="timeline-item">
          <div className="timeline-dot" />
          <div>
            <strong>{ACTION_LABELS[entry.action] || entry.action}</strong>
            <span> by {entry.actor.full_name} ({entry.actor.role_name})</span>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {new Date(entry.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 12. Integration Checklist

### Task List
- [ ] Paginated list with status/priority/search filters
- [ ] Summary badges (pending/in_progress/completed/cancelled)
- [ ] Role-based view (all/dept/own automatic)

### Kanban
- [ ] 4 columns from `GET /tasks/kanban`
- [ ] Task cards with priority badge + completion %
- [ ] Click card → navigate to `/tasks/:id`

### Create Task
- [ ] Form with dept dropdown (M2)
- [ ] Assignee dropdown (`GET /users/dropdown`)
- [ ] Date validation (end >= start)
- [ ] Error handling for hierarchy 403

### Task Detail
- [ ] Full task info
- [ ] Updates section (draft + submit flow)
- [ ] Documents upload/download
- [ ] Activity timeline
- [ ] Request Update button (`task.request_update`)

### Updates (assignee only)
- [ ] Create draft update
- [ ] Edit draft before submit
- [ ] Submit → locks update, updates completion %
- [ ] Show error if % goes backwards

### Documents
- [ ] Multi-file upload (max 5)
- [ ] File type validation client-side
- [ ] Download via `getFileUrl()`

---

## Copy Order

```
1. src/types/tasks.ts
2. src/api/tasks.ts
3. src/pages/TaskList.tsx
4. src/pages/KanbanBoard.tsx
5. src/pages/CreateTask.tsx
6. src/pages/TaskDetail.tsx
7. src/components/ActivityTimeline.tsx
8. src/components/SubmitUpdateModal.tsx
9. Update App.tsx routes + sidebar
```

Pehle TaskList test karo, phir CreateTask, phir TaskDetail.
