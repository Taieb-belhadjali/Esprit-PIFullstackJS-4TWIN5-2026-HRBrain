import { useEffect, useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { EmployeeProfile } from '../employees/EmployeeProfile';
import AddEmployeeModal from "../employees/AddEmployeeModel";
import EditEmployeeModal from "../employees/EditEmployeeModel";
import ViewEmployeeModal from "../employees/ViewEmployeeModel";
import { deleteEmployee, getEmployees } from '../../../api/employeeApi';
import { useVoiceCommand } from '../voice/VoiceCommandContext';
import Pagination from '../ui/pagination';
import { useAppTranslation } from '../../hooks/useAppTranslation';

type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';

interface EmployeesProps {
  userRole: UserRole;
  language?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  skills?: Array<{ _id: string; name: string } | string>;
  department: string;
  position: string;
  skillsCount: number;
  activitiesCount: number;
  avatar: string;
  role: string;
}

export function Employees({ userRole }: EmployeesProps) {
  const t = useAppTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [prefilledName, setPrefilledName] = useState<string | null>(null);
  const { pendingCommand, commandData, clearPendingCommand } = useVoiceCommand();

  // ✅ PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  

  const departments = ['All', 'Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      const mappedEmployees = res.data.map((emp: any) => ({
        ...emp,
        id: emp._id,
        skills: Array.isArray(emp.skills) ? emp.skills : [],
        skillsCount: Array.isArray(emp.skills) ? emp.skills.length : 0,
      }));
      setEmployees(mappedEmployees);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Écouter les commandes vocales pour créer un employé
  useEffect(() => {
    if (pendingCommand === 'create-employee') {
      if (commandData?.name) {
        // Pré-remplir le nom et ouvrir le formulaire
        setPrefilledName(commandData.name);
        setOpenModal(true);
      } else {
        // Ouvrir le formulaire sans pré-remplissage
        setPrefilledName(null);
        setOpenModal(true);
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand]);

  // Écouter les commandes vocales pour modifier un employé
  // VoiceAssistant a déjà effectué le PATCH — on rafraîchit seulement la liste
  useEffect(() => {
    if (pendingCommand === 'modify-employee') {
      fetchEmployees();
      clearPendingCommand();
    }
  }, [pendingCommand, clearPendingCommand]);

  // Écouter les commandes vocales pour supprimer un employé
  // La suppression et confirmation sont gérées par VoiceAssistant — on rafraîchit juste la liste
  useEffect(() => {
    if (pendingCommand === 'delete-employee') {
      fetchEmployees();
      clearPendingCommand();
    }
  }, [pendingCommand, clearPendingCommand]);

  // Écouter les commandes vocales pour rechercher un employé
  useEffect(() => {
    if (pendingCommand === 'search-employee' || pendingCommand === 'filter-employee') {
      if (commandData?.name) {
        setSearchTerm(commandData.name);
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand]);

  // Écouter les commandes vocales pour afficher le détail d'un employé
  useEffect(() => {
    if (pendingCommand === 'view-employee') {
      if (commandData?.name && employees.length > 0) {
        const found = employees.find(
          (e) => (e.name || e.email).toLowerCase() === commandData.name!.toLowerCase()
        ) || employees.find(
          (e) => (e.name || e.email).toLowerCase().includes(commandData.name!.toLowerCase())
        );
        if (found) { setViewEmployee(found); setViewOpen(true); }
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand, employees]);

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
    }
  };

  // ✅ FILTERING
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      selectedDepartment === 'All' || emp.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  // ✅ PAGINATION CALCULATION
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // ✅ RESET PAGE WHEN FILTERING
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment]);

  if (selectedEmployee) {
    return (
      <EmployeeProfile
        employeeId={selectedEmployee}
        onBack={() => setSelectedEmployee(null)}
        userRole={userRole}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-foreground">{t('employees')}</h1>
          <p className="text-muted-foreground">
            {t('employeesDesc')}
          </p>
        </div>

        {(userRole === 'HR' || userRole === 'SUPERADMIN') && (
          <button
            onClick={() => {
              setPrefilledName(null);
              setOpenModal(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('addEmployee')}
          </button>
        )}
      </div>

      {/* FILTERS */}
      <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('searchEmployees')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('showingEmployees').replace('{filteredEmployees.length}', String(filteredEmployees.length)).replace('{employees.length}', String(employees.length))}
        </p>
      </div>

      {/* TABLE */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-foreground">{t('employeeName')}</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-foreground">{t('employeeRole')}</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-foreground">{t('employeeSkills')}</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-foreground">{t('actions')}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {paginatedEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-secondary/50">

                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {employee.avatar || employee.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    employee.role === 'HR' ? 'bg-red-100 text-red-700' :
                    employee.role === 'MANAGER' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {employee.role}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <span className="inline-flex px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
                    {employee.skillsCount || 0}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">

                    <button
                      className="p-2 hover:bg-secondary rounded-lg"
                      onClick={() => {
                        setViewEmployee(employee);
                        setViewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {(userRole === 'HR' || userRole === 'SUPERADMIN') && (
                      <>
                        <button
                          className="p-2 hover:bg-secondary rounded-lg"
                          onClick={() => setEditingEmployee(employee)}
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>

                        <button
                          className="p-2 hover:bg-secondary rounded-lg"
                          onClick={async () => {
                            if (confirm(`Delete ${employee.name}?`)) {
                              await deleteEmployee(employee.id);
                              fetchEmployees();
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </>
                    )}

                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="border-t border-border px-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEmployees.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>

      </div>

      {/* MODALS */}
      <AddEmployeeModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setPrefilledName(null);
        }}
        onCreated={fetchEmployees}
        prefilledName={prefilledName}
        userRole={userRole}
      />

      <EditEmployeeModal
        employee={editingEmployee}
        open={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onUpdated={fetchEmployees}
      />

      <ViewEmployeeModal
        open={viewOpen}
        employee={viewEmployee}
        onClose={() => setViewOpen(false)}
      />

    </div>
  );
}


