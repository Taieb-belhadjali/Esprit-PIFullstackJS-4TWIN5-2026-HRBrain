import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Home } from "../views/Home";
import { Employees } from "../views/Employees";
import { Skills } from "../views/Skills";
import { Activities } from "../views/Activities";
import { Recommendations } from "../views/Recommendations";
import { Analytics } from "../views/Analytics";
import { Notifications } from "../views/Notifications";
import { Profile } from "../views/Profile";
import { Settings } from "../views/Settings";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../departments/departmentService";
import { Department } from "../departments/departmentService";

type UserRole = "HR" | "Manager" | "Employee";

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
  | "home"
  | "employees"
  | "skills"
  | "activities"
  | "recommendations"
  | "analytics"
  | "notifications"
  | "profile"
  | "settings"
  | "departments";

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newManager, setNewManager] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editManager, setEditManager] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentView === "departments" && user.role === "HR") {
      fetchDepartments();
    }
  }, [currentView]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return alert("Enter department name");
    if (!newManager.trim()) return alert("Enter manager name");

    try {
      await createDepartment({
        name: newName,
        user_id: newManager,
      });
      setNewName("");
      setNewManager("");
      setShowAddForm(false);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      alert("Failed to create department");
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) {
      alert("Please enter department name");
      return;
    }
    if (!editManager.trim()) {
      alert("Please enter manager name");
      return;
    }

    try {
      console.log('📤 Sending update request:', { 
        id: editId, 
        data: { 
          name: editName,
          user_id: editManager 
        }
      });
      
      await updateDepartment(editId, { 
        name: editName,
        user_id: editManager 
      });
      
      console.log('✅ Update successful');
      setEditId(null);
      setEditName("");
      setEditManager("");
      await fetchDepartments();
      alert("Department updated successfully!");
    } catch (err: any) {
      console.error('❌ Update error:', err);
      console.error('❌ Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.message || "Failed to update department";
      alert(`Failed to update department: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this department?")) return;

    try {
      await deleteDepartment(id);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      alert("Failed to delete department");
    }
  };

  const renderDepartments = () => {
    if (user.role !== "HR") return <div className="p-6 text-center text-gray-500">Access Denied</div>;

    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Departments</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <span className="text-lg">+</span> Add Department
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Department</h2>
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
                onClick={handleAdd}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                Save Department
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                  setNewManager("");
                }}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {departments.map((dept) => (
              <div key={dept._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-100">
                {editId === dept._id ? (
                  // Edit Mode
                  <div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department Name
                      </label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Department name"
                      />
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Manager Name
                      </label>
                      <input
                        value={editManager}
                        onChange={(e) => setEditManager(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Manager name"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdate}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm transition-colors flex-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm transition-colors flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <h3 className="font-bold text-xl mb-2 text-gray-800">{dept.name}</h3>
                    <p className="text-gray-600 mb-1 text-xs">ID: {dept._id}</p>
                    <p className="text-gray-600 mb-4 text-sm">
                      <span className="font-medium">Manager:</span> {dept.user_id}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditId(dept._id);
                          setEditName(dept.name);
                          setEditManager(dept.user_id);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1 flex-1 justify-center"
                      >
                        <span>✏️</span> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(dept._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1 flex-1 justify-center"
                      >
                        <span>🗑️</span> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && departments.length === 0 && !showAddForm && (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg mb-4">No departments found</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded inline-flex items-center gap-2"
            >
              <span>+</span> Add Your First Department
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderView = () => {
    switch (currentView) {
      case "departments":
        return renderDepartments();
      case "home":
        return <Home userRole={user.role} />;
      case "employees":
        return <Employees userRole={user.role} />;
      case "skills":
        return <Skills userRole={user.role} />;
      case "activities":
        return <Activities userRole={user.role} />;
      case "recommendations":
        return <Recommendations userRole={user.role} />;
      case "analytics":
        return <Analytics userRole={user.role} />;
      case "notifications":
        return <Notifications />;
      case "profile":
        return <Profile user={user} />;
      case "settings":
        return <Settings onLogout={onLogout} />;
      default:
        return <Home userRole={user.role} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        userRole={user.role}
        userName={user.name}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      <div 
        className="flex-1 transition-all duration-300 overflow-auto"
        style={{ 
          marginLeft: isCollapsed ? '4rem' : '16rem',
          width: isCollapsed ? 'calc(100% - 4rem)' : 'calc(100% - 16rem)'
        }}
      >
        <div className="min-h-full">
          {renderView()}
        </div>
      </div>
    </div>
  );
}