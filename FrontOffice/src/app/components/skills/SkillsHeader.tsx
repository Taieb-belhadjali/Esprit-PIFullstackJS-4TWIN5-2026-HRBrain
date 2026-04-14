// En-tête de la page Skills : titre, bouton Export CSV, bouton Ajouter (HR uniquement)
import React from 'react';
import { Plus, Download, Brain } from 'lucide-react';

type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';

// onAddSkill : ouvre le formulaire | onExportCsv : optionnel | userRole : seul HR voit "Ajouter"
interface SkillsHeaderProps {
  onAddSkill: () => void;
  onExportCsv?: () => void;
  userRole?: UserRole;
}

export const SkillsHeader: React.FC<SkillsHeaderProps> = ({ onAddSkill, onExportCsv, userRole }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Titre */}
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-medium text-blue-600 shadow-sm">
              Référentiel des compétences
            </div>
            <h1 className="mt-2 text-2xl font-bold text-foreground">Skills</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Gérez les compétences de l&apos;organisation par département
            </p>
          </div>
        </div>
        {/* Boutons d’action */}
        <div className="flex items-center gap-2">
          {/* Export CSV — si prop fournie */}
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              <Download size={15} />
              Export CSV
            </button>
          )}
          {/* Ajouter — HR uniquement */}
          {userRole === 'HR' && (
            <button
              onClick={onAddSkill}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              <Plus size={15} />
              Ajouter Skill
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
