import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { PageHero } from '../components/common/PageHero';
import { listGrades, createGrade, updateGrade } from '../api/grades';
import { getErrorMessage } from '../api/client';
import type { Grade } from '../types/v2';

const EMPTY_FORM = { name: '', level: 14 };

export function Grades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Grade | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadGrades = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listGrades();
      setGrades(data.sort((a, b) => b.level - a.level));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (grade: Grade) => {
    setEditing(grade);
    setForm({ name: grade.name, level: grade.level });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateGrade(editing.id, form);
      } else {
        await createGrade(form);
      }
      closeModal();
      await loadGrades();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHero
        eyebrow="ADMINISTRATION"
        title="Grades"
        description="Manage BPS grades used for task assignment hierarchy."
      />

      <div className="filters-bar">
        <div className="filters-bar__row filters-bar__row--actions">
          <p className="form-hint" style={{ margin: 0 }}>
            Higher level = senior grade. Officers assign to lower BPS grades in
            the same department.
          </p>
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} />
            Add Grade
          </button>
        </div>
      </div>

      {error && !modalOpen && <div className="form-error">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="empty-state">Loading grades...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>LEVEL</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {grades.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-state">
                    No grades found
                  </td>
                </tr>
              ) : (
                grades.map((g) => (
                  <tr key={g.id}>
                    <td className="col-title">{g.name}</td>
                    <td>{g.level}</td>
                    <td>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Edit"
                        onClick={() => openEdit(g)}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Grade' : 'Create Grade'}</h2>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleSubmit} className="modal-form">
              <label className="form-field">
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="BPS-16"
                  required
                />
              </label>
              <label className="form-field">
                <span>Level (numeric)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.level}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, level: Number(e.target.value) }))
                  }
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
