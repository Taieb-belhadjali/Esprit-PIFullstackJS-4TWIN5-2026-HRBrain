// Modal détail d’un skill : nom, département, description complète, bouton modifier
import React from 'react';
import { X, Edit2, Building2, FileText } from 'lucide-react';
import { Skill } from './types';

interface SkillGrandFormatCardProps {
  skill: Skill;
  departmentName?: string;
  onClose: () => void;
  onEdit: (skill: Skill) => void;
}

export const SkillGrandFormatCard: React.FC<SkillGrandFormatCardProps> = ({
  skill,
  departmentName,
  onClose,
  onEdit,
}) => {
  const initial = skill.name.charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
        <div className="flex items-start justify-between px-6 py-5 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-700">
              {initial}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Aperçu du skill</p>
              <h2 className="mt-0.5 text-xl font-bold text-slate-900">{skill.name}</h2>
              {departmentName && (
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                  <Building2 size={10} />
                  {departmentName}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer l'aperçu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={13} className="text-blue-600" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
            </div>
            {skill.description?.trim() ? (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {skill.description}
              </p>
            ) : (
              <p className="text-sm italic text-slate-400">
                Aucune description renseignée pour ce skill.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95"
            >
              Fermer
            </button>
            <button
              onClick={() => onEdit(skill)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95"
            >
              <Edit2 size={14} />
              Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
