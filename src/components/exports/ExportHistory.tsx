import { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { getExportHistory, downloadExport } from '../../api/exports';
import { getErrorMessage } from '../../api/client';
import type { ExportJob } from '../../types/exports';
import { formatDateTime } from '../../utils/format';

export function ExportHistory() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExportHistory();
      setJobs(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = async (job: ExportJob) => {
    try {
      const ext = job.format === 'xlsx' ? 'xlsx' : job.format;
      await downloadExport(job.id, `${job.export_type}_${job.id}.${ext}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <p className="empty-state">Loading export history...</p>;

  return (
    <div>
      {error && <div className="form-error">{error}</div>}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>TYPE</th>
              <th>FORMAT</th>
              <th>STATUS</th>
              <th>CREATED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No exports yet
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.export_type.replace(/_/g, ' ')}</td>
                  <td>{job.format.toUpperCase()}</td>
                  <td>
                    <span
                      className={`status-badge status-badge--${job.status === 'done' ? 'completed' : job.status === 'failed' ? 'cancelled' : 'pending'}`}
                    >
                      {job.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{formatDateTime(job.created_at)}</td>
                  <td>
                    {job.status === 'done' && (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => handleDownload(job)}
                        aria-label="Download"
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
