# React Frontend Integration Guide

> **Milestone 1 (Backend) — Done**
> Database, migrations, seed data, auth middleware, aur RBAC ready hain.
> Ab React frontend is guide ke sath parallel build karo.

---

## Table of Contents

1. [Current Status](#1-current-status)
2. [Quick Start (Dono Projects)](#2-quick-start-dono-projects)
3. [Environment Setup](#3-environment-setup)
4. [API Contract](#4-api-contract)
5. [TypeScript Types](#5-typescript-types)
6. [API Client Setup](#6-api-client-setup)
7. [Auth Context](#7-auth-context)
8. [Permission-Based UI](#8-permission-based-ui)
9. [Test Accounts (Seed Data)](#9-test-accounts-seed-data)
10. [Data Models Reference](#10-data-models-reference)
11. [Role Hierarchy Rules](#11-role-hierarchy-rules)
12. [Suggested React Folder Structure](#12-suggested-react-folder-structure)
13. [Integration Milestones](#13-integration-milestones)
14. [Error Handling](#14-error-handling)

---

## 1. Current Status

### Backend — Ready

| Component | Status |
|-----------|--------|
| MySQL database + 12 migrations | Done |
| Seed data (org, roles, users, permissions) | Done |
| JWT auth middleware | Done (not wired to routes yet) |
| RBAC permission middleware | Done (not wired to routes yet) |
| CORS for `http://localhost:5173` | Done |
| Health endpoint | Done |

### Backend — Coming Next (Milestone 2+)

| Feature | Status |
|---------|--------|
| `POST /api/auth/login` | Not built yet |
| Task CRUD endpoints | Not built yet |
| User/Department management | Not built yet |
| File upload | Not built yet |
| Notifications API | Not built yet |

**React mein abhi se setup karo** — auth, API client, types, routing, aur permission guards. Jab backend routes aayenge, sirf API functions update karni hongi.

---

## 2. Quick Start (Dono Projects)

### Backend (already running)

```bash
cd task-management-backend
npm run dev          # http://localhost:5000
```

Verify:

```bash
curl http://localhost:5000/api/health
# → { "success": true, "status": "ok" }
```

### React Frontend (new project)

```bash
cd task-management-system
npm create vite@latest task-management-frontend -- --template react-ts
cd task-management-frontend
npm install
npm install axios react-router-dom
npm run dev          # http://localhost:5173
```

> Backend `.env` mein `CLIENT_ORIGIN=http://localhost:5173` set hona chahiye (already set).

---

## 3. Environment Setup

### Backend `.env`

```env
PORT=5000
DATABASE_URL=mysql://root:rootpassword@localhost:3306/task_management
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

### React `.env`

Create `task-management-frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> Vite mein env variables `VITE_` prefix se start honi chahiye.

---

## 4. API Contract

### Base URL

```
http://localhost:5000/api
```

### Response Format (standard)

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
  "message": "Human readable error message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Validation error |
| `401` | Unauthorized (no/invalid token) |
| `403` | Forbidden (missing permission) |
| `404` | Not found |
| `500` | Server error |

### Auth Header (protected routes)

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

CORS credentials enabled hain — `credentials: 'include'` use karo fetch/axios mein.

---

### 4.1 Live Endpoint (Milestone 1)

#### `GET /api/health`

- **Auth:** No
- **Response:**
```json
{ "success": true, "status": "ok" }
```

---

### 4.2 Planned Endpoints (Milestone 2+) — React ke liye abhi se types banao

> Ye endpoints backend mein abhi nahi hain, lekin schema aur middleware ke hisaab se ye contract follow hoga.

#### Auth

| Method | Path | Auth | Body | Response `data` |
|--------|------|------|------|-----------------|
| `POST` | `/auth/login` | No | `{ email, password }` | `{ token, user }` |
| `POST` | `/auth/logout` | Yes | — | `{ message }` |
| `GET` | `/auth/me` | Yes | — | `{ user, permissions }` |
| `POST` | `/auth/change-password` | Yes | `{ currentPassword, newPassword }` | `{ message }` |

**Login response `user` shape:**
```json
{
  "id": 1,
  "org_id": 1,
  "role_id": 1,
  "full_name": "Super Admin",
  "email": "superadmin@test.com",
  "role": "super_admin",
  "hierarchy_level": 1,
  "permissions": ["task.create", "task.view_all", "..."]
}
```

**JWT payload (token decode):**
```json
{
  "id": 1,
  "org_id": 1,
  "role_id": 1,
  "role": "super_admin",
  "email": "superadmin@test.com"
}
```

---

#### Tasks

| Method | Path | Auth | Permission |
|--------|------|------|------------|
| `GET` | `/tasks` | Yes | `task.view_all` / `task.view_dept` / `task.view_own` |
| `GET` | `/tasks/:id` | Yes | same as above |
| `POST` | `/tasks` | Yes | `task.create` |
| `PUT` | `/tasks/:id` | Yes | `task.create` or assignee |
| `PATCH` | `/tasks/:id/status` | Yes | role-based |
| `DELETE` | `/tasks/:id` | Yes | `task.cancel` |
| `POST` | `/tasks/:id/request-update` | Yes | `task.request_update` |
| `POST` | `/tasks/:id/updates` | Yes | `task.submit_update` |
| `GET` | `/tasks/:id/updates` | Yes | view permission |
| `POST` | `/tasks/:id/documents` | Yes | `task.submit_update` |
| `GET` | `/tasks/export` | Yes | `task.export` |

**Create task body:**
```json
{
  "title": "Review budget proposal",
  "description": "Q3 budget review",
  "priority": "high",
  "dept_id": 1,
  "assigned_to": 5,
  "created_on_behalf_of": null,
  "start_date": "2026-07-01",
  "end_date": "2026-07-31"
}
```

**Task response shape:**
```json
{
  "id": 1,
  "org_id": 1,
  "dept_id": 1,
  "title": "Review budget proposal",
  "description": "Q3 budget review",
  "priority": "high",
  "status": "pending",
  "created_by": 2,
  "created_on_behalf_of": null,
  "assigned_to": 5,
  "completion_percentage": 0,
  "start_date": "2026-07-01",
  "end_date": "2026-07-31",
  "created_at": "2026-07-13T10:00:00.000Z",
  "updated_at": "2026-07-13T10:00:00.000Z"
}
```

**Enums:**
- `priority`: `low` | `medium` | `high` | `critical`
- `status`: `pending` | `in_progress` | `completed` | `cancelled`

**List query params (planned):**
```
GET /tasks?page=1&limit=20&status=pending&priority=high&dept_id=1&search=budget
```

---

#### Users & Departments

| Method | Path | Auth | Permission |
|--------|------|------|------------|
| `GET` | `/users` | Yes | `user.manage` |
| `POST` | `/users` | Yes | `user.manage` |
| `PUT` | `/users/:id` | Yes | `user.manage` |
| `GET` | `/departments` | Yes | any authenticated |
| `POST` | `/departments` | Yes | `dept.manage` |

---

#### Notifications

| Method | Path | Auth | Permission |
|--------|------|------|------------|
| `GET` | `/notifications` | Yes | `notification.receive` |
| `PATCH` | `/notifications/:id/read` | Yes | `notification.receive` |
| `PATCH` | `/notifications/read-all` | Yes | `notification.receive` |

**Notification `type`:** `task_assigned` | `task_updated` | `update_requested` | `task_completed`

---

## 5. TypeScript Types

Create `src/types/index.ts`:

```typescript
// ─── Enums ───────────────────────────────────────────
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type NotificationType = 'task_assigned' | 'task_updated' | 'update_requested' | 'task_completed';

export type RoleName =
  | 'super_admin' | 'admin' | 'minister' | 'secretary'
  | 'as' | 'js' | 'consultant' | 'ds' | 'so' | 'owner';

export type PermissionCode =
  | 'task.create' | 'task.assign_skip' | 'task.request_update' | 'task.submit_update'
  | 'task.view_all' | 'task.view_dept' | 'task.view_own'
  | 'task.export' | 'task.cancel'
  | 'user.manage' | 'dept.manage'
  | 'report.view_all' | 'report.view_own'
  | 'notification.receive' | 'admin.panel';

// ─── API Response ──────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// ─── Auth ──────────────────────────────────────────────
export interface User {
  id: number;
  org_id: number;
  role_id: number;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  must_change_password: boolean;
  role: RoleName;
  hierarchy_level: number;
  permissions: PermissionCode[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ─── Task ──────────────────────────────────────────────
export interface Task {
  id: number;
  org_id: number;
  dept_id: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_by: number;
  created_on_behalf_of?: number;
  assigned_to: number;
  completion_percentage: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  dept_id: number;
  assigned_to: number;
  created_on_behalf_of?: number;
  start_date: string;
  end_date: string;
}

export interface TaskUpdate {
  id: number;
  task_id: number;
  submitted_by: number;
  update_text: string;
  completion_percentage: number;
  is_submitted: boolean;
  submitted_at?: string;
  created_at: string;
}

// ─── Department ────────────────────────────────────────
export interface Department {
  id: number;
  org_id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

// ─── Notification ──────────────────────────────────────
export interface Notification {
  id: number;
  user_id: number;
  task_id?: number;
  type: NotificationType;
  title: string;
  body?: string;
  is_read: boolean;
  created_at: string;
}

// ─── Pagination ────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## 6. API Client Setup

Create `src/api/client.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

Create `src/api/health.ts` (abhi test ke liye):

```typescript
import apiClient from './client';
import type { ApiResponse } from '../types';

export async function checkHealth() {
  const { data } = await apiClient.get<ApiResponse<{ status: string }>>('/health');
  return data;
}
```

Create `src/api/auth.ts` (backend route aane par use hoga):

```typescript
import apiClient from './client';
import type { ApiResponse, LoginRequest, LoginResponse, User } from '../types';

export async function login(credentials: LoginRequest) {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get<ApiResponse<{ user: User; permissions: string[] }>>('/auth/me');
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await apiClient.post<ApiResponse>('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return data;
}
```

Create `src/api/tasks.ts`:

```typescript
import apiClient from './client';
import type { ApiResponse, Task, CreateTaskRequest, PaginatedResponse } from '../types';

export async function getTasks(params?: Record<string, string | number>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Task>>>('/tasks', { params });
  return data;
}

export async function getTask(id: number) {
  const { data } = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
  return data;
}

export async function createTask(payload: CreateTaskRequest) {
  const { data } = await apiClient.post<ApiResponse<Task>>('/tasks', payload);
  return data;
}

export async function updateTask(id: number, payload: Partial<CreateTaskRequest>) {
  const { data } = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, payload);
  return data;
}
```

---

## 7. Auth Context

Create `src/context/AuthContext.tsx`:

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, PermissionCode } from '../types';
import { getMe } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasPermission: (permission: PermissionCode) => boolean;
  hasAnyPermission: (...permissions: PermissionCode[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Backend /auth/me route aane par uncomment karo:
        // try {
        //   const res = await getMe();
        //   if (res.success && res.data) setUser(res.data.user);
        // } catch {
        //   logout();
        // }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const hasPermission = (permission: PermissionCode) =>
    user?.permissions?.includes(permission) ?? false;

  const hasAnyPermission = (...permissions: PermissionCode[]) =>
    permissions.some((p) => hasPermission(p));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

---

## 8. Permission-Based UI

### Protected Route

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { PermissionCode } from '../types';

interface Props {
  children: React.ReactNode;
  permission?: PermissionCode;
}

export function ProtectedRoute({ children, permission }: Props) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
```

### Conditional Button

```tsx
// Example: sirf task.create permission wale user ko button dikhao
const { hasPermission } = useAuth();

{hasPermission('task.create') && (
  <button onClick={() => navigate('/tasks/new')}>Create Task</button>
)}
```

### Role-based Sidebar (example)

```tsx
const { user, hasPermission } = useAuth();

const navItems = [
  { label: 'Dashboard', path: '/', show: true },
  { label: 'All Tasks', path: '/tasks', show: hasPermission('task.view_all') },
  { label: 'My Tasks', path: '/my-tasks', show: hasPermission('task.view_own') },
  { label: 'Dept Tasks', path: '/dept-tasks', show: hasPermission('task.view_dept') },
  { label: 'Users', path: '/users', show: hasPermission('user.manage') },
  { label: 'Reports', path: '/reports', show: hasPermission('report.view_all') || hasPermission('report.view_own') },
  { label: 'Admin', path: '/admin', show: hasPermission('admin.panel') },
].filter((item) => item.show);
```

---

## 9. Test Accounts (Seed Data)

Backend seed run karo (agar nahi kiya):

```bash
npm run db:seed
```

**Sab users ka password:** `Password@123`

| Role | Email | Key Permissions |
|------|-------|-----------------|
| Super Admin | `superadmin@test.com` | All 15 permissions |
| Admin | `admin@test.com` | All except submit_update, view_own, cancel |
| Minister | `minister@test.com` | Create, assign, view dept, export, reports |
| Secretary | `secretary@test.com` | Similar to minister, own reports |
| AS | `as@test.com` | Create, request update, view dept, submit |
| JS | `js@test.com` | Same as AS |
| Consultant | `consultant@test.com` | Create, request, view dept, submit |
| DS | `ds@test.com` | View dept, submit update, own reports |
| SO | `so@test.com` | View dept, submit update, own reports |
| Owner | `owner@test.com` | View own tasks, submit update only |

**Organization:** Task Management Org (`task-org`)

**Departments:** Administration, Finance, Operations, HR

---

## 10. Data Models Reference

### Roles (hierarchy — lower number = higher authority)

| Role | Level |
|------|-------|
| super_admin | 1 |
| admin | 2 |
| minister | 3 |
| secretary | 4 |
| as | 5 |
| js | 6 |
| consultant | 7 |
| ds | 8 |
| so | 9 |
| owner | 10 |

### All Permissions

```
task.create          task.assign_skip       task.request_update
task.submit_update   task.view_all          task.view_dept
task.view_own        task.export            task.cancel
user.manage          dept.manage            report.view_all
report.view_own      notification.receive   admin.panel
```

### Task Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | Yes | max 255 |
| description | text | No | |
| priority | enum | Yes | low/medium/high/critical |
| status | enum | Auto | pending/in_progress/completed/cancelled |
| dept_id | number | Yes | FK departments |
| assigned_to | number | Yes | FK users |
| created_on_behalf_of | number | No | FK users |
| start_date | date | Yes | YYYY-MM-DD |
| end_date | date | Yes | YYYY-MM-DD |
| completion_percentage | number | Auto | 0–100 |

---

## 11. Role Hierarchy Rules

Backend mein ye rules enforce honge (React UI mein bhi dikhao):

```
Rule: Higher rank wala (lower hierarchy_level) hi neeche wale ko task assign kar sakta hai.

Example:
  minister (level 3) → can assign to secretary (4), as (5), js (6), etc.
  secretary (level 4) → CANNOT assign to minister (3)
  owner (level 10)    → cannot assign to anyone
```

**React mein implement karo:**
```typescript
function canAssignTo(assignerLevel: number, assigneeLevel: number): boolean {
  return assignerLevel < assigneeLevel;
}
```

Task assign dropdown mein sirf woh users dikhao jinhe current user assign kar sakta hai.

---

## 12. Suggested React Folder Structure

```
task-management-frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios instance + interceptors
│   │   ├── auth.ts
│   │   ├── tasks.ts
│   │   ├── users.ts
│   │   ├── departments.ts
│   │   └── notifications.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   └── TaskList.tsx
│   │   └── common/
│   │       ├── ProtectedRoute.tsx
│   │       ├── PermissionGate.tsx
│   │       └── LoadingSpinner.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useTasks.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Tasks.tsx
│   │   ├── TaskDetail.tsx
│   │   ├── CreateTask.tsx
│   │   ├── Users.tsx
│   │   └── Unauthorized.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── permissions.ts
│   │   └── hierarchy.ts
│   ├── App.tsx
│   └── main.tsx
├── .env
└── package.json
```

---

## 13. Integration Milestones

### Milestone 1 — Backend Foundation (DONE)
- [x] Database schema
- [x] Migrations + seed
- [x] Auth/RBAC middleware
- [x] Health endpoint
- [x] CORS configured

### Milestone 2 — Auth (Backend + React)
**Backend:**
- [ ] `POST /api/auth/login`
- [ ] `GET /api/auth/me`
- [ ] `POST /api/auth/change-password`

**React:**
- [ ] Vite project setup
- [ ] API client + types
- [ ] Login page
- [ ] AuthContext
- [ ] Protected routes
- [ ] Health check test on dashboard

### Milestone 3 — Tasks (Core Feature)
**Backend:**
- [ ] Task CRUD endpoints
- [ ] Task updates (submit progress)
- [ ] Hierarchy check on assign

**React:**
- [ ] Task list (with filters)
- [ ] Create task form
- [ ] Task detail page
- [ ] Submit update form
- [ ] Permission-based task views (all/dept/own)

### Milestone 4 — Users & Departments
**Backend:**
- [ ] User management endpoints
- [ ] Department CRUD

**React:**
- [ ] User list + create/edit
- [ ] Department management
- [ ] Role assignment UI

### Milestone 5 — Notifications & Reports
**Backend:**
- [ ] Notifications API
- [ ] Report/export endpoints

**React:**
- [ ] Notification bell + dropdown
- [ ] Reports page
- [ ] Excel/PDF download

### Milestone 6 — Polish
- [ ] File upload for task documents
- [ ] Audit log viewer (admin)
- [ ] Password change flow
- [ ] Error boundaries + toast notifications

---

## 14. Error Handling

### React mein API errors handle karo

```typescript
import { isAxiosError } from 'axios';

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  return 'An unexpected error occurred';
}

// Usage in component:
try {
  await createTask(formData);
} catch (error) {
  setError(getErrorMessage(error));
}
```

### Common backend error messages

| Message | Action in React |
|---------|-----------------|
| `Unauthorized` | Redirect to `/login` |
| `Invalid or expired token` | Clear token, redirect to `/login` |
| `Forbidden: missing required permission` | Show `/unauthorized` page |
| `Forbidden: insufficient role` | Show `/unauthorized` page |

---

## Quick Test — React se Backend connect karo

`App.tsx` mein temporarily ye add karo:

```tsx
import { useEffect, useState } from 'react';
import { checkHealth } from './api/health';

function App() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    checkHealth()
      .then((res) => setStatus(res.success ? 'Backend connected!' : 'Backend error'))
      .catch(() => setStatus('Backend unreachable'));
  }, []);

  return <h1>API Status: {status}</h1>;
}
```

Agar `Backend connected!` dikhe to CORS aur API client sahi kaam kar raha hai.

---

## Next Steps

1. React project create karo (`npm create vite@latest`)
2. Is guide ke types aur API client copy karo
3. Login page banao (mock data se test karo jab tak backend auth route na ho)
4. Backend Milestone 2 (auth routes) complete hone par connect karo
5. Phir tasks, users, notifications step by step integrate karo
