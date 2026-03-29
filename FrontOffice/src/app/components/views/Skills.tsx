import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { SkillCard } from '../skills/SkillCard';
import { SkillForm } from '../skills/SkillForm';
import { SkillGrandFormatCard } from '../skills/SkillGrandFormatCard';
import { SkillsFilters } from '../skills/SkillsFilters';
import { SkillsHeader } from '../skills/SkillsHeader';
import { SkillsStats } from '../skills/SkillsStats';
import { Skill, SkillSortBy } from '../skills/types';


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

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [selectedDepartment]);

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

  return (
    <div className="p-6 space-y-6">
      <SkillsHeader onAddSkill={() => setShowForm(true)} />



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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => {
            const department = departments.find(dep => dep._id === skill.departmentId);
            return (
              <SkillCard
                key={skill._id}
                id={skill._id}
                name={skill.name}
                description={skill.description}
                departmentName={department ? department.name : ''}
                skillObj={skill}
                onEdit={() => handleEdit(skill)}
                onDelete={() => handleDelete(skill._id)}
                onPreview={setSelectedSkill}
              />
            );
          })}
        </div>
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