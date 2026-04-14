// Carte d'un skill : nom, département, description, boutons modifier/supprimer (HR)
import React from 'react';
import { Edit2, Trash2, ArrowRight, Building2 } from 'lucide-react';
import { Skill } from './types';

type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';

interface SkillCardProps {
  id: string;
  name: string;
  description?: string;
  departmentName?: string;
  skillObj: Skill;
  userRole?: UserRole;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview?: (skill: Skill) => void;
}

const getColor = (_name: string) => ({ bg: 'bg-blue-50', text: 'text-blue-700', bar: 'from-blue-500 to-indigo-600' });

const SkillCard: React.FC<SkillCardProps> = ({
  id,
  name,
  description,
  departmentName,
  skillObj,
  userRole,
  onEdit,
  onDelete,
  onPreview,
}) => {
  const canManage = userRole === 'HR';
  const color = getColor(name);
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className="group relative flex flex-col bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer hover:border-blue-200"
      onClick={() => onPreview?.(skillObj)}
      role="button"
      tabIndex={0}
      aria-label={`Voir le skill ${name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPreview?.(skillObj);
        }
      }}
    >
      {/* Colored top bar */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold ${color.bg} ${color.text}`}>
            {initial}
          </div>

          {/* Name + department */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors leading-snug truncate">
              {name}
            </h3>
            {departmentName && (
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Building2 size={10} />
                {departmentName}
              </span>
            )}
          </div>

          {/* Action buttons — visible on hover for HR */}
          {canManage && (
            <div
              className="flex gap-1 opacity-100 transition-opacity duration-200 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(id); }}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all hover:scale-110 active:scale-95"
                title="Modifier"
                aria-label={`Modifier ${name}`}
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all hover:scale-110 active:scale-95"
                title="Supprimer"
                aria-label={`Supprimer ${name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1 min-h-[2.5rem]">
          {description
            ? description
            : <span className="italic opacity-50">Aucune description renseignée</span>
          }
        </p>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-blue-600 transition-colors">
            Voir les détails
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </span>
        </div>
      </div>
    </div>
  );
};

export { SkillCard };