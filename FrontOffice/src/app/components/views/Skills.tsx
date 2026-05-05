import React, { useState, useEffect, useMemo } from 'react';
import API, { apiGet } from '../../../api/api';
import { SkillCard } from '../skills/SkillCard';
import { SkillForm } from '../skills/SkillForm';
import { SkillGrandFormatCard } from '../skills/SkillGrandFormatCard';
import { SkillsFilters } from '../skills/SkillsFilters';
import { SkillsHeader } from '../skills/SkillsHeader';
import { SkillsStats } from '../skills/SkillsStats';
import { Skill, SkillSortBy } from '../skills/types';
import { useVoiceCommand } from '../voice/VoiceCommandContext';
import Pagination from '../ui/pagination';
import { SkillsDepartmentChart } from '../skills/SkillsDepartmentChart';
import { useAppTranslation } from '../../hooks/useAppTranslation';
import { ConfirmDialog } from '../ui/ConfirmDialog';


type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';

interface SkillsProps {
  userRole: UserRole;
  language?: string;
}


export const Skills: React.FC<SkillsProps> = ({ userRole }) => {
  const t = useAppTranslation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [confirmDeleteSkill, setConfirmDeleteSkill] = useState<Skill | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SkillSortBy>('name-asc');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [managerDeptId, setManagerDeptId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { pendingCommand, commandData, clearPendingCommand } = useVoiceCommand();

  useEffect(() => {
    const init = async () => {
      const deptRes = await apiGet('/departments').catch(() => ({ data: [] }));
      setDepartments(deptRes.data);

      if (userRole === 'Manager') {
        try {
          const meRes = await API.get('/users/me');
          const raw = meRes.data?.departmentId;
          const deptId = String(raw?._id ?? raw ?? '');
          if (deptId && deptId !== 'undefined') {
            setManagerDeptId(deptId);
            setSelectedDepartment(deptId);
            const skillRes = await API.get(`/skills?departmentId=${deptId}`);
            setSkills((skillRes.data as any[]).filter((s: any) => s.name));
            setLoading(false);
            return;
          }
        } catch { /* fallback to all skills */ }
      }

      const skillRes = await apiGet('/skills').catch(() => ({ data: [] }));
      setSkills((skillRes.data as any[]).filter((s: any) => s.name));
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    // Re-fetch skills when department filter changes (after initial load).
    // Managers always have selectedDepartment locked — skip re-fetch triggered by init.
    if (selectedDepartment === '') return;
    if (managerDeptId && selectedDepartment === managerDeptId) return;
    fetchSkills();
  }, [selectedDepartment]);

  // Écouter les commandes vocales pour créer un skill
  useEffect(() => {
    if (pendingCommand === 'create-skill') {
      if (userRole !== 'HR') {
        clearPendingCommand();
        return;
      }
      if (commandData?.name) {
        // L'item a déjà été créé par VoiceAssistant — juste recharger la liste
        fetchSkills();
      } else {
        setShowForm(true);
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand, userRole]);

  // Écouter les commandes vocales pour modifier un skill
  // VoiceAssistant a déjà effectué le PATCH — on rafraîchit seulement la liste
  useEffect(() => {
    if (pendingCommand === 'modify-skill') {
      fetchSkills();
      clearPendingCommand();
    }
  }, [pendingCommand, clearPendingCommand]);

  // Écouter les commandes vocales pour supprimer un skill
  // La suppression et confirmation sont gérées par VoiceAssistant — on rafraîchit juste la liste
  useEffect(() => {
    if (pendingCommand === 'delete-skill') {
      fetchSkills();
      clearPendingCommand();
    }
  }, [pendingCommand, clearPendingCommand]);

  // Écouter les commandes vocales pour rechercher un skill
  useEffect(() => {
    if (pendingCommand === 'search-skill' || pendingCommand === 'filter-skill') {
      if (commandData?.name) {
        setSearchTerm(commandData.name);
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand]);

  // Écouter les commandes vocales pour afficher le détail d'un skill
  useEffect(() => {
    if (pendingCommand === 'view-skill') {
      if (commandData?.name && skills.length > 0) {
        const found = skills.find(
          (s) => s.name.toLowerCase() === commandData.name!.toLowerCase()
        ) || skills.find(
          (s) => s.name.toLowerCase().includes(commandData.name!.toLowerCase())
        );
        if (found) setSelectedSkill(found);
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand, skills]);

  // Chargement initial des départements (kept for manual refresh after mutations)
  const fetchDepartments = async () => {
    try {
      const res = await apiGet('/departments');
      setDepartments(res.data);
    } catch {
      setDepartments([]);
    }
  };

  const fetchSkills = async () => {
    setLoading(true);
    try {
      let url = '/skills';
      if (selectedDepartment) {
        url += `?departmentId=${selectedDepartment}`;
      }
      const res = await API.get(url);
      const validSkills = res.data.filter((skill: any) => skill.name);
      setSkills(validSkills);
    } catch (err) {
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  // Ouvre le formulaire en mode édition
  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setShowForm(true);
  };

  // Supprime un skill après confirmation — WCAG 2.1.1 : ConfirmDialog remplace window.confirm()
  const handleDelete = (id: string) => {
    const skill = skills.find(s => s._id === id);
    if (skill) setConfirmDeleteSkill(skill);
  };

  const doDeleteSkill = async (id: string) => {
    try {
      await API.delete(`/skills/${id}`);
      fetchSkills();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  // Ferme le formulaire et réinitialise l’édition
  const handleFormClose = () => {
    setShowForm(false);
    setEditingSkill(null);
  };

  // Filtre par recherche + tri local
  const filteredSkills = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const result = skills.filter((skill) => {
      const nameMatch = skill.name.toLowerCase().includes(normalizedSearch);
      const descriptionMatch = (skill.description || '').toLowerCase().includes(normalizedSearch);
      const matchesSearch = normalizedSearch ? nameMatch || descriptionMatch : true;
      return matchesSearch;
    });
    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name, 'fr', { sensitivity: 'base' });
      }
      const aHasDesc = Boolean(a.description?.trim());
      const bHasDesc = Boolean(b.description?.trim());
      if (aHasDesc !== bHasDesc) {
        return aHasDesc ? -1 : 1;
      }
      return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    });
    return result;
  }, [skills, searchTerm, sortBy]);

  // Memoized — avoids re-counting on every render unrelated to skills data
  const totalWithDescription = useMemo(
    () => skills.filter((skill) => Boolean(skill.description?.trim())).length,
    [skills],
  );

  // Génère le fichier CSV avec BOM UTF-8 pour Excel
  const handleExportCsv = () => {
    if (filteredSkills.length === 0) return;
    const header = ['Nom', 'Description', 'Département', 'Date de création'];
    const rows = filteredSkills.map((skill: any) => {
      const depId = skill.departmentId?._id || skill.departmentId;
      const dep = departmentMap.get(depId);
      return [
        skill.name || '',
        skill.description || '—',
        dep ? dep.name : '—',
        skill.createdAt ? new Date(skill.createdAt).toLocaleDateString('fr-FR') : '—',
      ];
    });
    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skills_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // O(1) department lookup — avoids O(n) .find() inside the render loop
  const departmentMap = useMemo(
    () => new Map(departments.map((d) => [d._id, d])),
    [departments],
  );

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortBy, selectedDepartment]);

  const totalPages = Math.ceil(filteredSkills.length / itemsPerPage);
  const paginatedSkills = filteredSkills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="p-6 space-y-6">
      <SkillsHeader 
        onAddSkill={() => setShowForm(true)} 
        onExportCsv={handleExportCsv} 
        userRole={userRole}
        t={t}
      />

      <SkillsStats
        totalSkills={skills.length}
        totalWithDescription={totalWithDescription}
      />

      <SkillsDepartmentChart skills={skills} departments={departments} />

      <SkillsFilters
        searchTerm={searchTerm}
        sortBy={sortBy}
        selectedDepartment={selectedDepartment}
        departments={departments}
        onSearchChange={setSearchTerm}
        onSortChange={setSortBy}
        onDepartmentChange={setSelectedDepartment}
        readOnlyDepartment={userRole === 'Manager'}
        onReset={() => {
          setSearchTerm('');
          setSortBy('name-asc');
          // Managers must keep their department filter locked
          if (userRole !== 'Manager') setSelectedDepartment('');
        }}
        t={t}
      />

      {/* WCAG 4.1.3 — aria-live annonce le changement d'état aux lecteurs d'écran */}
      <div aria-live="polite" aria-atomic="true">
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Chargement des skills…">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-xl border-2 border-slate-100 bg-slate-50"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-lg font-semibold text-foreground">
            {skills.length === 0 ? t('skills_no_skills_yet') : t('skills_no_results')}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {skills.length === 0
              ? t('skills_start_adding')
              : t('skills_try_different_search')}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedSkills.map((skill) => {
              const department = departmentMap.get(skill.departmentId as any);
              return (
                <SkillCard
                  key={skill._id}
                  id={skill._id}
                  name={skill.name}
                  description={skill.description}
                  departmentName={department ? department.name : ''}
                  skillObj={skill}
                  userRole={userRole}
                  onEdit={() => handleEdit(skill)}
                  onDelete={() => handleDelete(skill._id)}
                  onPreview={setSelectedSkill}
                />
              );
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSkills.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
      </div>{/* end aria-live */}

      {/* Formulaire Create / Update */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <SkillForm
            skillToEdit={editingSkill || undefined}
            onCreatedOrUpdated={() => {
              fetchSkills();
              handleFormClose();
            }}
            onCancel={handleFormClose}
          />
        </div>
      )}

      {/* Aperçu détaillé d'un skill */}
      {selectedSkill && (
        <SkillGrandFormatCard
          skill={selectedSkill}
          departmentName={(() => {
            const department = departmentMap.get(selectedSkill.departmentId as any);
            return department ? department.name : undefined;
          })()}
          onClose={() => setSelectedSkill(null)}
          onEdit={(skill) => {
            setSelectedSkill(null);
            handleEdit(skill);
          }}
        />
      )}

      {/* WCAG 2.1.1 — ConfirmDialog remplace window.confirm() */}
      <ConfirmDialog
        open={!!confirmDeleteSkill}
        title="Supprimer le skill"
        message={`Voulez-vous vraiment supprimer "${confirmDeleteSkill?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={async () => {
          if (confirmDeleteSkill) {
            await doDeleteSkill(confirmDeleteSkill._id);
            setConfirmDeleteSkill(null);
          }
        }}
        onCancel={() => setConfirmDeleteSkill(null)}
      />

    </div>
  );
};


