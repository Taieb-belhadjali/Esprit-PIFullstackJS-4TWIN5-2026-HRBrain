// Graphique répartition des skills par département (collapsible)
import React, { useMemo, useState } from 'react';
import { BarChart2, ChevronDown, ChevronUp } from 'lucide-react';

interface Department {
  _id: string;
  name: string;
}

interface Skill {
  _id: string;
  departmentId: string;
}

interface SkillsDepartmentChartProps {
  skills: Skill[];
  departments: Department[];
}

const COLORS = [
  { bar: 'from-blue-600 to-indigo-500',  badge: 'bg-blue-50 text-blue-700' },
  { bar: 'from-blue-500 to-blue-300',    badge: 'bg-blue-50 text-blue-600' },
  { bar: 'from-indigo-600 to-indigo-400',badge: 'bg-indigo-50 text-indigo-700' },
  { bar: 'from-indigo-500 to-blue-400',  badge: 'bg-indigo-50 text-indigo-600' },
  { bar: 'from-blue-700 to-blue-500',    badge: 'bg-blue-50 text-blue-800' },
  { bar: 'from-slate-500 to-slate-400',  badge: 'bg-slate-100 text-slate-700' },
  { bar: 'from-blue-400 to-indigo-300',  badge: 'bg-blue-50 text-blue-600' },
  { bar: 'from-indigo-400 to-blue-300',  badge: 'bg-indigo-50 text-indigo-600' },
];

export const SkillsDepartmentChart: React.FC<SkillsDepartmentChartProps> = ({
  skills,
  departments,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    skills.forEach((skill) => {
      const depId = (skill.departmentId as any)?._id || skill.departmentId;
      if (depId) counts[depId] = (counts[depId] || 0) + 1;
    });

    const rows = departments
      .map((dep) => ({ dep, count: counts[dep._id] || 0 }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);

    const max = rows[0]?.count || 1;
    return { rows, max };
  }, [skills, departments]);

  if (data.rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <BarChart2 size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Répartition par département</h2>
            <p className="text-xs text-slate-500">{data.rows.length} département{data.rows.length > 1 ? 's' : ''} · {skills.length} skills au total</p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-secondary hover:text-gray-900"
          aria-label={collapsed ? 'Afficher le graphique' : 'Masquer le graphique'}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {collapsed ? 'Afficher' : 'Masquer'}
        </button>
      </div>

      {/* Chart body */}
      {!collapsed && (
        <div className="p-6 space-y-3.5">
          {data.rows.map(({ dep, count }, index) => {
            const pct = Math.round((count / data.max) * 100);
            const totalPct = Math.round((count / skills.length) * 100);
            const color = COLORS[index % COLORS.length];

            return (
              <div key={dep._id} className="group flex items-center gap-4">
                {/* Rank */}
                <span className="w-5 text-right text-xs font-medium text-slate-400">
                  {index + 1}
                </span>

                {/* Department name */}
                <div className="w-36 flex-shrink-0">
                  <span className="block truncate text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                    {dep.name}
                  </span>
                </div>

                {/* Bar */}
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${color.bar} transition-all duration-700 ease-out`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Count badge */}
                <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color.badge}`}>
                  {count} skill{count > 1 ? 's' : ''}
                </span>

                {/* Percentage */}
                <span className="w-10 flex-shrink-0 text-right text-xs text-slate-400">
                  {totalPct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
