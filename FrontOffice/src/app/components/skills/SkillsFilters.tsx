import React from 'react';
import { Search, SlidersHorizontal, Building2, RotateCcw } from 'lucide-react';
import { SkillSortBy } from './types';

interface Department {
  _id: string;
  name: string;
}

interface SkillsFiltersProps {
  searchTerm: string;
  sortBy: SkillSortBy;
  selectedDepartment: string;
  departments: Department[];
  onSearchChange: (value: string) => void;
  onSortChange: (value: SkillSortBy) => void;
  onDepartmentChange: (value: string) => void;
  onReset: () => void;
}

export const SkillsFilters: React.FC<SkillsFiltersProps> = ({
  searchTerm,
  sortBy,
  selectedDepartment,
  departments,
  onSearchChange,
  onSortChange,
  onDepartmentChange,
  onReset,
}) => {
  const hasActiveFilters = searchTerm || sortBy !== 'name-asc' || selectedDepartment;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Main filter bar */}
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-4">
        {/* Department filter */}
        <div className="flex items-center gap-2 lg:min-w-[200px]">
          <Building2 size={16} className="flex-shrink-0 text-slate-500" />
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Tous les départements</option>
            {departments.map((dep) => (
              <option key={dep._id} value={dep._id}>
                {dep.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par nom ou description..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 lg:min-w-[180px]">
          <SlidersHorizontal size={16} className="flex-shrink-0 text-slate-500" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SkillSortBy)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="name-asc">Nom (A → Z)</option>
            <option value="name-desc">Nom (Z → A)</option>
            <option value="desc-first">Descriptions en premier</option>
          </select>
        </div>


        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <RotateCcw size={14} />
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
};
