import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { createExport, downloadExport } from '../../api/exports';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type {
  ExportType,
  ExportFormat,
  ExportFilters,
} from '../../types/exports';

interface ExportFormProps {
  initialFilters?: ExportFilters;
  onSuccess?: () => void;
}

export function ExportForm({ initialFilters, onSuccess }: ExportFormProps) {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const [exportType, setExportType] = useState<ExportType>('my_tasks');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [filters, setFilters] = useState<ExportFilters>(initialFilters ?? {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const exportOptions = useMemo(
    () =>
      [
        {
          value: 'my_tasks' as ExportType,
          label: 'My Tasks',
          show: hasPermission('task.export'),
        },
        {
          value: 'dept_tasks' as ExportType,
          label: 'Department Tasks',
          show:
            hasPermission('task.export') &&
            hasPermission('task.view_all'),
        },
        {
          value: 'all_tasks' as ExportType,
          label: 'All Tasks',
          show:
            hasPermission('task.export') && hasPermission('task.view_all'),
        },
        {
          value: 'user_report' as ExportType,
          label: 'User Report',
          show: hasPermission('report.view_all'),
        },
        {
          value: 'dept_report' as ExportType,
          label: 'Department Report',
          show: hasAnyPermission('report.view_all', 'report.view_own'),
        },
        {
          value: 'audit_trail' as ExportType,
          label: 'Audit Trail',
          show:
            user?.role_name === 'super_admin' || user?.role_name === 'admin',
        },
      ].filter((o) => o.show),
    [hasPermission, hasAnyPermission, user?.role_name],
  );

  const handleExport = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await createExport({
        export_type: exportType,
        format,
        filters: Object.keys(filters).length ? filters : undefined,
      });
      const ext = format === 'xlsx' ? 'xlsx' : format;
      await downloadExport(result.job_id, `${exportType}.${ext}`);
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-form">
      {error && <div className="form-error">{error}</div>}

      <div className="form-row">
        <label className="form-field">
          <span>Export Type</span>
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value as ExportType)}
          >
            {exportOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Format</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
          >
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="form-field">
          <span>Status filter</span>
          <select
            value={filters.status ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value || undefined }))
            }
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="form-field">
          <span>Priority filter</span>
          <select
            value={filters.priority ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                priority: e.target.value || undefined,
              }))
            }
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="form-field">
          <span>From date</span>
          <input
            type="date"
            value={filters.date_from ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                date_from: e.target.value || undefined,
              }))
            }
          />
        </label>
        <label className="form-field">
          <span>To date</span>
          <input
            type="date"
            value={filters.date_to ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                date_to: e.target.value || undefined,
              }))
            }
          />
        </label>
      </div>

      <button
        type="button"
        className="btn btn--primary"
        onClick={handleExport}
        disabled={loading || exportOptions.length === 0}
      >
        <Download size={18} />
        {loading ? 'Generating...' : 'Download Export'}
      </button>
    </div>
  );
}
