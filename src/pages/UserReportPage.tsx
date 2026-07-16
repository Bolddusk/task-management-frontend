import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  PageHero,
  StatCard,
  StatusBadge,
  PriorityBadge,
  DashboardCard,
} from '../components/common/PageHero';
import { getUserReport } from '../api/reports';
import { getErrorMessage } from '../api/client';
import { formatRoleLabel } from '../utils/format';
import type { TaskPriority } from '../types/tasks';
import type { UserReport } from '../types/exports';

export function UserReportPage() {
  const { userId } = useParams<{ userId: string }>();
  const [report, setReport] = useState<UserReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    getUserReport(Number(userId))
      .then(setReport)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [userId]);

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
        eyebrow="USER REPORT"
        title={report.user.full_name}
        description={formatRoleLabel(report.user.role_name)}
      />

      <div className="stats-grid">
        <StatCard
          label="Total Assigned"
          value={report.total_assigned}
          variant="green"
        />
        <StatCard
          label="Completed"
          value={report.completed}
          variant="blue"
        />
        <StatCard
          label="Avg Completion"
          value={`${report.avg_completion_percentage}%`}
          variant="purple"
        />
        <StatCard
          label="Overdue"
          value={report.overdue}
          variant="orange"
        />
      </div>

      <DashboardCard title="Assigned Tasks">
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>TITLE</th>
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
