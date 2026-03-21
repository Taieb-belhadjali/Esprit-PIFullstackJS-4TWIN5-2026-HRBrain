import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { SkillSortBy } from './types';

interface SkillsFiltersProps {
  searchTerm: string;
  sortBy: SkillSortBy;
  withDescriptionOnly: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SkillSortBy) => void;
  onWithDescriptionOnlyChange: (value: boolean) => void;
  onReset: () => void;
}

export const SkillsFilters: React.FC<SkillsFiltersProps> = ({
  searchTerm,
  sortBy,
  withDescriptionOnly,
  onSearchChange,
  onSortChange,
  onWithDescriptionOnlyChange,
  onReset,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher par nom ou description..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-slate-500" />
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as SkillSortBy)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="name-asc">Nom (A → Z)</option>
            <option value="name-desc">Nom (Z → A)</option>
            <option value="desc-first">Descriptions en premier</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={withDescriptionOnly}
            onChange={(event) => onWithDescriptionOnlyChange(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Afficher uniquement les skills avec description
        </label>
        <button
          onClick={onReset}
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
};
