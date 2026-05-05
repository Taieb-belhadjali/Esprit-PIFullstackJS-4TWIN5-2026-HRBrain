import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { EmployeeProfile } from '../employees/EmployeeProfile';
import AddEmployeeModal from "../employees/AddEmployeeModel";
import EditEmployeeModal from "../employees/EditEmployeeModel";
import ViewEmployeeModal from "../employees/ViewEmployeeModel";
import { deleteEmployee, getEmployees } from '../../../api/employeeApi';
import { useVoiceCommand } from '../voice/VoiceCommandContext';
import Pagination from '../ui/pagination';
import { useAppTranslation } from '../../hooks/useAppTranslation';
import { ConfirmDialog } from '../ui/ConfirmDialog';

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
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [prefilledName, setPrefilledName] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const { pendingCommand, commandData, clearPendingCommand } = useVoiceCommand();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Role filter options — matches the actual role values from the backend
  const roleOptions = useMemo(() => [
    { value: 'All',      label: 'All' },
    { value: 'EMPLOYEE', label: 'Employee' },
    { value: 'MANAGER',  label: 'Manager' },
    { value: 'HR',       label: 'HR' },
  ], []);

  const fetchEmployees = useCallback(async () => {
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
  }, []);

  useEffect(() => { fetchEmployees(); }, []);

  useEffect(() => {
    if (pendingCommand === 'create-employee') {
      if (commandData?.name) { setPrefilledName(commandData.name); setOpenModal(true); }
      else { setPrefilledName(null); setOpenModal(true); }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand]);

  useEffect(() => {
    if (pendingCommand === 'modify-employee') { fetchEmployees(); clearPendingCommand(); }
  }, [pendingCommand, clearPendingCommand]);

  useEffect(() => {
    if (pendingCommand === 'delete-employee') { fetchEmployees(); clearPendingCommand(); }
  }, [pendingCommand, clearPendingCommand]);

  useEffect(() => {
    if (pendingCommand === 'search-employee' || pendingCommand === 'filter-employee') {
      if (commandData?.name) setSearchTerm(commandData.name);
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand]);

  useEffect(() => {
    if (pendingCommand === 'view-employee') {
      if (commandData?.name && employees.length > 0) {
        const found = employees.find(e => (e.name || e.email).toLowerCase() === commandData.name!.toLowerCase())
          || employees.find(e => (e.name || e.email).toLowerCase().includes(commandData.name!.toLowerCase()));
        if (found) { setViewEmployee(found); setViewOpen(true); }
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand, employees]);

  // ── Memoized derived state ─────────────────────────────────────────────────
  // Without useMemo, filter + slice run on EVERY render (modal open/close,
  // hover states, etc.) — wasted CPU for 0 visual change.
  const filteredEmployees = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name?.toLowerCase().includes(search) ||
        emp.email?.toLowerCase().includes(search) ||
        emp.position?.toLowerCase().includes(search);
      const matchesRole = selectedRole === 'All' || emp.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [employees, searchTerm, selectedRole]);

  const { paginatedEmployees, totalPages } = useMemo(() => {
    const indexOfFirst = (currentPage - 1) * itemsPerPage;
    return {
      paginatedEmployees: filteredEmployees.slice(indexOfFirst, indexOfFirst + itemsPerPage),
      totalPages: Math.ceil(filteredEmployees.length / itemsPerPage),
    };
  }, [filteredEmployees, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedRole]);

  if (selectedEmployee) {
    return <EmployeeProfile employeeId={selectedEmployee} onBack={() => setSelectedEmployee(null)} userRole={userRole} />;
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-foreground">{t('employees')}</h1>
          <p className="text-muted-foreground">{t('employeesDesc')}</p>
        </div>
        {(userRole === 'HR' || userRole === 'SUPERADMIN') && (
          <button
            onClick={() => { setPrefilledName(null); setOpenModal(true); }}
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            {/* WCAG 1.3.1 — label explicite associé à l'input via htmlFor */}
            <label htmlFor="employee-search" className="sr-only">{t('searchEmployees')}</label>
            <input
              id="employee-search"
              type="text"
              placeholder={t('searchEmployees')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            {/* WCAG 1.3.1 — label associé au select */}
            <label htmlFor="employee-role-filter" className="sr-only">Filtrer par rôle</label>
            <select
              id="employee-role-filter"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          {t('showingEmployees').replace('{filteredEmployees.length}', String(filteredEmployees.length)).replace('{employees.length}', String(employees.length))}
        </p>
      </div>

      {/* TABLE */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        {/* WCAG 1.3.1 — caption décrit le tableau pour les lecteurs d'écran */}
        <table className="w-full" aria-label={t('employees')}>
          <thead className="bg-secondary border-b border-border">
            <tr>
              {/* WCAG 1.3.1 — scope="col" associe chaque en-tête à sa colonne */}
              <th scope="col" className="text-left px-6 py-4 text-sm font-medium text-foreground">{t('employeeName')}</th>
              <th scope="col" className="text-left px-6 py-4 text-sm font-medium text-foreground">{t('employeeRole')}</th>
              <th scope="col" className="text-center px-6 py-4 text-sm font-medium text-foreground">{t('employeeSkills')}</th>
              <th scope="col" className="text-right px-6 py-4 text-sm font-medium text-foreground">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-secondary/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium"
                      aria-hidden="true"
                    >
                      {employee.avatar || employee.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {/* WCAG 1.4.1 — la couleur seule ne suffit pas : le texte du rôle est aussi présent */}
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
                    {/* WCAG 4.1.2 — aria-label sur chaque bouton icône */}
                    <button
                      className="p-2 hover:bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      onClick={() => { setViewEmployee(employee); setViewOpen(true); }}
                      aria-label={`Voir le profil de ${employee.name}`}
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    </button>
                    {/* HR: can edit/delete all employees
                        SUPERADMIN: can only edit/delete HR accounts */}
                    {(userRole === 'HR' || (userRole === 'SUPERADMIN' && employee.role === 'HR')) && (
                      <>
                        <button
                          className="p-2 hover:bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          onClick={() => setEditingEmployee(employee)}
                          aria-label={`Modifier ${employee.name}`}
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        </button>
                        <button
                          className="p-2 hover:bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
                          onClick={() => setConfirmDelete({ id: employee.id, name: employee.name })}
                          aria-label={`Supprimer ${employee.name}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        onClose={() => { setOpenModal(false); setPrefilledName(null); }}
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
      <ViewEmployeeModal open={viewOpen} employee={viewEmployee} onClose={() => setViewOpen(false)} />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer l'employé"
        message={`Voulez-vous vraiment supprimer ${confirmDelete?.name} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={async () => {
          if (confirmDelete) { await deleteEmployee(confirmDelete.id); fetchEmployees(); setConfirmDelete(null); }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
