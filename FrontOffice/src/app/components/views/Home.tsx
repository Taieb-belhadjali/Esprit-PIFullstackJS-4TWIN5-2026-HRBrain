// Correction pour Pie label
const renderPieLabel = ({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`;
import { Users, Brain, Activity, Target, TrendingUp, AlertCircle } from 'lucide-react';
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useAppTranslation } from '../../hooks/useAppTranslation';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface HomeProps {
  userRole: UserRole;
  language?: string;
}

const skillsDistributionData = [
  { department: 'Engineering', skills: 245 },
  { department: 'Marketing', skills: 128 },
  { department: 'Sales', skills: 156 },
  { department: 'HR', skills: 89 },
  { department: 'Finance', skills: 102 },
];

const skillGapsData = [
  { name: 'Critical', value: 12, color: '#DC2626' },
  { name: 'High', value: 28, color: '#F59E0B' },
  { name: 'Medium', value: 45, color: '#3B82F6' },
  { name: 'Low', value: 67, color: '#10B981' },
];

export function Home({ userRole }: HomeProps) {
  const t = useAppTranslation();
  
  const metrics = [
    {
      titleKey: 'totalEmployees',
      value: '1,234',
      change: '+12%',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500',
    },
    {
      titleKey: 'skillsCoverage',
      value: '87%',
      change: '+5%',
      icon: <Brain className="w-6 h-6" />,
      color: 'bg-purple-500',
    },
    {
      titleKey: 'ongoingActivities',
      value: '42',
      change: '+8',
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-green-500',
    },
    {
      titleKey: 'pendingRecommendations',
      value: '18',
      change: '-3',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-orange-500',
    },
  ];

  const alerts = [
    {
      type: 'critical',
      titleKey: 'criticalSkillGap',
      descriptionKey: 'criticalSkillGapDesc',
      timeKey: 'hoursAgo2',
    },
    {
      type: 'warning',
      titleKey: 'activityDeadline',
      descriptionKey: 'activityDeadlineDesc',
      timeKey: 'hoursAgo5',
    },
    {
      type: 'info',
      titleKey: 'newRecommendation',
      descriptionKey: 'newRecommendationDesc',
      timeKey: 'dayAgo1',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2 text-foreground">{t('dashboard')}</h1>
        <p className="text-muted-foreground">
          {t('dashboardWelcome')}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-card rounded-lg shadow-sm p-6 border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${metric.color} text-white p-3 rounded-lg`}>
                {metric.icon}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600">{metric.change}</span>
              </div>
            </div>
            <h3 className="text-2xl font-semibold mb-1 text-foreground">{metric.value}</h3>
            <p className="text-sm text-muted-foreground">{t(metric.titleKey as any)}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Distribution */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h2 className="text-xl mb-4 text-foreground">{t('skillsDistribution')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillsDistributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="department" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="skills" fill="#1E3A8A" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Gaps */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h2 className="text-xl mb-4 text-foreground">{t('skillGaps')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={skillGapsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderPieLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {skillGapsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl text-foreground">{t('recentAlerts')}</h2>
          <button className="text-primary hover:underline text-sm">{t('viewAll')}</button>
        </div>
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              <div
                className={`p-2 rounded-lg ${
                  alert.type === 'critical'
                    ? 'bg-red-100'
                    : alert.type === 'warning'
                    ? 'bg-yellow-100'
                    : 'bg-blue-100'
                }`}
              >
                <AlertCircle
                  className={`w-5 h-5 ${
                    alert.type === 'critical'
                      ? 'text-red-600'
                      : alert.type === 'warning'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground mb-1">{t(alert.titleKey as any)}</h3>
                <p className="text-sm text-muted-foreground mb-2">{t(alert.descriptionKey as any)}</p>
                <p className="text-xs text-muted-foreground">{t(alert.timeKey as any)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


