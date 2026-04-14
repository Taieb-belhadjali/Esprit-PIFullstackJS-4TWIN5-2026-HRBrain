import React from 'react';

interface DepartmentsStatsProps {
  totalDepartments: number;
  uniqueManagers: number;
  totalShown: number;
}

export const DepartmentsStats: React.FC<DepartmentsStatsProps> = ({
  totalDepartments,
  uniqueManagers,
  totalShown,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-card p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Total départements
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">{totalDepartments}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-card p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Managers distincts
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">{uniqueManagers}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-card p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Résultats affichés
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">{totalShown}</p>
      </div>
    </div>
  );
};
