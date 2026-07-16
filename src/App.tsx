import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { TaskList } from './pages/TaskList';
import { KanbanBoard } from './pages/KanbanBoard';
import { CreateTask } from './pages/CreateTask';
import { TaskDetailPage } from './pages/TaskDetail';
import { Reports } from './pages/Reports';
import { UserReportPage } from './pages/UserReportPage';
import { DeptReportPage } from './pages/DeptReportPage';
import { ExportsPage } from './pages/ExportsPage';
import { Login } from './pages/Login';
import { ChangePassword } from './pages/ChangePassword';
import { Users } from './pages/Users';
import { Departments } from './pages/Departments';
import { DepartmentDetailPage } from './pages/DepartmentDetail';
import { Grades } from './pages/Grades';
import { Sprints } from './pages/Sprints';
import { SprintDetailPage } from './pages/SprintDetail';
import { PlaceholderPage, Unauthorized } from './pages/Placeholder';

const TASK_VIEW_PERMS = [
  'task.view_all',
  'task.view_dept',
  'task.view_own',
] as const;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            <Route
              path="tasks"
              element={
                <ProtectedRoute anyPermission={[...TASK_VIEW_PERMS]}>
                  <TaskList />
                </ProtectedRoute>
              }
            />
            <Route
              path="tasks/kanban"
              element={
                <ProtectedRoute anyPermission={[...TASK_VIEW_PERMS]}>
                  <KanbanBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="tasks/new"
              element={
                <ProtectedRoute permission="task.create">
                  <CreateTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="tasks/:id"
              element={
                <ProtectedRoute anyPermission={[...TASK_VIEW_PERMS]}>
                  <TaskDetailPage />
                </ProtectedRoute>
              }
            />

            <Route path="my-tasks" element={<Navigate to="/tasks" replace />} />
            <Route
              path="dept-tasks"
              element={<Navigate to="/tasks" replace />}
            />

            <Route
              path="reports"
              element={
                <ProtectedRoute
                  anyPermission={['report.view_all', 'report.view_own']}
                >
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/user/:userId"
              element={
                <ProtectedRoute permission="report.view_all">
                  <UserReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/dept/:deptId"
              element={
                <ProtectedRoute
                  anyPermission={['report.view_all', 'report.view_own']}
                >
                  <DeptReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="exports"
              element={
                <ProtectedRoute permission="task.export">
                  <ExportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="users"
              element={
                <ProtectedRoute permission="user.manage">
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="departments"
              element={
                <ProtectedRoute permission="dept.manage">
                  <Departments />
                </ProtectedRoute>
              }
            />
            <Route
              path="departments/:id"
              element={
                <ProtectedRoute permission="dept.manage">
                  <DepartmentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="grades"
              element={
                <ProtectedRoute permission="grade.manage">
                  <Grades />
                </ProtectedRoute>
              }
            />
            <Route path="sprints" element={<Sprints />} />
            <Route path="sprints/:id" element={<SprintDetailPage />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute permission="admin.panel">
                  <PlaceholderPage
                    title="Admin Panel"
                    description="System administration and audit tools."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <PlaceholderPage
                  title="Settings"
                  description="Use the profile menu to change your password or sign out."
                />
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
