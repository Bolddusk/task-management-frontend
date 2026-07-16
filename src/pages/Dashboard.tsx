import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  UserPlus,
  FileText,
  Download,
  ListTodo,
  LayoutGrid,
} from 'lucide-react';
import {
  PageHero,
  StatCard,
  DashboardCard,
} from '../components/common/PageHero';
import { StatusChart } from '../components/reports/StatusChart';
import { RecentActivityList } from '../components/reports/RecentActivityList';
import { checkHealth } from '../api/health';
import { getReportSummary } from '../api/reports';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatHeaderRoleLabel } from '../utils/format';
import {
  isAdminSummary,
  isDeptSummary,
  isOwnerSummary,
  type ReportSummary,
} from '../types/exports';

export function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [backendStatus, setBackendStatus] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkHealth()
      .then((res) =>
        setBackendStatus(res.success ? 'connected' : 'error'),
      )
      .catch(() => setBackendStatus('unreachable'));
  }, []);

  useEffect(() => {
    setLoading(true);
    getReportSummary()
      .then(setSummary)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const roleEyebrow = user
    ? `${formatHeaderRoleLabel(user)} DASHBOARD`
    : 'DASHBOARD';

  const overdueCount = summary
    ? isAdminSummary(summary)
      ? summary.overdue_tasks
      : isDeptSummary(summary)
        ? summary.overdue_tasks
        : isOwnerSummary(summary)
          ? summary.overdue_tasks
          : 0
    : 0;

  return (
    <div className="page page--dashboard">
      <PageHero
        compact
        eyebrow={roleEyebrow}
        title={`Welcome, ${user?.full_name ?? 'there'}`}
        description="Your role-scoped overview of tasks and activity."
        meta={
          <>
            {user?.departments?.length ? (
              <span className="page-hero__chip">
                {user.departments.map((d) => d.name).join(' · ')}
              </span>
            ) : null}
            {backendStatus === 'connected' && (
              <span className="page-hero__chip page-hero__chip--ok">
                Backend connected
              </span>
            )}
            {backendStatus && backendStatus !== 'connected' && (
              <span className="page-hero__chip page-hero__chip--warn">
                Backend {backendStatus}
              </span>
            )}
          </>
        }
      />

      {error && <div className="form-error">{error}</div>}
      {loading && <p className="empty-state">Loading dashboard...</p>}

      {summary && (
        <>
          <div className="stats-grid">
            {isAdminSummary(summary) && (
              <>
                <StatCard
                  label="Total Tasks"
                  value={summary.total_tasks}
                  variant="green"
                  icon={<BarChart3 size={20} />}
                />
                <StatCard
                  label="Completion Rate"
                  value={summary.completion_rate}
                  variant="blue"
                  icon={<CheckCircle2 size={20} />}
                />
                <StatCard
                  label="Overdue"
                  value={summary.overdue_tasks}
                  variant="orange"
                  icon={<AlertTriangle size={20} />}
                />
                <StatCard
                  label="Pending"
                  value={summary.by_status.pending ?? 0}
                  variant="purple"
                  icon={<Clock size={20} />}
                />
              </>
            )}
            {isDeptSummary(summary) && (
              <>
                <StatCard
                  label="Dept Tasks"
                  value={summary.dept_tasks}
                  variant="green"
                  icon={<BarChart3 size={20} />}
                />
                <StatCard
                  label="My Assigned"
                  value={summary.my_assigned_tasks}
                  variant="blue"
                  icon={<CheckCircle2 size={20} />}
                />
                <StatCard
                  label="Completion Rate"
                  value={summary.completion_rate}
                  variant="purple"
                  icon={<Clock size={20} />}
                />
                <StatCard
                  label="Overdue"
                  value={summary.overdue_tasks}
                  variant="orange"
                  icon={<AlertTriangle size={20} />}
                />
              </>
            )}
            {isOwnerSummary(summary) && (
              <>
                <StatCard
                  label="My Tasks"
                  value={summary.my_tasks}
                  variant="green"
                  icon={<BarChart3 size={20} />}
                />
                <StatCard
                  label="Avg Completion"
                  value={summary.avg_completion}
                  variant="blue"
                  icon={<CheckCircle2 size={20} />}
                />
                <StatCard
                  label="Overdue"
                  value={summary.overdue_tasks}
                  variant="orange"
                  icon={<AlertTriangle size={20} />}
                />
                <StatCard
                  label="In Progress"
                  value={summary.by_status.in_progress ?? 0}
                  variant="purple"
                  icon={<Clock size={20} />}
                />
              </>
            )}
          </div>

          {overdueCount > 0 && (
            <div className="alert-banner alert-banner--warning">
              <AlertTriangle size={18} />
              <span>
                {overdueCount} overdue task{overdueCount !== 1 ? 's' : ''} need
                attention.
              </span>
              <Link to="/reports" className="link-btn">
                View overdue
              </Link>
            </div>
          )}

          <div className="dashboard-grid">
            <DashboardCard title="Tasks by Status">
              <StatusChart byStatus={summary.by_status} />
            </DashboardCard>

            <DashboardCard
              title="Recent Activity"
              action={
                <Link to="/reports" className="link-btn">
                  All reports
                </Link>
              }
            >
              <RecentActivityList activities={summary.recent_activity} />
            </DashboardCard>
          </div>

          {isAdminSummary(summary) &&
            (summary.tasks_by_dept.length > 0 ||
              summary.tasks_by_user.length > 0) && (
              <div className="dashboard-grid dashboard-grid--tables">
                {summary.tasks_by_dept.length > 0 && (
                  <DashboardCard title="Tasks by Department">
                    <div className="table-card table-card--compact">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>DEPARTMENT</th>
                            <th>TOTAL</th>
                            <th>DONE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.tasks_by_dept.map((row) => (
                            <tr key={row.dept_name}>
                              <td className="col-title">{row.dept_name}</td>
                              <td>
                                <span className="dash-pill dash-pill--neutral">
                                  {row.total}
                                </span>
                              </td>
                              <td>
                                <span className="dash-pill dash-pill--green">
                                  {row.completed}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </DashboardCard>
                )}

                {summary.tasks_by_user.length > 0 && (
                  <DashboardCard title="Tasks by User">
                    <div className="table-card table-card--compact">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>USER</th>
                            <th>ROLE</th>
                            <th>ASSIGNED</th>
                            <th>DONE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.tasks_by_user.map((row) => (
                            <tr key={row.full_name}>
                              <td className="col-title">{row.full_name}</td>
                              <td className="dash-role">
                                {row.role_name.replace(/_/g, ' ')}
                              </td>
                              <td>
                                <span className="dash-pill dash-pill--blue">
                                  {row.assigned}
                                </span>
                              </td>
                              <td>
                                <span className="dash-pill dash-pill--green">
                                  {row.completed}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </DashboardCard>
                )}
              </div>
            )}

          <section className="dash-actions">
            <h2 className="dash-actions__title">Quick Actions</h2>
            <div className="dash-actions__grid">
              {hasPermission('task.create') && (
                <Link to="/tasks/new" className="dash-action dash-action--primary">
                  <Plus size={18} />
                  <span>Create Task</span>
                </Link>
              )}
              <Link to="/tasks" className="dash-action dash-action--mint">
                <ListTodo size={18} />
                <span>All Tasks</span>
              </Link>
              <Link to="/tasks/kanban" className="dash-action dash-action--sky">
                <LayoutGrid size={18} />
                <span>Kanban</span>
              </Link>
              {hasPermission('user.manage') && (
                <Link to="/users" className="dash-action dash-action--violet">
                  <UserPlus size={18} />
                  <span>Manage Users</span>
                </Link>
              )}
              {(hasPermission('report.view_all') ||
                hasPermission('report.view_own')) && (
                <Link to="/reports" className="dash-action dash-action--amber">
                  <FileText size={18} />
                  <span>Reports</span>
                </Link>
              )}
              {hasPermission('task.export') && (
                <Link to="/exports" className="dash-action dash-action--slate">
                  <Download size={18} />
                  <span>Exports</span>
                </Link>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
