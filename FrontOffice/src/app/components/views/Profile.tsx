import { Mail, Briefcase, Calendar, Edit, Plus } from 'lucide-react';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface User {
  email: string;
  role: UserRole;
  name: string;
}

interface ProfileProps {
  user: User;
}

const mockSkills = [
  { name: 'React', type: 'Know-How', level: 'Expert', progress: 95 },
  { name: 'TypeScript', type: 'Know-How', level: 'Expert', progress: 90 },
  { name: 'Communication', type: 'Soft Skill', level: 'Good', progress: 75 },
  { name: 'Team Leadership', type: 'Soft Skill', level: 'Good', progress: 70 },
];

const mockActivities = [
  {
    id: '1',
    title: 'Cloud Migration Training',
    status: 'In Progress',
    startDate: '2026-01-15',
    progress: 60,
  },
  {
    id: '2',
    title: 'Advanced React Patterns',
    status: 'Completed',
    startDate: '2025-11-20',
    progress: 100,
  },
];

export function Profile({ user }: ProfileProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Expert':
        return 'bg-green-100 text-green-700';
      case 'Good':
        return 'bg-blue-100 text-blue-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Low':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2 text-foreground">My Profile</h1>
        <p className="text-muted-foreground">View and manage your personal information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-semibold">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl mb-2 text-foreground">{user.name}</h2>
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" aria-hidden="true" />
                  <span>{user.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <span>Joined January 2022</span>
                </div>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">{mockSkills.length}</p>
            <p className="text-sm text-muted-foreground">Skills</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">{mockActivities.length}</p>
            <p className="text-sm text-muted-foreground">Activities</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">3.2</p>
            <p className="text-sm text-muted-foreground">Avg Skill Level</p>
          </div>
        </div>
      </div>

      {/* My Skills */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-foreground">My Skills</h2>
          <button className="flex items-center gap-2 text-primary hover:underline">
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        </div>

        <div className="space-y-4">
          {mockSkills.map((skill, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-foreground">{skill.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(skill.type)}`}>
                    {skill.type}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(skill.level)}`}>
                    {skill.level}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">{skill.progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${skill.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Activities */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <h2 className="text-2xl mb-6 text-foreground">My Activities</h2>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div
              key={activity.id}
              className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-foreground mb-1">{activity.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Started: {new Date(activity.startDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    activity.status === 'Completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {activity.status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      activity.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${activity.progress}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">{activity.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
