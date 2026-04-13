import { useState } from 'react';
import { TrendingUp, Users, Target, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface AnalyticsProps {
  userRole: UserRole;
}

const skillGapData = [
  { department: 'Engineering', critical: 5, high: 12, medium: 18, low: 25 },
  { department: 'Marketing', critical: 2, high: 8, medium: 15, low: 20 },
  { department: 'Sales', critical: 3, high: 10, medium: 12, low: 18 },
  { department: 'HR', critical: 1, high: 4, medium: 8, low: 12 },
  { department: 'Finance', critical: 2, high: 6, medium: 10, low: 15 },
];

const progressionData = [
  { month: 'Aug', avgScore: 2.1, activities: 12 },
  { month: 'Sep', avgScore: 2.3, activities: 15 },
  { month: 'Oct', avgScore: 2.5, activities: 18 },
  { month: 'Nov', avgScore: 2.7, activities: 22 },
  { month: 'Dec', avgScore: 2.9, activities: 25 },
  { month: 'Jan', avgScore: 3.1, activities: 28 },
  { month: 'Feb', avgScore: 3.2, activities: 30 },
];

const recommendationEfficiencyData = [
  { metric: 'Accuracy', value: 92 },
  { metric: 'Match Quality', value: 88 },
  { metric: 'Completion Rate', value: 85 },
  { metric: 'Satisfaction', value: 90 },
  { metric: 'Time to Fill', value: 82 },
];

const departmentSkillsData = [
  { subject: 'Technical', Engineering: 85, Marketing: 45, Sales: 40 },
  { subject: 'Communication', Engineering: 65, Marketing: 90, Sales: 88 },
  { subject: 'Leadership', Engineering: 55, Marketing: 70, Sales: 65 },
  { subject: 'Analytics', Engineering: 80, Marketing: 75, Sales: 55 },
  { subject: 'Creativity', Engineering: 60, Marketing: 95, Sales: 50 },
];

export function Analytics({ userRole }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState('6months');

  const metrics = [
    {
      title: 'Skills Added',
      value: '234',
      change: '+18%',
      icon: <Target className="w-6 h-6" aria-hidden="true" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Avg. Skill Level',
      value: '3.2/4',
      change: '+0.3',
      icon: <TrendingUp className="w-6 h-6" aria-hidden="true" />,
      color: 'bg-green-500',
    },
    {
      title: 'Active Employees',
      value: '892',
      change: '+12%',
      icon: <Users className="w-6 h-6" aria-hidden="true" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Completion Rate',
      value: '85%',
      change: '+5%',
      icon: <Calendar className="w-6 h-6" aria-hidden="true" />,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into skills, activities, and recommendations
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-card rounded-lg shadow-sm p-6 border border-border"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${metric.color} text-white p-3 rounded-lg`}>
                {metric.icon}
              </div>
              <span className="text-sm text-green-600 font-medium">{metric.change}</span>
            </div>
            <h3 className="text-2xl font-semibold mb-1 text-foreground">{metric.value}</h3>
            <p className="text-sm text-muted-foreground">{metric.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Gaps by Department */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h2 className="text-xl mb-4 text-foreground">Skill Gaps by Department</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillGapData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="department" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="critical" stackId="a" fill="#DC2626" name="Critical" />
              <Bar dataKey="high" stackId="a" fill="#F59E0B" name="High" />
              <Bar dataKey="medium" stackId="a" fill="#3B82F6" name="Medium" />
              <Bar dataKey="low" stackId="a" fill="#10B981" name="Low" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employee Progression */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h2 className="text-xl mb-4 text-foreground">Employee Progression Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis yAxisId="left" stroke="#6B7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="avgScore"
                stroke="#1E3A8A"
                strokeWidth={2}
                name="Avg Skill Score"
                dot={{ fill: '#1E3A8A', r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="activities"
                stroke="#10B981"
                strokeWidth={2}
                name="Completed Activities"
                dot={{ fill: '#10B981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendation Efficiency */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h2 className="text-xl mb-4 text-foreground">Recommendation Efficiency</h2>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={recommendationEfficiencyData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="metric" stroke="#6B7280" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6B7280" />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#1E3A8A"
                fill="#1E3A8A"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {recommendationEfficiencyData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.metric}</span>
                <span className="text-sm font-semibold text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Skills Comparison */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h2 className="text-xl mb-4 text-foreground">Department Skills Comparison</h2>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={departmentSkillsData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="subject" stroke="#6B7280" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6B7280" />
              <Radar
                name="Engineering"
                dataKey="Engineering"
                stroke="#1E3A8A"
                fill="#1E3A8A"
                fillOpacity={0.5}
              />
              <Radar
                name="Marketing"
                dataKey="Marketing"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.5}
              />
              <Radar
                name="Sales"
                dataKey="Sales"
                stroke="#60A5FA"
                fill="#60A5FA"
                fillOpacity={0.5}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <h2 className="text-xl mb-4 text-foreground">Summary Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-muted-foreground mb-1">Total Recommendations Made</p>
            <p className="text-3xl font-semibold text-foreground">1,847</p>
            <p className="text-sm text-green-600 mt-1">+23% from last period</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-muted-foreground mb-1">Successful Placements</p>
            <p className="text-3xl font-semibold text-foreground">1,572</p>
            <p className="text-sm text-green-600 mt-1">85% success rate</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm text-muted-foreground mb-1">Avg. Time to Match</p>
            <p className="text-3xl font-semibold text-foreground">2.3 days</p>
            <p className="text-sm text-green-600 mt-1">-15% faster than before</p>
          </div>
        </div>
      </div>
    </div>
  );
}
