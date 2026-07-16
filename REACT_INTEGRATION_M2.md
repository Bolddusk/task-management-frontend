# React Integration Guide — Milestone 2

> **Milestone 2 (Backend) — Done**
> Auth, RBAC, User Management, Departments, Notifications APIs live hain.
> Is guide ko `REACT_INTEGRATION.md` (M1) ke baad follow karo.

**Base URL:** `http://localhost:5000/api`  
**Auth header:** `Authorization: Bearer <token>`

---

## Table of Contents

1. [Kya Live Hai (M2)](#1-kya-live-hai-m2)
2. [Pehle Ye Karo](#2-pehle-ye-karo)
3. [Response Format Notes](#3-response-format-notes)
4. [Live API Reference](#4-live-api-reference)
5. [TypeScript Types](#5-typescript-types)
6. [API Client Files](#6-api-client-files)
7. [AuthContext (Updated)](#7-authcontext-updated)
8. [React Pages & Routes](#8-react-pages--routes)
9. [Permission-Based UI](#9-permission-based-ui)
10. [Test Accounts](#10-test-accounts)
11. [Integration Checklist](#11-integration-checklist)
12. [M3 Preview](#12-m3-preview)

---

## 1. Kya Live Hai (M2)

| Module | Endpoints | Auth |
|--------|-----------|------|
| Health | `GET /health` | No |
| Auth | `POST /auth/login`, `GET /auth/me`, `PATCH /auth/change-password` | Mixed |
| Users | `GET/POST /users`, `GET/PATCH/DELETE /users/:id`, `GET /users/dropdown` | Yes |
| Departments | `GET/POST /departments`, `PATCH /departments/:id`, `GET /departments/:id/users` | Yes |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` | Yes |

**Abhi nahi bana (M3+):** Task CRUD, file upload, reports/export

---

## 2. Pehle Ye Karo

### Backend running

```bash
cd task-management-backend
npm run dev    # http://localhost:5000
```

### React `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Packages

```bash
npm install axios react-router-dom
```

### Quick login test

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"superadmin@test.com\",\"password\":\"Password@123\"}"
```

---

## 3. Response Format Notes

> **Important:** M2 APIs consistently `{ success, data }` wrap **nahi** karti. Direct JSON return hota hai.

| Endpoint | Success shape |
|----------|---------------|
| Login | `{ token, user }` |
| Login (force change) | `{ must_change_password: true, token, user }` |
| `/auth/me` | Flat user object + `permissions[]` |
| User list | `{ users, total, page, page_size }` |
| User dropdown | `[...]` array |
| Departments | `[...]` array |
| Notifications | `{ notifications, unread_count }` |
| Errors | `{ success: false, message }` **ya** `{ error: "..." }` |

### Field naming

Backend **snake_case** use karta hai:
- `role_name` (not `role`)
- `hierarchy_level`
- `current_password` / `new_password`
- `page_size`
- `dept_ids`
- `must_change_password`

---

## 4. Live API Reference

### 4.1 Auth

#### `POST /auth/login`

**Body:**
```json
{ "email": "superadmin@test.com", "password": "Password@123" }
```

**Success 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "org_id": 1,
    "role_id": 1,
    "role_name": "super_admin",
    "hierarchy_level": 1,
    "full_name": "Super Admin",
    "email": "superadmin@test.com"
  }
}
```

**Force password change 200:**
```json
{
  "must_change_password": true,
  "token": "...",
  "user": { ... }
}
```

**Errors:**

| Status | Body |
|--------|------|
| 401 | `{ "success": false, "message": "Invalid email or password" }` |
| 403 | `{ "error": "Account deactivated" }` |
| 403 | `{ "error": "Organization is inactive" }` |

---

#### `GET /auth/me`

**Headers:** `Authorization: Bearer <token>`

**Success 200:**
```json
{
  "id": 1,
  "full_name": "Super Admin",
  "email": "superadmin@test.com",
  "org_id": 1,
  "role_id": 1,
  "role_name": "super_admin",
  "hierarchy_level": 1,
  "phone": null,
  "is_active": true,
  "must_change_password": false,
  "departments": [
    { "id": 1, "name": "Administration", "is_primary": 1 }
  ],
  "permissions": [
    "task.create", "task.assign_skip", "user.manage", "admin.panel", "..."
  ]
}
```

> Login ke baad **hamesha `/auth/me` call karo** — yahan `permissions` aur `departments` milte hain.

---

#### `PATCH /auth/change-password`

**Body:**
```json
{
  "current_password": "Password@123",
  "new_password": "NewPass@456"
}
```

**Rules:** min 8 chars, 1 uppercase, 1 number

**Success 200:**
```json
{ "message": "Password changed successfully" }
```

---

### 4.2 Users

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| `GET` | `/users` | `user.manage` OR `task.view_all` | Paginated + filters |
| `GET` | `/users/dropdown` | Any authenticated | Assignable users (hierarchy filtered) |
| `POST` | `/users` | `user.manage` | Create user |
| `GET` | `/users/:id` | `user.manage` | Detail + recent tasks |
| `PATCH` | `/users/:id` | `user.manage` | Update user |
| `DELETE` | `/users/:id` | `user.manage` | Soft delete (super_admin only) |

#### `GET /users` — Query params

| Param | Type | Example |
|-------|------|---------|
| `page` | number | `1` |
| `page_size` | number | `20` (max 100) |
| `role_id` | number | `2` |
| `is_active` | `0`/`1`/`true`/`false` | `1` |
| `dept_id` | number | `1` |
| `search` | string | `admin` (name or email) |

**Response:**
```json
{
  "users": [
    {
      "id": 2,
      "full_name": "Admin User",
      "email": "admin@test.com",
      "phone": null,
      "is_active": true,
      "role_name": "admin",
      "hierarchy_level": 2,
      "departments": [{ "id": 1, "name": "Administration", "is_primary": 1 }]
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 20
}
```

#### `GET /users/dropdown`

Task assign dropdown ke liye — sirf junior rank users.

```json
[
  {
    "id": 2,
    "full_name": "Admin User",
    "role_name": "admin",
    "hierarchy_level": 2,
    "departments": [{ "id": 1, "name": "Administration", "is_primary": 1 }]
  }
]
```

#### `POST /users`

**Body:**
```json
{
  "full_name": "New User",
  "email": "newuser@test.com",
  "password": "TempPass@123",
  "role_id": 10,
  "phone": "03001234567",
  "dept_ids": [1, 2]
}
```

- `must_change_password` automatically `1` set hota hai
- Welcome email bheji jati hai (SMTP configured ho to)
- Admin `super_admin` ya `admin` role create **nahi** kar sakta

#### `PATCH /users/:id`

**Body (sab optional):**
```json
{
  "full_name": "Updated Name",
  "phone": "03009999999",
  "role_id": 5,
  "is_active": true,
  "dept_ids": [1]
}
```

**Rules:**
- Apni role change nahi kar sakte
- Khud ko deactivate nahi kar sakte

#### `DELETE /users/:id`

Soft delete — sirf `super_admin`. Response:
```json
{ "success": true, "message": "User deactivated" }
```

---

### 4.3 Departments

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/departments` | Any authenticated |
| `POST` | `/departments` | `dept.manage` |
| `PATCH` | `/departments/:id` | `dept.manage` |
| `GET` | `/departments/:id/users` | Any authenticated |

#### `GET /departments`

```json
[
  {
    "id": 1,
    "org_id": 1,
    "name": "Administration",
    "description": null,
    "is_active": true,
    "user_count": 10,
    "created_at": "2026-07-13T04:56:55.000Z"
  }
]
```

#### `POST /departments`

```json
{ "name": "IT", "description": "Information Technology" }
```

#### `GET /departments/:id/users`

```json
{
  "department": { "id": 1, "name": "Administration" },
  "users": [
    {
      "id": 1,
      "full_name": "Super Admin",
      "email": "superadmin@test.com",
      "is_active": true,
      "role_name": "super_admin",
      "hierarchy_level": 1,
      "is_primary": true
    }
  ]
}
```

---

### 4.4 Notifications

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/notifications` | `?is_read=0&limit=20` |
| `PATCH` | `/notifications/read-all` | Mark all read |
| `PATCH` | `/notifications/:id/read` | Mark one read |

#### `GET /notifications`

```json
{
  "notifications": [
    {
      "id": 1,
      "user_id": 1,
      "task_id": 5,
      "type": "task_assigned",
      "title": "New task assigned",
      "body": "You have been assigned...",
      "is_read": false,
      "created_at": "2026-07-13T10:00:00.000Z"
    }
  ],
  "unread_count": 3
}
```

**Notification types:** `task_assigned` | `task_updated` | `update_requested` | `task_completed`

---

## 5. TypeScript Types

Create/update `src/types/index.ts`:

```typescript
// ─── Roles & Permissions ───────────────────────────────
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

export type NotificationType =
  | 'task_assigned' | 'task_updated' | 'update_requested' | 'task_completed';

// ─── Shared ────────────────────────────────────────────
export interface DepartmentRef {
  id: number;
  name: string;
  is_primary: number | boolean;
}

export interface ApiError {
  success?: false;
  message?: string;
  error?: string;
}

// ─── Auth ──────────────────────────────────────────────
export interface LoginUser {
  id: number;
  org_id: number;
  role_id: number;
  role_name: RoleName;
  hierarchy_level: number;
  full_name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: LoginUser;
  must_change_password?: boolean;
}

export interface MeResponse {
  id: number;
  full_name: string;
  email: string;
  org_id: number;
  role_id: number;
  role_name: RoleName;
  hierarchy_level: number;
  phone: string | null;
  is_active: boolean;
  must_change_password: boolean;
  departments: DepartmentRef[];
  permissions: PermissionCode[];
}

// ─── Users ─────────────────────────────────────────────
export interface UserListItem {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  role_name: RoleName;
  hierarchy_level: number;
  departments: DepartmentRef[];
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface UserDropdownItem {
  id: number;
  full_name: string;
  role_name: RoleName;
  hierarchy_level: number;
  departments: DepartmentRef[];
}

export interface CreateUserRequest {
  full_name: string;
  email: string;
  password: string;
  role_id: number;
  phone?: string;
  dept_ids: number[];
}

export interface UpdateUserRequest {
  full_name?: string;
  phone?: string;
  role_id?: number;
  is_active?: boolean;
  dept_ids?: number[];
}

// ─── Departments ───────────────────────────────────────
export interface Department {
  id: number;
  org_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  user_count?: number;
  created_at?: string;
}

export interface DepartmentUsersResponse {
  department: { id: number; name: string };
  users: {
    id: number;
    full_name: string;
    email: string;
    is_active: boolean;
    role_name: RoleName;
    hierarchy_level: number;
    is_primary: boolean;
  }[];
}

// ─── Notifications ─────────────────────────────────────
export interface Notification {
  id: number;
  user_id: number;
  task_id: number | null;
  type: NotificationType;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}
```

---

## 6. API Client Files

### `src/api/client.ts`

```typescript
import axios, { isAxiosError } from 'axios';
import type { ApiError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (isAxiosError<ApiError>(error)) {
    return error.response?.data?.message
      || error.response?.data?.error
      || error.message;
  }
  return 'An unexpected error occurred';
}

export default apiClient;
```

### `src/api/auth.ts`

```typescript
import apiClient from './client';
import type { LoginResponse, MeResponse } from '../types';

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get<MeResponse>('/auth/me');
  return data;
}

export async function changePassword(current_password: string, new_password: string) {
  const { data } = await apiClient.patch<{ message: string }>('/auth/change-password', {
    current_password,
    new_password,
  });
  return data;
}
```

### `src/api/users.ts`

```typescript
import apiClient from './client';
import type {
  UserListResponse,
  UserDropdownItem,
  CreateUserRequest,
  UpdateUserRequest,
  UserListItem,
} from '../types';

export interface UserListParams {
  page?: number;
  page_size?: number;
  role_id?: number;
  is_active?: boolean | 0 | 1;
  dept_id?: number;
  search?: string;
}

export async function getUsers(params?: UserListParams) {
  const { data } = await apiClient.get<UserListResponse>('/users', { params });
  return data;
}

export async function getUserDropdown() {
  const { data } = await apiClient.get<UserDropdownItem[]>('/users/dropdown');
  return data;
}

export async function getUser(id: number) {
  const { data } = await apiClient.get(`/users/${id}`);
  return data;
}

export async function createUser(payload: CreateUserRequest) {
  const { data } = await apiClient.post<UserListItem>('/users', payload);
  return data;
}

export async function updateUser(id: number, payload: UpdateUserRequest) {
  const { data } = await apiClient.patch(`/users/${id}`, payload);
  return data;
}

export async function deactivateUser(id: number) {
  const { data } = await apiClient.delete(`/users/${id}`);
  return data;
}
```

### `src/api/departments.ts`

```typescript
import apiClient from './client';
import type { Department, DepartmentUsersResponse } from '../types';

export async function getDepartments() {
  const { data } = await apiClient.get<Department[]>('/departments');
  return data;
}

export async function createDepartment(name: string, description?: string) {
  const { data } = await apiClient.post<Department>('/departments', { name, description });
  return data;
}

export async function updateDepartment(id: number, payload: Partial<Department>) {
  const { data } = await apiClient.patch<Department>(`/departments/${id}`, payload);
  return data;
}

export async function getDepartmentUsers(id: number) {
  const { data } = await apiClient.get<DepartmentUsersResponse>(`/departments/${id}/users`);
  return data;
}
```

### `src/api/notifications.ts`

```typescript
import apiClient from './client';
import type { NotificationsResponse } from '../types';

export async function getNotifications(params?: { is_read?: 0 | 1; limit?: number }) {
  const { data } = await apiClient.get<NotificationsResponse>('/notifications', { params });
  return data;
}

export async function markNotificationRead(id: number) {
  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.patch('/notifications/read-all');
  return data;
}
```

---

## 7. AuthContext (Updated)

```tsx
// src/context/AuthContext.tsx
import {
  createContext, useContext, useState, useEffect, ReactNode, useCallback,
} from 'react';
import type { MeResponse, PermissionCode } from '../types';
import { login as apiLogin, getMe } from '../api/auth';

interface AuthContextType {
  user: MeResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ mustChangePassword: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: PermissionCode) => boolean;
  hasAnyPermission: (...permissions: PermissionCode[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const me = await getMe();
    setUser(me);
    localStorage.setItem('user', JSON.stringify(me));
  }, []);

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }
      try {
        setToken(savedToken);
        await refreshUser();
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    localStorage.setItem('token', res.token);
    setToken(res.token);
    const me = await getMe();
    setUser(me);
    localStorage.setItem('user', JSON.stringify(me));
    return { mustChangePassword: !!res.must_change_password || me.must_change_password };
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
        user, token,
        isAuthenticated: !!token && !!user,
        isLoading, login, logout, refreshUser,
        hasPermission, hasAnyPermission,
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

## 8. React Pages & Routes

### Suggested routes (`App.tsx`)

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={
            <ProtectedRoute><ChangePassword /></ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute permission="user.manage"><Users /></ProtectedRoute>
          } />
          <Route path="/departments" element={
            <ProtectedRoute permission="dept.manage"><Departments /></ProtectedRoute>
          } />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### Login page flow

```
1. User enters email + password
2. Call login(email, password)
3. If mustChangePassword → redirect /change-password
4. Else → redirect /
```

```tsx
// src/pages/Login.tsx (minimal example)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { mustChangePassword } = await login(email, password);
      navigate(mustChangePassword ? '/change-password' : '/');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

### Pages to build in M2

| Page | Permission | API calls |
|------|------------|-----------|
| Login | Public | `POST /auth/login` |
| Change Password | Authenticated | `PATCH /auth/change-password` |
| Dashboard | Authenticated | `GET /auth/me`, `GET /notifications` |
| Users List | `user.manage` | `GET /users` |
| Create/Edit User | `user.manage` | `POST/PATCH /users`, `GET /departments` |
| Departments | `dept.manage` | `GET/POST/PATCH /departments` |
| Notification Bell | Authenticated | `GET /notifications`, `PATCH .../read` |

---

## 9. Permission-Based UI

### ProtectedRoute

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
  const { isAuthenticated, isLoading, hasPermission, user } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.must_change_password && !window.location.pathname.includes('change-password')) {
    return <Navigate to="/change-password" replace />;
  }
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
```

### Sidebar (M2)

```tsx
const { hasPermission } = useAuth();

const nav = [
  { label: 'Dashboard', path: '/', show: true },
  { label: 'Users', path: '/users', show: hasPermission('user.manage') },
  { label: 'Departments', path: '/departments', show: hasPermission('dept.manage') },
].filter((i) => i.show);
```

### Notification bell hook

```tsx
// src/hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';
import type { Notification } from '../types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const data = await getNotifications({ limit: 20 });
    setNotifications(data.notifications);
    setUnreadCount(data.unread_count);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: number) => {
    await markNotificationRead(id);
    await fetchNotifications();
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    await fetchNotifications();
  };

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetchNotifications };
}
```

---

## 10. Test Accounts

**Password (sab users):** `Password@123`

| Role | Email | Key M2 Permissions |
|------|-------|-------------------|
| Super Admin | `superadmin@test.com` | All (user.manage, dept.manage, admin.panel) |
| Admin | `admin@test.com` | user.manage, dept.manage, admin.panel |
| Minister | `minister@test.com` | task.view_dept (no user.manage) |
| Owner | `owner@test.com` | task.view_own only |

**Test scenarios:**

1. **Login as super_admin** → Users + Departments dono pages dikhen
2. **Login as owner** → Users page hidden, 403 on direct API call
3. **Login as admin** → Users list dikhe, super_admin create na ho
4. **User dropdown** → sirf junior rank users (super_admin ko sab dikhen)

---

## 11. Integration Checklist

### Setup
- [ ] `VITE_API_BASE_URL` set in React `.env`
- [ ] `src/api/client.ts` + interceptors
- [ ] `src/types/index.ts` M2 types
- [ ] `AuthProvider` wraps app

### Auth flow
- [ ] Login page works with seed credentials
- [ ] Token saved in `localStorage`
- [ ] `/auth/me` called on app load
- [ ] 401 redirects to `/login`
- [ ] `must_change_password` redirects to change-password page
- [ ] Change password form works

### Users (if `user.manage`)
- [ ] User list with pagination + search
- [ ] Create user form (role + dept_ids)
- [ ] Edit user (cannot change own role)
- [ ] Deactivate user (super_admin only)

### Departments (if `dept.manage`)
- [ ] Department list with user count
- [ ] Create/edit department
- [ ] View department members

### Notifications
- [ ] Bell icon with unread count
- [ ] Dropdown list
- [ ] Mark read / mark all read

### Permission guards
- [ ] Sidebar hides unauthorized links
- [ ] ProtectedRoute blocks unauthorized pages
- [ ] API errors shown via `getErrorMessage()`

---

## 12. M3 Preview

Agle milestone mein ye integrate hoga:

| Feature | APIs |
|---------|------|
| Task list/create/edit | `GET/POST/PATCH /tasks` |
| Task assign | `assigned_to` + hierarchy check |
| Task updates | `POST /tasks/:id/updates` |
| Activity trail | `GET /tasks/:id/activity` |
| File upload | `POST /tasks/:id/documents` |

M2 mein `GET /users/dropdown` already ready hai — task create form mein assignee dropdown ke liye use karo.

---

## Quick Copy Order

M2 integrate karte waqt is order mein files banao:

```
1. src/types/index.ts
2. src/api/client.ts
3. src/api/auth.ts
4. src/api/users.ts
5. src/api/departments.ts
6. src/api/notifications.ts
7. src/context/AuthContext.tsx
8. src/components/ProtectedRoute.tsx
9. src/pages/Login.tsx
10. src/pages/ChangePassword.tsx
11. src/pages/Dashboard.tsx
12. src/pages/Users.tsx
13. src/pages/Departments.tsx
14. App.tsx (routes)
```

Pehle Login test karo, phir baaki pages step by step add karo.
