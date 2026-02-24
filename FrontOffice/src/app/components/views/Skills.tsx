import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { SkillCard } from '../skills/SkillCard';
import { SkillForm } from '../skills/SkillForm';

interface Skill {
  _id: string;
  name: string;
  description?: string;
}

export const Skills: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await axios.get('http://localhost:3000/skills');
      setSkills(res.data);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement des skills');
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
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSkill(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Skills</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Ajouter Skill
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <SkillCard
            key={skill._id}
            id={skill._id}
            name={skill.name}
            description={skill.description}
            onEdit={() => handleEdit(skill)}
            onDelete={() => handleDelete(skill._id)}
          />
        ))}
      </div>

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