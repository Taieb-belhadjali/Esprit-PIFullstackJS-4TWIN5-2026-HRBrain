import React from 'react';
import { Plus, Sparkles } from 'lucide-react';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface SkillsHeaderProps {
  onAddSkill: () => void;
  userRole?: UserRole;
}

export const SkillsHeader: React.FC<SkillsHeaderProps> = ({ onAddSkill, userRole }) => {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles size={14} />
            Gestion intelligente des skills
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Skills</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gère les compétences de l&apos;organisation, filtre par département et prépare les activités.
          </p>
        </div>
        {userRole === 'HR' && (
        <button
          onClick={onAddSkill}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90"
        >
          <Plus size={18} />
          Ajouter Skill
        </button>
        )}
      </div>
    </div>
  );
};
