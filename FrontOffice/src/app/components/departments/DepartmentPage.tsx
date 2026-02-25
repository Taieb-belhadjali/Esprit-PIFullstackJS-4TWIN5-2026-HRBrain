// src/app/components/departments/DepartmentPage.tsx
import React, { useEffect, useState } from 'react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from './departmentService';

interface Department {
  _id: string;
  name: string;
  user_id: string;
}

export const DepartmentPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await getDepartments();
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!newName) return alert('Enter department name');
    await createDepartment({ name: newName, user_id: '12345' });
    setNewName('');
    fetchDepartments();
  };

  const handleUpdate = async () => {
    if (!editName || !editId) return;
    await updateDepartment(editId, { name: editName });
    setEditId(null);
    setEditName('');
    fetchDepartments();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      await deleteDepartment(id);
      fetchDepartments();
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Departments</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="New Department"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border p-2 mr-2 rounded"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleCreate}>
          Add
        </button>
      </div>

      <ul>
        {departments.map((dept) => (
          <li key={dept._id} className="flex justify-between mb-2 items-center">
            {editId === dept._id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border p-1 mr-2 rounded"
                />
                <button className="bg-green-500 text-white px-2 py-1 mr-2 rounded" onClick={handleUpdate}>
                  Save
                </button>
                <button className="bg-gray-500 text-white px-2 py-1 rounded" onClick={() => setEditId(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span>{dept.name}</span>
                <div>
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 mr-2 rounded"
                    onClick={() => { setEditId(dept._id); setEditName(dept.name); }}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => handleDelete(dept._id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};