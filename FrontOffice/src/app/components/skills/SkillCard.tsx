import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface SkillCardProps {
  id: string;
  name: string;
  description?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview?: (id: string) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  id,
  name,
  description,
  onEdit,
  onDelete,
  onPreview,
}) => {
  return (
    <div
      className="group cursor-pointer bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:border-blue-200"
      onClick={() => onPreview?.(id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onPreview?.(id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Ouvrir le détail du skill ${name}`}
    >
      {/* Header with gradient accent */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
      
      <div className="p-5 flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
          {description && (
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">{description}</p>
          )}
        </div>

  {/* Modern icon buttons */}
        <div className="flex gap-2 ml-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onEdit(id);
            }}
            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all hover:scale-110 active:scale-95"
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
      </div>
    </div>
  );
};