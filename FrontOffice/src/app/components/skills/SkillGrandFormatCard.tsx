import React from 'react';
import { X } from 'lucide-react';
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Aperçu du skill</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{skill.name}</h2>
            {departmentName && (
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Département : {departmentName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-gray-900"
            aria-label="Fermer l'aperçu"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-xl border border-border bg-secondary p-4">
            <p className="text-sm font-medium text-gray-900">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {skill.description?.trim() || 'Aucune description fournie pour ce skill.'}
            </p>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => onEdit(skill)}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-secondary"
            >
              Modifier
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
