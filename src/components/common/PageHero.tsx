import type { ReactNode } from 'react';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  compact?: boolean;
  meta?: ReactNode;
}

export function PageHero({
  eyebrow,
  title,
  description,
  compact = false,
  meta,
}: PageHeroProps) {
  return (
    <section className={`page-hero${compact ? ' page-hero--compact' : ''}`}>
      <div className="page-hero__main">
        <span className="page-hero__eyebrow">{eyebrow}</span>
        <h1 className="page-hero__title">{title}</h1>
        <p className="page-hero__description">{description}</p>
      </div>
      {meta ? <div className="page-hero__meta">{meta}</div> : null}
    </section>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  variant: 'green' | 'blue' | 'orange' | 'purple';
}

export function StatCard({ label, value, icon, variant }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      {icon && (
        <div className={`stat-card__icon stat-card__icon--${variant}`}>
          {icon}
        </div>
      )}
      <div className="stat-card__content">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">{value}</span>
      </div>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardCard({
  title,
  subtitle,
  action,
  children,
  className = '',
}: DashboardCardProps) {
  return (
    <div className={`dashboard-card ${className}`.trim()}>
      <div className="dashboard-card__header">
        <div>
          <h2 className="dashboard-card__title">{title}</h2>
          {subtitle && (
            <p className="dashboard-card__subtitle">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="dashboard-card__body">{children}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/_/g, '-');
  const label = status.replace(/_/g, ' ').toUpperCase();
  return (
    <span className={`status-badge status-badge--${normalized}`}>
      {label}
    </span>
  );
}

export function ReviewStatusBadge({ status }: { status: string }) {
  if (status === 'none') return null;
  const labels: Record<string, string> = {
    with_senior: 'WITH SENIOR',
    returned: 'RETURNED',
  };
  const label = labels[status] ?? status.replace(/_/g, ' ').toUpperCase();
  return (
    <span className={`status-badge status-badge--review-${status}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const normalized = priority.toLowerCase();
  return (
    <span className={`priority-badge priority-badge--${normalized}`}>
      {priority.toUpperCase()}
    </span>
  );
}
