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
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total skills</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{totalSkills}</p>
      </div>
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avec description</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{totalWithDescription}</p>
      </div>
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Résultats affichés</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{totalShown}</p>
      </div>
    </div>
  );
};
