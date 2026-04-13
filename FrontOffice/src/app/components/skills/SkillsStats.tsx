// Cartes de statistiques : total skills et skills avec description
import React from 'react';
import { Layers, FileText } from 'lucide-react';

interface SkillsStatsProps {
  totalSkills: number;          // total chargé (filtré par département si sélectionné)
  totalWithDescription: number; // parmi totalSkills, ceux avec description non vide
}

// Configuration des 2 cartes
const stats = (totalSkills: number, totalWithDescription: number) => [
  {
    label: 'Total skills',
    value: totalSkills,
    icon: Layers,
    iconClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-slate-200',
    valueClass: 'text-foreground',
  },
  {
    label: 'Avec description',
    value: totalWithDescription,
    icon: FileText,
    iconClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-slate-200',
    valueClass: 'text-foreground',
  },
];

export const SkillsStats: React.FC<SkillsStatsProps> = ({
  totalSkills,
  totalWithDescription,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {stats(totalSkills, totalWithDescription).map(
        ({ label, value, icon: Icon, iconClass, bgClass, borderClass, valueClass }) => (
          <div
            key={label}
            className={`flex items-center gap-4 rounded-xl border ${borderClass} bg-card p-4 shadow-sm transition hover:shadow-md`}
          >
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
              <Icon size={20} className={iconClass} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
            </div>
          </div>
        ),
      )}
    </div>
  );
};
