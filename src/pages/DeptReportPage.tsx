import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  PageHero,
  StatusBadge,
  PriorityBadge,
  DashboardCard,
} from '../components/common/PageHero';
import { getDeptReport } from '../api/reports';
import { getErrorMessage } from '../api/client';
import { formatRoleLabel } from '../utils/format';
import type { DeptReport } from '../types/exports';
import type { TaskPriority } from '../types/tasks';

export function DeptReportPage() {
  const { deptId } = useParams<{ deptId: string }>();
  const [report, setReport] = useState<DeptReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!deptId) return;
    getDeptReport(Number(deptId))
      .then(setReport)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [deptId]);

  if (loading) return <p className="empty-state">Loading report...</p>;
  if (error) return <div className="form-error">{error}</div>;
  if (!report) return <p className="empty-state">Report not found</p>;

  return (
    <div className="page">
      <div className="page-back">
        <Link to="/reports" className="link-btn">
          <ArrowLeft size={16} /> Back to reports
        </Link>
      </div>

      <PageHero
        eyebrow="DEPARTMENT REPORT"
        title={report.department.name}
        description="Per-user breakdown and department task list."
      />

      <DashboardCard title="By User">
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>ROLE</th>
                <th>ASSIGNED</th>
                <th>COMPLETED</th>
                <th>AVG %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {report.by_user.map((row) => (
                <tr key={row.user.id}>
                  <td className="col-title">{row.user.full_name}</td>
                  <td>{formatRoleLabel(row.user.role_name)}</td>
                  <td>{row.tasks_assigned}</td>
                  <td>{row.completed}</td>
                  <td>{row.avg_completion}%</td>
                  <td>
                    <Link
                      to={`/reports/user/${row.user.id}`}
                      className="link-btn"
                    >
                      User report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      <DashboardCard title="Department Tasks">
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>TITLE</th>
                <th>ASSIGNEE</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th>PROGRESS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {report.tasks.map((task) => (
                <tr key={task.id}>
                  <td className="col-title">{task.title}</td>
                  <td>{task.assignee_name}</td>
                  <td>
                    <PriorityBadge priority={task.priority as TaskPriority} />
                  </td>
                  <td>
                    <StatusBadge status={task.status} />
                  </td>
                  <td>{task.completion_percentage}%</td>
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
      </DashboardCard>
    </div>
  );
}
