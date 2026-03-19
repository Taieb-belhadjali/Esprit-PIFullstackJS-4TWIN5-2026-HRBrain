import React from 'react';
import { X } from 'lucide-react';
import { Skill } from './types';

interface SkillGrandFormatCardProps {
  skill: Skill;
  onClose: () => void;
  onEdit: (skill: Skill) => void;
}

export const SkillGrandFormatCard: React.FC<SkillGrandFormatCardProps> = ({
  skill,
  onClose,
  onEdit,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Aperçu</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{skill.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer l'aperçu"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-slate-800 leading-relaxed">
              {skill.description?.trim() || 'Aucune description fournie pour ce skill.'}
            </p>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => onEdit(skill)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Modifier
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
