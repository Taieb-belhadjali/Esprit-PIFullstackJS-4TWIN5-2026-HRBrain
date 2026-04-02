import { useState, useEffect } from 'react';
import { Search, Plus, Users, Calendar, Target, Edit, Trash2 } from 'lucide-react';
import { useVoiceCommand } from '../voice/VoiceCommandContext';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface ActivitiesProps {
  userRole: UserRole;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  context: 'Upskilling' | 'Expertise' | 'Development';
  requiredSkills: { name: string; level: string }[];
  seats: number;
  enrolled: number;
  status: 'Draft' | 'Validated' | 'In Progress' | 'Completed';
  startDate: string;
  endDate: string;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Cloud Migration Training',
    description: 'Learn AWS cloud services and migration strategies',
    context: 'Upskilling',
    requiredSkills: [
      { name: 'AWS', level: 'Medium' },
      { name: 'DevOps', level: 'Good' },
    ],
    seats: 20,
    enrolled: 15,
    status: 'In Progress',
    startDate: '2026-01-15',
    endDate: '2026-03-15',
  },
  {
    id: '2',
    title: 'Advanced React Patterns',
    description: 'Master advanced React concepts and design patterns',
    context: 'Expertise',
    requiredSkills: [
      { name: 'React', level: 'Good' },
      { name: 'TypeScript', level: 'Medium' },
    ],
    seats: 15,
    enrolled: 12,
    status: 'Validated',
    startDate: '2026-02-20',
    endDate: '2026-04-20',
  },
  {
    id: '3',
    title: 'Leadership Development Program',
    description: 'Develop leadership and team management skills',
    context: 'Development',
    requiredSkills: [
      { name: 'Team Leadership', level: 'Medium' },
      { name: 'Communication', level: 'Good' },
    ],
    seats: 10,
    enrolled: 8,
    status: 'In Progress',
    startDate: '2026-01-10',
    endDate: '2026-06-10',
  },
  {
    id: '4',
    title: 'Data Science Fundamentals',
    description: 'Introduction to data science and machine learning',
    context: 'Upskilling',
    requiredSkills: [
      { name: 'Python', level: 'Medium' },
      { name: 'Statistics', level: 'Low' },
    ],
    seats: 25,
    enrolled: 0,
    status: 'Draft',
    startDate: '2026-03-01',
    endDate: '2026-05-01',
  },
];

export function Activities({ userRole }: ActivitiesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    context: 'Upskilling' as 'Upskilling' | 'Expertise' | 'Development',
    seats: 10,
  });
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const { pendingCommand, commandData, clearPendingCommand } = useVoiceCommand();

  // Écouter les commandes vocales pour créer une activité
  useEffect(() => {
    if (pendingCommand === 'create-activity') {
      if (commandData?.name) {
        // Créer directement l'activité avec le nom fourni
        createActivityDirectly(commandData.name);
      } else {
        // Ouvrir le modal si pas de nom
        setShowCreateModal(true);
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand]);

  const createActivityDirectly = (name: string) => {
    const newActivityItem: Activity = {
      id: String(activities.length + 1),
      title: name,
      description: `Description de l'activité ${name}`,
      context: 'Upskilling',
      requiredSkills: [],
      seats: 20,
      enrolled: 0,
      status: 'Draft',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    
    setActivities([...activities, newActivityItem]);
    alert(`Activité "${name}" créée avec succès !`);
  };

  const filteredActivities = activities.filter((activity) =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      case 'Validated':
        return 'bg-blue-100 text-blue-700';
      case 'In Progress':
        return 'bg-green-100 text-green-700';
      case 'Completed':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getContextColor = (context: string) => {
    switch (context) {
      case 'Upskilling':
        return 'bg-blue-100 text-blue-700';
      case 'Expertise':
        return 'bg-purple-100 text-purple-700';
      case 'Development':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Activities</h1>
          <p className="text-muted-foreground">
            Manage training programs and development activities
          </p>
        </div>
        {(userRole === 'HR' || userRole === 'Manager') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Activity
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredActivities.length} of {activities.length} activities
        </div>
      </div>

      {/* Activities List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredActivities.map((activity) => (
          <div
            key={activity.id}
            className="bg-white rounded-lg shadow-sm p-6 border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{activity.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getContextColor(activity.context)}`}>
                    {activity.context}
                  </span>
                </div>
                <p className="text-muted-foreground">{activity.description}</p>
              </div>
              {(userRole === 'HR' || userRole === 'Manager') && (
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrollment</p>
                  <p className="font-medium text-gray-900">
                    {activity.enrolled} / {activity.seats} seats
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium text-gray-900">
                    {new Date(activity.startDate).toLocaleDateString()} -{' '}
                    {new Date(activity.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Required Skills</p>
                  <p className="font-medium text-gray-900">{activity.requiredSkills.length}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-2">Required Skills:</p>
              <div className="flex flex-wrap gap-2">
                {activity.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-secondary rounded-full text-sm text-gray-700"
                  >
                    {skill.name} ({skill.level})
                  </span>
                ))}
              </div>
            </div>

            {userRole === 'Employee' && activity.status === 'Validated' && (
              <div className="mt-4">
                <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors">
                  Request Enrollment
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Activity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl mb-6 text-gray-900">Create New Activity</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="activity-title" className="block text-sm mb-2 text-gray-700">
                  Activity Title
                </label>
                <input
                  id="activity-title"
                  type="text"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Advanced Python Programming"
                />
              </div>

              <div>
                <label htmlFor="activity-description" className="block text-sm mb-2 text-gray-700">
                  Description
                </label>
                <textarea
                  id="activity-description"
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={4}
                  placeholder="Describe the activity objectives and content..."
                />
              </div>

              <div>
                <label htmlFor="activity-context" className="block text-sm mb-2 text-gray-700">
                  Context
                </label>
                <select
                  id="activity-context"
                  value={newActivity.context}
                  onChange={(e) => setNewActivity({ ...newActivity, context: e.target.value as any })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Upskilling">Upskilling</option>
                  <option value="Expertise">Expertise</option>
                  <option value="Development">Development</option>
                </select>
              </div>

              <div>
                <label htmlFor="activity-seats" className="block text-sm mb-2 text-gray-700">
                  Number of Seats
                </label>
                <input
                  id="activity-seats"
                  type="number"
                  value={newActivity.seats}
                  onChange={(e) => setNewActivity({ ...newActivity, seats: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="1"
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
                  setShowCreateModal(false);
                  setNewActivity({
                    title: '',
                    description: '',
                    context: 'Upskilling',
                    seats: 10,
                  });
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
