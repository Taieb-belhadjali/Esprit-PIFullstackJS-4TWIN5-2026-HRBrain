// src/app/components/dashboard/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Home } from '../views/Home';
import { Employees } from '../views/Employees';
import { Skills } from '../views/Skills';
import { Activities } from '../views/Activities';
import { Recommendations } from '../views/Recommendations';
import { Analytics } from '../views/Analytics';
import { Notifications } from '../views/Notifications';
import { Profile } from '../views/Profile';
import { Settings } from '../views/Settings';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../departments/departmentService';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface User {
  email: string;
  role: UserRole;
  name: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export type ViewType =
  | 'home'
  | 'employees'
  | 'skills'
  | 'activities'
  | 'recommendations'
  | 'analytics'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'departments'; // <-- added departments

interface Department {
  _id: string;
  name: string;
  user_id: string;
  employeesCount?: number;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Departments state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (currentView === 'departments') fetchDepartments();
  }, [currentView]);

  const fetchDepartments = async () => {
    try {
      const res = await getDepartments();
      setDepartments(res.data.map((d: any) => ({ ...d, employeesCount: 0 })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async () => {
    if (!newName) return alert('Enter department name');
    await createDepartment({ name: newName, user_id: user.email });
    setNewName('');
    setShowAddForm(false);
    fetchDepartments();
  };

  const handleUpdate = async () => {
    if (!editId || !editName) return alert('Enter name');
    await updateDepartment(editId, { name: editName });
    setEditId(null);
    setEditName('');
    fetchDepartments();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    await deleteDepartment(id);
    fetchDepartments();
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home userRole={user.role} />;
      case 'employees':
        return <Employees userRole={user.role} />;
      case 'skills':
        return <Skills userRole={user.role} />;
      case 'activities':
        return <Activities userRole={user.role} />;
      case 'recommendations':
        return <Recommendations userRole={user.role} />;
      case 'analytics':
        return <Analytics userRole={user.role} />;
      case 'notifications':
        return <Notifications />;
      case 'profile':
        return <Profile user={user} />;
      case 'settings':
        return <Settings onLogout={onLogout} />;
      case 'departments':
        return (
          <div className="p-4">
            <div className="flex justify-between mb-4">
              <h1 className="text-2xl font-bold">Departments</h1>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                onClick={() => setShowAddForm(true)}
              >
                Add Department
              </button>
            </div>

            {/* Add Form Modal */}
            {showAddForm && (
              <div className="bg-white p-4 border rounded shadow mb-4">
                <input
                  type="text"
                  placeholder="Department Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border p-2 mr-2 rounded"
                />
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600 transition"
                  onClick={handleAdd}
                >
                  Save
                </button>
                <button
                  className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Departments Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div key={dept._id} className="bg-white p-4 border rounded shadow relative">
                  {/* Edit/Delete Buttons */}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition"
                      onClick={() => {
                        setEditId(dept._id);
                        setEditName(dept.name);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                      onClick={() => handleDelete(dept._id)}
                    >
                      Delete
                    </button>
                  </div>

                  {editId === dept._id ? (
                    <div className="mt-6">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border p-2 mr-2 rounded"
                      />
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded mr-2 mt-2 hover:bg-green-600 transition"
                        onClick={handleUpdate}
                      >
                        Save
                      </button>
                      <button
                        className="bg-gray-500 text-white px-3 py-1 rounded mt-2 hover:bg-gray-600 transition"
                        onClick={() => setEditId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6">
                      <h2 className="text-lg font-bold">{dept.name}</h2>
                      <p className="mt-2 text-gray-600">Manager: {dept.user_id}</p>
                      <p className="mt-2 font-semibold">Employees: {dept.employeesCount}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return <Home userRole={user.role} />;
    }
  };

  return (
    <div className="flex h-screen bg-secondary overflow-hidden">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        userRole={user.role}
        userName={user.name}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main
        className={`flex-1 overflow-auto transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {renderView()}
      </main>
    </div>
  );
}