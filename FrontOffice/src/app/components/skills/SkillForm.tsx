import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SkillFormProps {
  onCreatedOrUpdated: () => void; // callback pour recharger la liste
  onCancel: () => void;
  skillToEdit?: {
    _id: string;
    name: string;
    description?: string;
  };
}

export const SkillForm: React.FC<SkillFormProps> = ({
  onCreatedOrUpdated,
  onCancel,
  skillToEdit,
}) => {
  const [name, setName] = useState(skillToEdit?.name || '');
  const [description, setDescription] = useState(skillToEdit?.description || '');

  useEffect(() => {
    if (skillToEdit) {
      setName(skillToEdit.name);
      setDescription(skillToEdit.description || '');
    }
  }, [skillToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting skill...', { name, description });
      if (skillToEdit) {
        // Update
        console.log(`Updating skill ${skillToEdit._id}...`);
        const response = await axios.patch(`http://localhost:1000/skills/${skillToEdit._id}`, {
          name,
          description,
        });
        console.log('Update success:', response.data);
      } else {
        // Create
        console.log('Creating new skill...');
        const response = await axios.post('http://localhost:1000/skills', { name, description });
        console.log('Create success:', response.data);
      }
      onCreatedOrUpdated();
      setName('');
      setDescription('');
      alert('Skill sauvegardé avec succès !');
    } catch (err: any) {
      console.error('Error details:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        alert(`Erreur: ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        console.error('No response received:', err.request);
        alert('Erreur: Pas de réponse du serveur. Vérifiez que le serveur est lancé sur http://localhost:1000');
      } else {
        console.error('Error message:', err.message);
        alert(`Erreur: ${err.message}`);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">
        {skillToEdit ? 'Modifier Skill' : 'Créer un Skill'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block mb-1 font-medium">Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {skillToEdit ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
};