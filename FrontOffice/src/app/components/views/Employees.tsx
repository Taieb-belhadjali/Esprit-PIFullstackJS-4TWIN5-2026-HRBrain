import { useEffect, useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { EmployeeProfile } from '../employees/EmployeeProfile';
import AddEmployeeModal from "../employees/AddEmployeeModel";
import EditEmployeeModal from "../employees/EditEmployeeModel";
import ViewEmployeeModal from "../employees/ViewEmployeeModel";
import { deleteEmployee, getEmployees } from '../../../api/employeeApi';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface EmployeesProps {
  userRole: UserRole;
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

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
          <h1 className="text-3xl mb-2 text-gray-900">Employees</h1>
          <p className="text-muted-foreground">
            Manage employee profiles, skills, and activities
          </p>
        </div>

        {userRole === 'HR' && (
          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        )}
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">

        <div className="flex flex-col md:flex-row gap-4">

          {/* SEARCH */}
          <div className="card mb-3 shadow-sm w-full">
            <div className="card-body">
              <div className="row g-2">

                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="col-md-6 text-md-end text-muted d-flex align-items-center justify-content-md-end">
                  Showing {filteredEmployees.length} employees
                </div>

              </div>
            </div>
          </div>

          {/* DEPARTMENT FILTER */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Employee</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Department</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Position</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-gray-900">Skills</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-gray-900">Activities</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-900">Actions</th>
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
                      <p className="font-medium text-gray-900">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className="inline-flex px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                    {employee.department}
                  </span>
                </td>

                <td className="px-6 py-4 text-gray-900">{employee.position}</td>

                <td className="px-6 py-4 text-center">
                  <span className="inline-flex px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
                    {employee.skillsCount || 0}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <span className="inline-flex px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                    {employee.activitiesCount || 0}
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

                    {userRole === 'HR' && (
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

        {/* ✅ PAGINATION UI */}
        <div className="flex justify-between items-center p-4 border-t">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </span>

          <div className="flex gap-2">

            <button
              className="px-3 py-1 rounded border"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded border ${
                  currentPage === i + 1 ? "bg-primary text-white" : ""
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              className="px-3 py-1 rounded border"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </button>

          </div>
        </div>

      </div>

      {/* MODALS */}
      <AddEmployeeModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={fetchEmployees}
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