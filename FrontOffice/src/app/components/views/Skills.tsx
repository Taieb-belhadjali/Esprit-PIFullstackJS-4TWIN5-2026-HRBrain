import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { SkillCard } from '../skills/SkillCard';
import { SkillForm } from '../skills/SkillForm';
import { SkillGrandFormatCard } from '../skills/SkillGrandFormatCard';
import { SkillsFilters } from '../skills/SkillsFilters';
import { SkillsHeader } from '../skills/SkillsHeader';
import { SkillsStats } from '../skills/SkillsStats';
import { Skill, SkillSortBy } from '../skills/types';
import { useVoiceCommand } from '../voice/VoiceCommandContext';
import Pagination from '../ui/Pagination';


type UserRole = 'HR' | 'Manager' | 'Employee';

interface SkillsProps {
  userRole: UserRole;
}


export const Skills: React.FC<SkillsProps> = ({ userRole }) => {
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
        createSkillDirectly(commandData.name);
      } else {
        setShowForm(true);
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand, userRole]);

  // Écouter les commandes vocales pour modifier un skill
  useEffect(() => {
    if (pendingCommand === 'modify-skill') {
      if (skills.length === 0) return; // attendre le chargement
      if (commandData?.name) {
        const searchName = commandData.name.toLowerCase();
        const skillToEdit = skills.find(
          (skill) => skill.name.toLowerCase().includes(searchName)
        );
        if (skillToEdit) {
          setEditingSkill(skillToEdit);
          setShowForm(true);
        } else {
          alert(`Skill "${commandData.name}" non trouvé`);
        }
      } else {
        setShowForm(true);
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand, skills]);

  // Écouter les commandes vocales pour supprimer un skill
  useEffect(() => {
    if (pendingCommand === 'delete-skill') {
      if (skills.length === 0) return; // attendre le chargement
      if (commandData?.name) {
        const searchName = commandData.name.toLowerCase();
        const skillToDelete = skills.find(
          (skill) => skill.name.toLowerCase().includes(searchName)
        );
        if (skillToDelete) {
          if (window.confirm(`Voulez-vous vraiment supprimer le skill "${skillToDelete.name}" ?`)) {
            handleDelete(skillToDelete._id);
          }
        } else {
          alert(`Skill "${commandData.name}" non trouvé`);
        }
      } else {
        alert('Veuillez spécifier le nom du skill à supprimer');
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand, skills]);

  // Écouter les commandes vocales pour rechercher un skill
  useEffect(() => {
    if (pendingCommand === 'search-skill' || pendingCommand === 'filter-skill') {
      if (commandData?.name) {
        setSearchTerm(commandData.name);
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand]);

  const createSkillDirectly = async (name: string) => {
    try {
      await axios.post('http://localhost:3000/skills', {
        name: name,
        description: '',
        departmentId: departments[0]?._id || '',
      });
      await fetchSkills();
      alert(`Skill "${name}" créé avec succès !`);
    } catch (err) {
      console.error(err);
      alert(`Erreur lors de la création du skill "${name}"`);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('http://localhost:3000/departments');
      setDepartments(res.data);
    } catch (err) {
      setDepartments([]);
    }
  };

  const fetchSkills = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:3000/skills';
      if (selectedDepartment) {
        url += `?departmentId=${selectedDepartment}`;
      }
      const res = await axios.get(url);
      const validSkills = res.data.filter((skill: any) => skill.name);
      setSkills(validSkills);
    } catch (err) {
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce skill ?')) return;
    try {
      await axios.delete(`http://localhost:3000/skills/${id}`);
      fetchSkills();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSkill(null);
  };

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

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortBy, selectedDepartment]);

  const totalPages = Math.ceil(filteredSkills.length / itemsPerPage);
  const paginatedSkills = filteredSkills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="p-6 space-y-6">
      <SkillsHeader onAddSkill={() => setShowForm(true)} userRole={userRole} />



      <SkillsStats
        totalSkills={skills.length}
        totalWithDescription={totalWithDescription}
        totalShown={filteredSkills.length}
      />

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
          <p className="text-lg font-semibold text-slate-800">
            {skills.length === 0 ? 'Aucun skill pour le moment' : 'Aucun résultat trouvé'}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {skills.length === 0
              ? 'Commence par ajouter ton premier skill.'
              : 'Essaie une autre recherche ou modifie les filtres.'}
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
    </div>
  );
};
