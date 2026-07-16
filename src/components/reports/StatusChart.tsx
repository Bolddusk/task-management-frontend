interface StatusChartProps {
  byStatus: Record<string, number>;
}

const STATUS_META: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  pending: { color: '#b45309', bg: '#fef3c7', label: 'Pending' },
  in_progress: { color: '#1d4ed8', bg: '#dbeafe', label: 'In Progress' },
  completed: { color: '#047857', bg: '#d1fae5', label: 'Completed' },
  cancelled: { color: '#dc2626', bg: '#fee2e2', label: 'Cancelled' },
  overdue: { color: '#c2410c', bg: '#ffedd5', label: 'Overdue' },
};

export function StatusChart({ byStatus }: StatusChartProps) {
  const entries = Object.entries(byStatus);
  const total = entries.reduce((a, [, b]) => a + b, 0) || 1;

  if (entries.length === 0) {
    return <p className="empty-state">No status data</p>;
  }

  return (
    <div className="status-chart">
      {entries.map(([status, count]) => {
        const meta = STATUS_META[status] ?? {
          color: '#4b5563',
          bg: '#f3f4f6',
          label: status.replace(/_/g, ' '),
        };
        const pct = Math.round((count / total) * 100);

        return (
          <div key={status} className="status-chart__row">
            <div className="status-chart__label">
              <span
                className="status-chart__name"
                style={{ background: meta.bg, color: meta.color }}
              >
                {meta.label}
              </span>
              <span className="status-chart__count">
                {count}
                <span className="status-chart__pct">{pct}%</span>
              </span>
            </div>
            <div className="status-chart__track">
              <div
                className="status-chart__bar"
                style={{
                  width: `${pct}%`,
                  background: meta.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
