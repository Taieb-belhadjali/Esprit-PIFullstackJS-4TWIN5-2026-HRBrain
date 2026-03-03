import React, { useEffect, useState } from 'react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from './departmentService';

interface Department {
  _id: string;
  name: string;
  user_id: string;
}

const DepartmentPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newName, setNewName] = useState('');
  const [newManager, setNewManager] = useState('');  // 👈 إضافة حقل manager
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editManager, setEditManager] = useState(''); // 👈 إضافة edit manager
  const [showForm, setShowForm] = useState(false);    // 👈 للتحكم في ظهور الفورم
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      console.log('Departments loaded:', data); // للتحقق
      setDepartments(data);
    } catch (err) {
      console.error('Error loading departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return alert('Enter department name');
    if (!newManager.trim()) return alert('Enter manager name');
    
    try {
      await createDepartment({ 
        name: newName, 
        user_id: newManager  // استعمل manager بدل user_id
      });
      setNewName('');
      setNewManager('');
      setShowForm(false);
      await loadDepartments();
    } catch (err) {
      console.error('Error creating department:', err);
      alert('Failed to create department');
    }
  };

  const handleUpdate = async () => {
    if (!editName.trim() || !editId) return;
    if (!editManager.trim()) return alert('Enter manager name');
    
    try {
      await updateDepartment(editId, { 
        name: editName,
        user_id: editManager 
      });
      setEditId(null);
      setEditName('');
      setEditManager('');
      await loadDepartments();
    } catch (err) {
      console.error('Error updating department:', err);
      alert('Failed to update department');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    
    try {
      await deleteDepartment(id);
      await loadDepartments();
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('Failed to delete department');
    }
  };

  return (
    <div className="p-8">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Departments</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <span>+</span> Add Department
        </button>
      </div>

      {/* Add Department Form - يظهر فقط عند الضغط على Add */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Add New Department</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Name
              </label>
              <input
                type="text"
                placeholder="e.g. IT, HR, Marketing"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager Name
              </label>
              <input
                type="text"
                placeholder="e.g. manager1, John Doe"
                value={newManager}
                onChange={(e) => setNewManager(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
            >
              Save Department
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading departments...</p>
        </div>
      )}

      {/* Departments Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div key={dept._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {editId === dept._id ? (
                // Edit Mode
                <div className="p-5">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                    />
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager Name
                    </label>
                    <input
                      type="text"
                      value={editManager}
                      onChange={(e) => setEditManager(e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="p-5">
                    <h3 className="font-bold text-xl mb-2 text-gray-800">{dept.name}</h3>
                    <p className="text-gray-600 mb-4">
                      <span className="font-medium">Manager:</span> {dept.user_id}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditId(dept._id);
                          setEditName(dept.name);
                          setEditManager(dept.user_id);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(dept._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && departments.length === 0 && !showForm && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-4">No departments found</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded inline-flex items-center gap-2"
          >
            <span>+</span> Add Your First Department
          </button>
        </div>
      )}
    </div>
  );
};

export default DepartmentPage;