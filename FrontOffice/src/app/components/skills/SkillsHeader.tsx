import React from 'react';
import { Plus, Sparkles } from 'lucide-react';

interface SkillsHeaderProps {
  onAddSkill: () => void;
}

export const SkillsHeader: React.FC<SkillsHeaderProps> = ({ onAddSkill }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-600 shadow-sm">
            <Sparkles size={14} />
            Gestion intelligente des skills
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Skills</h1>
          <p className="mt-1 text-sm text-slate-600">
            Organise, recherche et trie tes compétences rapidement.
          </p>
        </div>
        <button
          onClick={onAddSkill}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Ajouter Skill
        </button>
      </div>
    </div>
  );
};
