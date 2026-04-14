import React from 'react';
import { Calendar, Target, Edit, Trash2, Tag, Building2, BookOpen, Users, History } from 'lucide-react';
import { Activity, RequiredSkill } from './types';

type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';

interface ActivityCardProps {
  activity: Activity;
  departmentName?: string;
  userRole: UserRole;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onRecommend?: (activity: Activity) => void;
  onHistory?: (activity: Activity) => void;
}

const statusColors: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Validated: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-green-100 text-green-700',
  Completed: 'bg-purple-100 text-purple-700',
};

const contextColors: Record<string, string> = {
  Upskilling: 'bg-blue-50 text-blue-600',
  Expertise: 'bg-purple-50 text-purple-600',
  Consolidation: 'bg-green-50 text-green-600',
};

const levelColors: Record<string, string> = {
  Low: 'bg-yellow-50 text-yellow-700',
  Medium: 'bg-blue-50 text-blue-700',
  High: 'bg-green-50 text-green-700',
  Expert: 'bg-purple-50 text-purple-700',
};

const getSkillName = (rs: RequiredSkill): string => {
  if (typeof rs.skillId === 'object' && rs.skillId !== null) return rs.skillId.name;
  return String(rs.skillId);
};

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  departmentName,
  userRole,
  onEdit,
  onDelete,
  onRecommend,
  onHistory,
}) => {
  const canManage = userRole === 'Manager' || userRole === 'SUPERADMIN';

  return (
    <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:border-blue-200">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {activity.title}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[activity.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {activity.status}
              </span>
              {activity.context && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${contextColors[activity.context] ?? 'bg-gray-100 text-gray-600'}`}>
                  {activity.context}
                </span>
              )}
              {activity.type && (
                <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 font-medium flex items-center gap-1">
                  <Tag size={10} />
                  {activity.type}
                </span>
              )}
            </div>
          </div>

          {canManage && (
            <div className="flex gap-2 ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {onHistory && (
                <button
                  onClick={() => onHistory(activity)}
                  className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition-all hover:scale-110"
                  title="Historique recommandations"
                >
                  <History size={16} />
                </button>
              )}
              {onRecommend && (
                <button
                  onClick={() => onRecommend(activity)}
                  className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all hover:scale-110"
                  title="Recommandations"
                >
                  <Users size={16} />
                </button>
              )}
              <button
                onClick={() => onEdit(activity)}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all hover:scale-110"
                title="Modifier"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDelete(activity._id)}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all hover:scale-110"
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        {activity.description && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Info row */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          {(activity.startDate || activity.endDate) && (
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-green-500" />
              <span>
                {activity.startDate ? new Date(activity.startDate).toLocaleDateString('fr-FR') : '?'}
                {' → '}
                {activity.endDate ? new Date(activity.endDate).toLocaleDateString('fr-FR') : '?'}
              </span>
            </div>
          )}
          {activity.nombreDePlaces > 0 && (
            <div className="flex items-center gap-1.5">
              <Target size={14} className="text-purple-500" />
              <span>{activity.nombreDePlaces} place(s)</span>
            </div>
          )}
          {departmentName && (
            <div className="flex items-center gap-1.5">
              <Building2 size={14} className="text-indigo-500" />
              <span>{departmentName}</span>
            </div>
          )}
        </div>

        {/* Required Skills */}
        {activity.requiredSkills?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-500">
              <BookOpen size={13} />
              <span>Required Skills</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activity.requiredSkills.map((rs, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[rs.level] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {getSkillName(rs)} · {rs.level}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ActivityCard };
