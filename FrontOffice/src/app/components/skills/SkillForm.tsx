// Formulaire création / modification d’un skill : appelle POST ou PATCH /skills
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Edit2, Building2, FileText, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Department, getDepartments } from '../departments/departmentService';

interface SkillFormProps {
  onCreatedOrUpdated: () => void;
  onCancel: () => void;
  skillToEdit?: {
    _id: string;
    name: string;
    description?: string;
    departmentId: string;
  };
}

export const SkillForm: React.FC<SkillFormProps> = ({
  onCreatedOrUpdated,
  onCancel,
  skillToEdit,
}) => {
  const [name, setName] = useState(skillToEdit?.name || '');
  const [description, setDescription] = useState(skillToEdit?.description || '');
  const [departmentId, setDepartmentId] = useState(skillToEdit?.departmentId || '');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (skillToEdit) {
      setName(skillToEdit.name);
      setDescription(skillToEdit.description || '');
      setDepartmentId(skillToEdit.departmentId || '');
    }
  }, [skillToEdit]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (err) {
        console.error(err);
        showToast('error', 'Erreur lors du chargement des départements');
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId) {
      showToast('error', 'Veuillez sélectionner un département');
      return;
    }
    setSubmitting(true);
    try {
      if (skillToEdit) {
        await axios.patch(`http://localhost:3000/skills/${skillToEdit._id}`, { name, description, departmentId });
      } else {
        await axios.post('http://localhost:3000/skills', { name, description, departmentId });
      }
      showToast('success', skillToEdit ? 'Skill mis à jour avec succès !' : 'Skill créé avec succès !');
      onCreatedOrUpdated();
      setName('');
      setDescription('');
      setDepartmentId('');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.statusText || err.message || 'Erreur inconnue';
      showToast('error', `Erreur : ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
      {/* Toast notification */}
      {toast && (
        <div
          className={`absolute left-4 right-4 top-4 z-10 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-600" />
            : <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
          }
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            {skillToEdit
              ? <Edit2 size={16} className="text-blue-600" />
              : <Plus size={16} className="text-blue-600" />
            }
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {skillToEdit ? 'Modifier le skill' : 'Nouveau skill'}
            </h2>
            <p className="text-xs text-slate-500">
              {skillToEdit ? 'Mettre à jour les informations' : 'Remplissez les champs ci-dessous'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
        {/* Nom */}
        <div>
          <label htmlFor="skill-name" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Tag size={13} className="text-blue-600" />
            Nom du skill
            <span className="text-red-500">*</span>
          </label>
          <input
            id="skill-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : React, Communication, SQL…"
            className="w-full rounded-xl border border-input bg-secondary/40 px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/40 transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="skill-description" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <FileText size={13} className="text-blue-600" />
            Description
            <span className="ml-1 text-xs font-normal text-muted-foreground">(optionnelle)</span>
          </label>
          <textarea
            id="skill-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez ce skill et son utilité dans l'organisation…"
            rows={3}
            className="w-full resize-none rounded-xl border border-input bg-secondary/40 px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/40 transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* Département */}
        <div>
          <label htmlFor="skill-department" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Building2 size={13} className="text-blue-600" />
            Département
            <span className="text-red-500">*</span>
          </label>
          <select
            id="skill-department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full rounded-xl border border-input bg-secondary/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            required
          >
            <option value="">— Sélectionner un département</option>
            {departments.map((dep) => (
              <option key={dep._id} value={dep._id}>{dep.name}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-input py-2.5 text-sm font-medium text-gray-700 transition hover:bg-secondary active:scale-95"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
          >
            {submitting ? 'Enregistrement…' : skillToEdit ? 'Mettre à jour' : 'Créer le skill'}
          </button>
        </div>
      </form>
    </div>
  );
};