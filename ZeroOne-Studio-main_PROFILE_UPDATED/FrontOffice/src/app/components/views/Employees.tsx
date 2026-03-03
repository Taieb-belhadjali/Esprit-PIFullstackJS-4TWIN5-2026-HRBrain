import { useState } from 'react';
import { Search, Filter, Plus, Mail, Phone, MapPin, Edit, Trash2, Eye } from 'lucide-react';
import { EmployeeProfile } from '../employees/EmployeeProfile';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface EmployeesProps {
  userRole: UserRole;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  skillsCount: number;
  activitiesCount: number;
  avatar: string;
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    department: 'Engineering',
    position: 'Senior Developer',
    skillsCount: 24,
    activitiesCount: 8,
    avatar: 'SJ',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    department: 'Engineering',
    position: 'Tech Lead',
    skillsCount: 32,
    activitiesCount: 12,
    avatar: 'MC',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@company.com',
    department: 'Marketing',
    position: 'Marketing Manager',
    skillsCount: 18,
    activitiesCount: 6,
    avatar: 'ER',
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    department: 'Sales',
    position: 'Sales Director',
    skillsCount: 15,
    activitiesCount: 5,
    avatar: 'JW',
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@company.com',
    department: 'HR',
    position: 'HR Manager',
    skillsCount: 20,
    activitiesCount: 10,
    avatar: 'LA',
  },
];

export function Employees({ userRole }: EmployeesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const departments = ['All', 'Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];

  const filteredEmployees = mockEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === 'All' || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Employees</h1>
          <p className="text-muted-foreground">
            Manage employee profiles, skills, and activities
          </p>
        </div>
        {userRole === 'HR' && (
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employees by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredEmployees.length} of {mockEmployees.length} employees
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                Employee
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                Department
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                Position
              </th>
              <th className="text-center px-6 py-4 text-sm font-medium text-gray-900">
                Skills
              </th>
              <th className="text-center px-6 py-4 text-sm font-medium text-gray-900">
                Activities
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {employee.avatar}
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
                    {employee.skillsCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                    {employee.activitiesCount}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedEmployee(employee.id)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      title="View profile"
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {userRole === 'HR' && (
                      <>
                        <button
                          className="p-2 hover:bg-secondary rounded-lg transition-colors"
                          title="Edit employee"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          className="p-2 hover:bg-secondary rounded-lg transition-colors"
                          title="Delete employee"
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
      </div>
    </div>
  );
}
