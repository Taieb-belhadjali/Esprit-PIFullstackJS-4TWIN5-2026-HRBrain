// Filtres de la liste skills : recherche texte, filtre département, tri
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
  t?: (key: string) => string | undefined;
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
  t,
}) => {
  const hasActiveFilters = searchTerm || sortBy !== 'name-asc' || selectedDepartment;
  const translate = t || ((key: string) => key);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Main filter bar */}
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-4">
        {/* Department filter */}
        <div className="flex items-center gap-2 lg:min-w-[200px]">
          <Building2 size={16} className="flex-shrink-0 text-muted-foreground" />
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="">{translate('skills_all_departments')}</option>
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
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={translate('skills_search_placeholder')}
            className="w-full rounded-lg border border-input py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 lg:min-w-[180px]">
          <SlidersHorizontal size={16} className="flex-shrink-0 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SkillSortBy)}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="name-asc">{translate('skills_sort_name_asc')}</option>
            <option value="name-desc">{translate('skills_sort_name_desc')}</option>
            <option value="desc-first">{translate('skills_sort_desc_first')}</option>
          </select>
        </div>


        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <RotateCcw size={14} />
            {translate('skills_reset')}
          </button>
        )}
      </div>
    </div>
  );
};
