# React Integration Guide — Milestone 4

> **Milestone 4 (Backend) — Done**
> Export (CSV/Excel/PDF) + Reports (Summary, Overdue, User/Dept) APIs live hain.
> Pehle `REACT_INTEGRATION_M3.md` complete karo, phir ye follow karo.

**Base URL:** `http://localhost:5000/api`  
**Auth:** `Authorization: Bearer <token>`

---

## Table of Contents

1. [Kya Live Hai (M4)](#1-kya-live-hai-m4)
2. [Pehle Ye Karo](#2-pehle-ye-karo)
3. [Permission Rules](#3-permission-rules)
4. [Export APIs](#4-export-apis)
5. [Report APIs](#5-report-apis)
6. [TypeScript Types](#6-typescript-types)
7. [API Client Files](#7-api-client-files)
8. [React Pages & Components](#8-react-pages--components)
9. [Dashboard Widgets](#9-dashboard-widgets)
10. [Export Download Flow](#10-export-download-flow)
11. [Integration Checklist](#11-integration-checklist)

---

## 1. Kya Live Hai (M4)

| Module | Endpoints |
|--------|-----------|
| Exports | `POST /exports`, `GET /exports`, `GET /exports/:id/download` |
| Reports | `GET /reports/summary`, `GET /reports/overdue` |
| Reports | `GET /reports/user/:userId`, `GET /reports/dept/:deptId` |

**Formats:** `csv` | `xlsx` | `pdf`  
**Processing:** Synchronous — file turant ready milta hai (`status: 'done'`)

---

## 2. Pehle Ye Karo

M2 + M3 se ye hona chahiye:
- Auth + permissions working
- Task list/kanban pages

M4 ke liye koi extra package nahi chahiye — browser download ke liye axios `responseType: 'blob'` use karo.

---

## 3. Permission Rules

### Export types

| export_type | Required permission |
|-------------|-------------------|
| `my_tasks` | `task.export` |
| `dept_tasks` | `task.export` + `task.view_dept` (or view_all) |
| `all_tasks` | `task.export` + `task.view_all` |
| `user_report` | `report.view_all` |
| `dept_report` | `report.view_all` OR `report.view_own` |
| `audit_trail` | admin/super_admin only |

> `POST /exports` middleware: `task.export` required.  
> `user_report` / `audit_trail` ke liye extra check controller mein hota hai.

### Reports

| Endpoint | Permission |
|----------|------------|
| `GET /reports/summary` | Auto-scoped by role |
| `GET /reports/overdue` | `task.view_dept` minimum |
| `GET /reports/user/:id` | `report.view_all` |
| `GET /reports/dept/:id` | `report.view_all` OR dept member |

### Summary response shape (role-based)

| Role type | Response keys |
|-----------|---------------|
| admin/super_admin | `total_tasks`, `by_status`, `by_priority`, `completion_rate`, `overdue_tasks`, `tasks_by_dept`, `tasks_by_user`, `recent_activity` |
| dept roles | `dept_tasks`, `by_status`, `overdue_tasks`, `my_assigned_tasks`, `completion_rate`, `recent_activity` |
| owner | `my_tasks`, `by_status`, `overdue_tasks`, `avg_completion`, `recent_activity` |

---

## 4. Export APIs

### `POST /exports` — Create export

**Permission:** `task.export` (+ type-specific checks)

**Body:**
```json
{
  "export_type": "all_tasks",
  "format": "xlsx",
  "filters": {
    "dept_id": 1,
    "user_id": 5,
    "status": "pending",
    "priority": "high",
    "date_from": "2026-07-01",
    "date_to": "2026-07-31"
  }
}
```

**export_type values:**
`my_tasks` | `dept_tasks` | `all_tasks` | `user_report` | `dept_report` | `audit_trail`

**format values:** `csv` | `xlsx` | `pdf`

**Success 201:**
```json
{
  "job_id": 1,
  "file_url": "/uploads/exports/1/all_tasks_1783920248599.xlsx",
  "status": "done"
}
```

**Error 500:**
```json
{ "success": false, "message": "Export failed reason..." }
```

---

### `GET /exports` — Export history

**Returns:** last 20 jobs of current user

```json
[
  {
    "id": 1,
    "export_type": "all_tasks",
    "format": "xlsx",
    "status": "done",
    "file_url": "/uploads/exports/1/all_tasks_1783920248599.xlsx",
    "created_at": "2026-07-13T10:24:00.000Z",
    "completed_at": "2026-07-13T10:24:01.000Z"
  }
]
```

**status values:** `pending` | `processing` | `done` | `failed`

---

### `GET /exports/:id/download` — Download file

**Access:** job owner OR admin/super_admin

**Response:** File stream with header:
```
Content-Disposition: attachment; filename="export_all_tasks_1.xlsx"
```

**Direct URL (alternative):**
```
http://localhost:5000/uploads/exports/1/all_tasks_1783920248599.xlsx
```
> Download endpoint preferred — permission check hota hai.

---

## 5. Report APIs

### `GET /reports/summary` — Dashboard stats

**No extra permission** — auto-scoped by role.

**Admin response example:**
```json
{
  "total_tasks": 15,
  "by_status": { "pending": 5, "in_progress": 4, "completed": 5, "cancelled": 1 },
  "by_priority": { "low": 2, "medium": 8, "high": 4, "critical": 1 },
  "completion_rate": "33%",
  "overdue_tasks": 2,
  "tasks_by_dept": [
    { "dept_name": "Administration", "total": 10, "completed": 4 }
  ],
  "tasks_by_user": [
    { "full_name": "Secretary", "role_name": "secretary", "assigned": 5, "completed": 2 }
  ],
  "recent_activity": [
    {
      "id": 5,
      "task_id": 1,
      "action": "task_created",
      "actor_name": "Minister Test",
      "actor_role": "minister",
      "details": { "title": "Budget Review" },
      "created_at": "2026-07-13T10:00:00.000Z"
    }
  ]
}
```

**Owner response example:**
```json
{
  "my_tasks": 3,
  "by_status": { "pending": 1, "in_progress": 1, "completed": 1, "cancelled": 0 },
  "overdue_tasks": 0,
  "avg_completion": "45%",
  "recent_activity": [...]
}
```

---

### `GET /reports/overdue` — Overdue tasks

**Permission:** `task.view_dept` minimum (role-scoped)

```json
[
  {
    "id": 2,
    "title": "Late Report",
    "priority": "high",
    "status": "in_progress",
    "completion_percentage": 30,
    "start_date": "2026-06-01",
    "end_date": "2026-06-30",
    "days_overdue": 13,
    "assignee": { "full_name": "Secretary", "role_name": "secretary" },
    "dept": { "name": "Administration" }
  }
]
```

---

### `GET /reports/user/:userId` — User performance

**Permission:** `report.view_all`

```json
{
  "user": { "id": 4, "full_name": "Secretary", "role_name": "secretary" },
  "total_assigned": 8,
  "completed": 3,
  "in_progress": 2,
  "pending": 2,
  "cancelled": 1,
  "avg_completion_percentage": 52.5,
  "overdue": 1,
  "tasks": [
    { "id": 1, "title": "...", "status": "pending", "priority": "high", "completion_percentage": 0 }
  ]
}
```

---

### `GET /reports/dept/:deptId` — Department report

**Permission:** `report.view_all` OR user is dept member

```json
{
  "department": { "id": 1, "name": "Administration" },
  "by_user": [
    {
      "user": { "id": 4, "full_name": "Secretary", "role_name": "secretary" },
      "tasks_assigned": 5,
      "completed": 2,
      "avg_completion": 40
    }
  ],
  "tasks": [...]
}
```

---

## 6. TypeScript Types

Create `src/types/exports.ts`:

```typescript
export type ExportType =
  | 'my_tasks' | 'dept_tasks' | 'all_tasks'
  | 'user_report' | 'dept_report' | 'audit_trail';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';
export type ExportStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface ExportFilters {
  dept_id?: number;
  user_id?: number;
  status?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
}

export interface CreateExportRequest {
  export_type: ExportType;
  format: ExportFormat;
  filters?: ExportFilters;
}

export interface ExportJob {
  id: number;
  export_type: ExportType;
  format: ExportFormat;
  status: ExportStatus;
  file_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface CreateExportResponse {
  job_id: number;
  file_url: string;
  status: 'done';
}

export interface ActivityEntry {
  id: number;
  task_id: number;
  action: string;
  actor_name: string;
  actor_role: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AdminSummary {
  total_tasks: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  completion_rate: string;
  overdue_tasks: number;
  tasks_by_dept: { dept_name: string; total: number; completed: number }[];
  tasks_by_user: { full_name: string; role_name: string; assigned: number; completed: number }[];
  recent_activity: ActivityEntry[];
}

export interface DeptSummary {
  dept_tasks: number;
  by_status: Record<string, number>;
  overdue_tasks: number;
  my_assigned_tasks: number;
  completion_rate: string;
  recent_activity: ActivityEntry[];
}

export interface OwnerSummary {
  my_tasks: number;
  by_status: Record<string, number>;
  overdue_tasks: number;
  avg_completion: string;
  recent_activity: ActivityEntry[];
}

export type ReportSummary = AdminSummary | DeptSummary | OwnerSummary;

export interface OverdueTask {
  id: number;
  title: string;
  priority: string;
  status: string;
  completion_percentage: number;
  days_overdue: number;
  assignee: { full_name: string; role_name: string };
  dept: { name: string };
}

export interface UserReport {
  user: { id: number; full_name: string; role_name: string };
  total_assigned: number;
  completed: number;
  in_progress: number;
  pending: number;
  cancelled: number;
  avg_completion_percentage: number;
  overdue: number;
  tasks: { id: number; title: string; status: string; priority: string; completion_percentage: number }[];
}

export interface DeptReport {
  department: { id: number; name: string };
  by_user: {
    user: { id: number; full_name: string; role_name: string };
    tasks_assigned: number;
    completed: number;
    avg_completion: number;
  }[];
  tasks: { id: number; title: string; status: string; priority: string; completion_percentage: number; assignee_name: string }[];
}
```

---

## 7. API Client Files

### `src/api/exports.ts`

```typescript
import apiClient from './client';
import type { CreateExportRequest, CreateExportResponse, ExportJob } from '../types/exports';

export async function createExport(payload: CreateExportRequest) {
  const { data } = await apiClient.post<CreateExportResponse>('/exports', payload);
  return data;
}

export async function getExportHistory() {
  const { data } = await apiClient.get<ExportJob[]>('/exports');
  return data;
}

export async function downloadExport(jobId: number, filename?: string) {
  const response = await apiClient.get(`/exports/${jobId}/download`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `export_${jobId}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function getExportFileUrl(fileUrl: string) {
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${base}${fileUrl}`;
}
```

### `src/api/reports.ts`

```typescript
import apiClient from './client';
import type { ReportSummary, OverdueTask, UserReport, DeptReport } from '../types/exports';

export async function getReportSummary() {
  const { data } = await apiClient.get<ReportSummary>('/reports/summary');
  return data;
}

export async function getOverdueTasks() {
  const { data } = await apiClient.get<OverdueTask[]>('/reports/overdue');
  return data;
}

export async function getUserReport(userId: number) {
  const { data } = await apiClient.get<UserReport>(`/reports/user/${userId}`);
  return data;
}

export async function getDeptReport(deptId: number) {
  const { data } = await apiClient.get<DeptReport>(`/reports/dept/${deptId}`);
  return data;
}
```

---

## 8. React Pages & Components

### Routes to add

```tsx
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
<Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
<Route path="/reports/user/:userId" element={
  <ProtectedRoute permission="report.view_all"><UserReportPage /></ProtectedRoute>
} />
<Route path="/reports/dept/:deptId" element={
  <ProtectedRoute><DeptReportPage /></ProtectedRoute>
} />
<Route path="/exports" element={
  <ProtectedRoute permission="task.export"><ExportsPage /></ProtectedRoute>
} />
```

### Sidebar links

```tsx
const reportNav = [
  { label: 'Dashboard', path: '/dashboard', show: true },
  { label: 'Reports', path: '/reports', show: hasAnyPermission('report.view_all', 'report.view_own') },
  { label: 'Exports', path: '/exports', show: hasPermission('task.export') },
].filter((i) => i.show);
```

---

## 9. Dashboard Widgets

### Summary cards (role-aware)

```tsx
import { getReportSummary } from '../api/reports';
import { useAuth } from '../context/AuthContext';

export function Dashboard() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const { hasPermission } = useAuth();

  useEffect(() => { getReportSummary().then(setSummary); }, []);

  if (!summary) return <div>Loading...</div>;

  const isAdmin = hasPermission('task.view_all');

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stats-grid">
        {isAdmin && 'total_tasks' in summary && (
          <>
            <StatCard label="Total Tasks" value={summary.total_tasks} />
            <StatCard label="Completion Rate" value={summary.completion_rate} />
            <StatCard label="Overdue" value={summary.overdue_tasks} color="red" />
          </>
        )}
        {!isAdmin && 'my_tasks' in summary && (
          <>
            <StatCard label="My Tasks" value={summary.my_tasks} />
            <StatCard label="Avg Completion" value={summary.avg_completion} />
            <StatCard label="Overdue" value={summary.overdue_tasks} color="red" />
          </>
        )}
        {!isAdmin && 'dept_tasks' in summary && (
          <>
            <StatCard label="Dept Tasks" value={summary.dept_tasks} />
            <StatCard label="My Assigned" value={summary.my_assigned_tasks} />
            <StatCard label="Completion Rate" value={summary.completion_rate} />
          </>
        )}
      </div>

      {/* Status breakdown chart */}
      <StatusChart byStatus={summary.by_status} />

      {/* Recent activity */}
      <RecentActivityList activities={summary.recent_activity} />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ padding: 20, background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: 13, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || '#1e293b' }}>{value}</div>
    </div>
  );
}
```

### Status breakdown (simple bars)

```tsx
function StatusChart({ byStatus }: { byStatus: Record<string, number> }) {
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0) || 1;
  const colors: Record<string, string> = {
    pending: '#f59e0b', in_progress: '#3b82f6', completed: '#22c55e', cancelled: '#ef4444',
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Tasks by Status</h3>
      {Object.entries(byStatus).map(([status, count]) => (
        <div key={status} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>{status}</span><span>{count}</span>
          </div>
          <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4 }}>
            <div style={{
              width: `${(count / total) * 100}%`, height: '100%',
              background: colors[status], borderRadius: 4,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 10. Export Download Flow

### Export form component

```tsx
import { createExport, downloadExport } from '../api/exports';
import type { ExportType, ExportFormat } from '../types/exports';

export function ExportForm() {
  const [exportType, setExportType] = useState<ExportType>('my_tasks');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await createExport({ export_type: exportType, format, filters: {} });
      await downloadExport(result.job_id, `${exportType}.${format === 'xlsx' ? 'xlsx' : format}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Export Data</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <label>Export Type</label>
      <select value={exportType} onChange={(e) => setExportType(e.target.value as ExportType)}>
        <option value="my_tasks">My Tasks</option>
        <option value="dept_tasks">Department Tasks</option>
        <option value="all_tasks">All Tasks</option>
        <option value="user_report">User Report</option>
        <option value="dept_report">Department Report</option>
        <option value="audit_trail">Audit Trail</option>
      </select>

      <label>Format</label>
      <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
        <option value="xlsx">Excel (.xlsx)</option>
        <option value="csv">CSV</option>
        <option value="pdf">PDF</option>
      </select>

      <button onClick={handleExport} disabled={loading}>
        {loading ? 'Generating...' : 'Download Export'}
      </button>
    </div>
  );
}
```

### Export history table

```tsx
import { getExportHistory, downloadExport } from '../api/exports';

export function ExportHistory() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);

  useEffect(() => { getExportHistory().then(setJobs); }, []);

  return (
    <table>
      <thead>
        <tr><th>Type</th><th>Format</th><th>Status</th><th>Date</th><th></th></tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.id}>
            <td>{job.export_type}</td>
            <td>{job.format}</td>
            <td>{job.status}</td>
            <td>{new Date(job.created_at).toLocaleString()}</td>
            <td>
              {job.status === 'done' && (
                <button onClick={() => downloadExport(job.id)}>
                  Download
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Permission-based export type options

```tsx
const { hasPermission, user } = useAuth();

const exportOptions = [
  { value: 'my_tasks', label: 'My Tasks', show: hasPermission('task.export') },
  { value: 'dept_tasks', label: 'Dept Tasks', show: hasPermission('task.view_dept') },
  { value: 'all_tasks', label: 'All Tasks', show: hasPermission('task.view_all') },
  { value: 'user_report', label: 'User Report', show: hasPermission('report.view_all') },
  { value: 'dept_report', label: 'Dept Report', show: hasAnyPermission('report.view_all', 'report.view_own') },
  { value: 'audit_trail', label: 'Audit Trail', show: user?.role_name === 'super_admin' || user?.role_name === 'admin' },
].filter((o) => o.show);
```

---

## 11. Integration Checklist

### Dashboard (`/dashboard`)
- [ ] `GET /reports/summary` on load
- [ ] Role-aware stat cards (admin vs dept vs owner)
- [ ] Status breakdown chart
- [ ] Recent activity list
- [ ] Overdue count badge

### Reports page (`/reports`)
- [ ] Overdue tasks table (`GET /reports/overdue`)
- [ ] Link to user report (admin only)
- [ ] Link to dept report

### User report (`/reports/user/:id`)
- [ ] User stats cards
- [ ] Task list with status badges
- [ ] Only visible with `report.view_all`

### Dept report (`/reports/dept/:id`)
- [ ] Per-user breakdown table
- [ ] Dept task list

### Exports page (`/exports`)
- [ ] Export form (type + format + filters)
- [ ] Permission-filtered export type dropdown
- [ ] Download on success
- [ ] Export history table
- [ ] Re-download from history

### Dashboard integration with M3
- [ ] Overdue tasks link → `/tasks?status=...`
- [ ] Recent activity click → `/tasks/:taskId`
- [ ] Export button on task list page (quick export with current filters)

---

## Copy Order

```
1. src/types/exports.ts
2. src/api/exports.ts
3. src/api/reports.ts
4. src/pages/Dashboard.tsx
5. src/pages/Reports.tsx
6. src/pages/ExportsPage.tsx
7. src/components/ExportForm.tsx
8. src/components/ExportHistory.tsx
9. src/components/StatusChart.tsx
10. Update App.tsx routes + sidebar
```

---

## Full Integration Roadmap

| Doc | Milestone | Pages |
|-----|-----------|-------|
| `REACT_INTEGRATION.md` | M1 | Setup, types, client |
| `REACT_INTEGRATION_M2.md` | M2 | Login, Users, Departments, Notifications |
| `REACT_INTEGRATION_M3.md` | M3 | Tasks, Kanban, Updates, Documents, Trail |
| `REACT_INTEGRATION_M4.md` | M4 | Dashboard, Reports, Exports |

Pehle Dashboard banao (`/reports/summary`) — ye sab roles ke liye kaam karta hai.
