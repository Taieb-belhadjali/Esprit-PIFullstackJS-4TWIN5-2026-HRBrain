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
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Total départements
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{totalDepartments}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Managers distincts
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{uniqueManagers}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Résultats affichés
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{totalShown}</p>
      </div>
    </div>
  );
};
