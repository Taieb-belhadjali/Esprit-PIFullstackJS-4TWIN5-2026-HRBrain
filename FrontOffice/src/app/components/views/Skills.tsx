import { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, TrendingUp } from 'lucide-react';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface SkillsProps {
  userRole: UserRole;
}

interface Skill {
  id: string;
  name: string;
  type: 'Knowledge' | 'Know-How' | 'Soft Skill';
  category: string;
  employeeCount: number;
  averageLevel: number;
  trending: boolean;
}

const mockSkills: Skill[] = [
  {
    id: '1',
    name: 'React',
    type: 'Know-How',
    category: 'Frontend Development',
    employeeCount: 45,
    averageLevel: 3.2,
    trending: true,
  },
  {
    id: '2',
    name: 'TypeScript',
    type: 'Know-How',
    category: 'Programming Languages',
    employeeCount: 52,
    averageLevel: 3.5,
    trending: true,
  },
  {
    id: '3',
    name: 'Team Leadership',
    type: 'Soft Skill',
    category: 'Management',
    employeeCount: 28,
    averageLevel: 2.8,
    trending: false,
  },
  {
    id: '4',
    name: 'AWS',
    type: 'Knowledge',
    category: 'Cloud Computing',
    employeeCount: 34,
    averageLevel: 2.5,
    trending: true,
  },
  {
    id: '5',
    name: 'Communication',
    type: 'Soft Skill',
    category: 'Interpersonal',
    employeeCount: 78,
    averageLevel: 3.8,
    trending: false,
  },
  {
    id: '6',
    name: 'Python',
    type: 'Know-How',
    category: 'Programming Languages',
    employeeCount: 41,
    averageLevel: 3.0,
    trending: true,
  },
];

export function Skills({ userRole }: SkillsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: '',
    type: 'Know-How' as 'Knowledge' | 'Know-How' | 'Soft Skill',
    category: '',
  });

  const types = ['All', 'Knowledge', 'Know-How', 'Soft Skill'];

  const filteredSkills = mockSkills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || skill.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Knowledge':
        return 'bg-purple-100 text-purple-700';
      case 'Know-How':
        return 'bg-blue-100 text-blue-700';
      case 'Soft Skill':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelLabel = (level: number) => {
    if (level >= 3.5) return 'Expert';
    if (level >= 2.5) return 'Good';
    if (level >= 1.5) return 'Medium';
    return 'Low';
  };

  const getLevelColor = (level: number) => {
    if (level >= 3.5) return 'text-green-600';
    if (level >= 2.5) return 'text-blue-600';
    if (level >= 1.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Skills Catalog</h1>
          <p className="text-muted-foreground">
            Manage organizational skills and competencies
          </p>
        </div>
        {userRole === 'HR' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Skill
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
              placeholder="Search skills by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredSkills.length} of {mockSkills.length} skills
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map((skill) => (
          <div
            key={skill.id}
            className="bg-white rounded-lg shadow-sm p-6 border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">{skill.name}</h3>
                  {skill.trending && (
                    <TrendingUp className="w-4 h-4 text-green-600" title="Trending" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{skill.category}</p>
                <span className={`inline-block text-xs px-2 py-1 rounded-full ${getTypeColor(skill.type)}`}>
                  {skill.type}
                </span>
              </div>
              {userRole === 'HR' && (
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-secondary rounded transition-colors">
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-1.5 hover:bg-secondary rounded transition-colors">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Average Level</span>
                  <span className={`text-sm font-medium ${getLevelColor(skill.averageLevel)}`}>
                    {getLevelLabel(skill.averageLevel)} ({skill.averageLevel.toFixed(1)}/4)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(skill.averageLevel / 4) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">Employees</span>
                <span className="text-sm font-medium text-gray-900">{skill.employeeCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Skill Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl mb-6 text-gray-900">Add New Skill</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="skill-name" className="block text-sm mb-2 text-gray-700">
                  Skill Name
                </label>
                <input
                  id="skill-name"
                  type="text"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Docker"
                />
              </div>

              <div>
                <label htmlFor="skill-type" className="block text-sm mb-2 text-gray-700">
                  Skill Type
                </label>
                <select
                  id="skill-type"
                  value={newSkill.type}
                  onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Knowledge">Knowledge</option>
                  <option value="Know-How">Know-How</option>
                  <option value="Soft Skill">Soft Skill</option>
                </select>
              </div>

              <div>
                <label htmlFor="skill-category" className="block text-sm mb-2 text-gray-700">
                  Category
                </label>
                <input
                  id="skill-category"
                  type="text"
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., DevOps"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle create
                  setShowCreateModal(false);
                  setNewSkill({ name: '', type: 'Know-How', category: '' });
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Skill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
