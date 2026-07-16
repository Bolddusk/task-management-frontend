import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHero, StatusBadge, DashboardCard } from '../components/common/PageHero';
import { getOverdueTasks } from '../api/reports';
import { getUsers } from '../api/users';
import { getDepartments } from '../api/departments';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { OverdueTask } from '../types/exports';
import type { UserListItem, Department } from '../types';
import { formatRoleLabel } from '../utils/format';

export function Reports() {
  const { hasPermission } = useAuth();
  const [overdue, setOverdue] = useState<OverdueTask[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const overdueData = await getOverdueTasks();
        setOverdue(overdueData);

        if (hasPermission('report.view_all')) {
          const userData = await getUsers({ page: 1, page_size: 50 });
          setUsers(userData.users);
        }

        const deptData = await getDepartments();
        setDepartments(deptData);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hasPermission]);

  return (
    <div className="page">
      <PageHero
        eyebrow="REPORTS"
        title="Reports"
        description="Overdue tasks, user performance, and department breakdowns."
      />

      {error && <div className="form-error">{error}</div>}

      <DashboardCard title="Overdue Tasks" subtitle="Past end date, not completed">
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : overdue.length === 0 ? (
          <p className="empty-state">No overdue tasks</p>
        ) : (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TITLE</th>
                  <th>ASSIGNEE</th>
                  <th>DEPT</th>
                  <th>DAYS OVERDUE</th>
                  <th>STATUS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((task) => (
                  <tr key={task.id}>
                    <td className="col-title">{task.title}</td>
                    <td>{task.assignee.full_name}</td>
                    <td>{task.dept.name}</td>
                    <td>
                      <span className="overdue-badge">{task.days_overdue}d</span>
                    </td>
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                    <td>
                      <Link to={`/tasks/${task.id}`} className="link-btn">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      {hasPermission('report.view_all') && users.length > 0 && (
        <DashboardCard title="User Reports" subtitle="Performance by user">
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>ROLE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="col-title">{u.full_name}</td>
                    <td>{formatRoleLabel(u.role_name)}</td>
                    <td>
                      <Link to={`/reports/user/${u.id}`} className="link-btn">
                        View report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {(hasPermission('report.view_all') ||
        hasPermission('report.view_own')) &&
        departments.length > 0 && (
          <DashboardCard title="Department Reports">
            <div className="dept-grid dept-grid--compact">
              {departments.map((d) => (
                <Link
                  key={d.id}
                  to={`/reports/dept/${d.id}`}
                  className="dept-report-link"
                >
                  <span className="dept-report-link__name">{d.name}</span>
                  <span className="dept-report-link__count">
                    {d.user_count ?? 0} members
                  </span>
                </Link>
              ))}
            </div>
          </DashboardCard>
        )}
    </div>
  );
}
