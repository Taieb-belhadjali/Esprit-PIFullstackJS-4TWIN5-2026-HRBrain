
import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Skill } from './types';

type UserRole = 'HR' | 'Manager' | 'Employee';

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

  return (
    <div
      className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-border overflow-hidden hover:border-primary/40"
      onClick={() => {
        if (onPreview) {
          onPreview(skillObj);
        }
      }}
    >
      {/* Header with gradient accent */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40"></div>

      <div className="p-5 flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors">
            {name}
          </h3>
          {departmentName && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Département : {departmentName}
            </p>
          )}
          {description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {description}
            </p>
          )}
        </div>

        {/* Boutons Edit/Delete — visibles seulement pour HR */}
        {canManage && (
        <div className="flex gap-2 ml-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onEdit(id);
            }}
            className="p-2 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary hover:text-primary transition-all hover:scale-110 active:scale-95"
            title="Modifier"
            aria-label="Modifier"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete(id);
            }}
            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all hover:scale-110 active:scale-95"
            title="Supprimer"
            aria-label="Supprimer"
          >
            <Trash2 size={18} />
          </button>
        </div>
        )}
      </div>
    </div>
  );
};

export { SkillCard };