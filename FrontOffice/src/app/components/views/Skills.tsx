// Vue principale Skills : liste, filtres, pagination, export CSV, graphique départements
import React, { useState, useEffect, useMemo } from 'react';
import API from '../../../api/api';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SkillSortBy>('name-asc');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { pendingCommand, commandData, clearPendingCommand } = useVoiceCommand();

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
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

  // Chargement initial des départements
  const fetchDepartments = async () => {
    try {
      const res = await API.get('/departments');
      setDepartments(res.data);
    } catch (err) {
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

  // Supprime un skill après confirmation
  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce skill ?')) return;
    try {
      await API.delete(`/skills/${id}`);
      fetchSkills();
    } catch (err) {
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

  const totalWithDescription = skills.filter((skill) => Boolean(skill.description?.trim())).length;

  // Génère le fichier CSV avec BOM UTF-8 pour Excel
  const handleExportCsv = () => {
    if (filteredSkills.length === 0) return;
    const header = ['Nom', 'Description', 'Département', 'Date de création'];
    const rows = filteredSkills.map((skill: any) => {
      const depId = skill.departmentId?._id || skill.departmentId;
      const dep = departments.find((d: any) => d._id === depId);
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
        onReset={() => {
          setSearchTerm('');
          setSortBy('name-asc');
          setSelectedDepartment('');
        }}
        t={t}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-xl border-2 border-slate-100 bg-slate-50"
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
              const department = departments.find(dep => dep._id === skill.departmentId);
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

      {/* Aperçu détaillé d'un skill (commande vocale "afficher skill X") */}
      {selectedSkill && (
        <SkillGrandFormatCard
          skill={selectedSkill}
          departmentName={(() => {
            const department = departments.find((dep) => dep._id === selectedSkill.departmentId);
            return department ? department.name : undefined;
          })()}
          onClose={() => setSelectedSkill(null)}
          onEdit={(skill) => {
            setSelectedSkill(null);
            handleEdit(skill);
          }}
        />
      )}

    </div>
  );
};


