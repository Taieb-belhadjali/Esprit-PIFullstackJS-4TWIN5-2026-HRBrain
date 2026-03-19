import React from 'react';

interface SkillsStatsProps {
  totalSkills: number;
  totalWithDescription: number;
  totalShown: number;
}

export const SkillsStats: React.FC<SkillsStatsProps> = ({
  totalSkills,
  totalWithDescription,
  totalShown,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total skills</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{totalSkills}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Avec description</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{totalWithDescription}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Résultats affichés</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{totalShown}</p>
      </div>
    </div>
  );
};
