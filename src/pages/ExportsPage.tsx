import { useState } from 'react';
import { PageHero, DashboardCard } from '../components/common/PageHero';
import { ExportForm } from '../components/exports/ExportForm';
import { ExportHistory } from '../components/exports/ExportHistory';

export function ExportsPage() {
  const [historyKey, setHistoryKey] = useState(0);

  return (
    <div className="page">
      <PageHero
        eyebrow="EXPORTS"
        title="Exports"
        description="Download task data and reports in CSV, Excel, or PDF format."
      />

      <DashboardCard title="New Export">
        <ExportForm onSuccess={() => setHistoryKey((k) => k + 1)} />
      </DashboardCard>

      <DashboardCard title="Export History" subtitle="Last 20 exports">
        <ExportHistory key={historyKey} />
      </DashboardCard>
    </div>
  );
}
