import { useState } from 'react';
import { Target, Brain, CheckCircle, XCircle, Info, TrendingUp, AlertCircle } from 'lucide-react';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface RecommendationsProps {
  userRole: UserRole;
}

interface SkillMatch {
  skillName: string;
  required: string;
  current: string;
  score: number;
  gap: boolean;
}

interface Recommendation {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  overallScore: number;
  skillMatches: SkillMatch[];
  aiReasoning: string;
  confidence: number;
}

const mockActivities = [
  { id: '1', title: 'Cloud Migration Training' },
  { id: '2', title: 'Advanced React Patterns' },
  { id: '3', title: 'Leadership Development Program' },
];

const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    employeeId: 'emp1',
    employeeName: 'Sarah Johnson',
    position: 'Senior Developer',
    department: 'Engineering',
    overallScore: 92,
    confidence: 95,
    skillMatches: [
      { skillName: 'React', required: 'Good', current: 'Expert', score: 100, gap: false },
      { skillName: 'TypeScript', required: 'Medium', current: 'Expert', score: 100, gap: false },
      { skillName: 'Testing', required: 'Good', current: 'Medium', score: 70, gap: true },
    ],
    aiReasoning: 'Sarah demonstrates exceptional proficiency in React and TypeScript, exceeding the required levels. Her strong foundation in frontend development makes her an ideal candidate. However, she would benefit from additional testing knowledge to fully excel in this role.',
  },
  {
    id: '2',
    employeeId: 'emp2',
    employeeName: 'Michael Chen',
    position: 'Tech Lead',
    department: 'Engineering',
    overallScore: 88,
    confidence: 92,
    skillMatches: [
      { skillName: 'React', required: 'Good', current: 'Expert', score: 100, gap: false },
      { skillName: 'TypeScript', required: 'Medium', current: 'Good', score: 85, gap: false },
      { skillName: 'Testing', required: 'Good', current: 'Good', score: 75, gap: false },
    ],
    aiReasoning: 'Michael shows strong technical capabilities across all required skills with consistent performance. His leadership experience as a Tech Lead adds valuable team collaboration potential. He meets all requirements with room for growth.',
  },
  {
    id: '3',
    employeeId: 'emp3',
    employeeName: 'David Park',
    position: 'Developer',
    department: 'Engineering',
    overallScore: 75,
    confidence: 85,
    skillMatches: [
      { skillName: 'React', required: 'Good', current: 'Good', score: 80, gap: false },
      { skillName: 'TypeScript', required: 'Medium', current: 'Medium', score: 70, gap: false },
      { skillName: 'Testing', required: 'Good', current: 'Low', score: 40, gap: true },
    ],
    aiReasoning: 'David meets the baseline requirements for React and TypeScript. However, his testing skills require significant development. This activity could serve as an excellent growth opportunity to strengthen his testing capabilities while applying his existing knowledge.',
  },
];

export function Recommendations({ userRole }: RecommendationsProps) {
  const [selectedActivity, setSelectedActivity] = useState(mockActivities[1].id);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2 text-gray-900">AI Recommendation Engine</h1>
        <p className="text-muted-foreground">
          Get intelligent employee recommendations based on skills and activity requirements
        </p>
      </div>

      {/* Activity Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl text-gray-900">Select Activity</h2>
            <p className="text-sm text-muted-foreground">Choose an activity to see AI-powered recommendations</p>
          </div>
        </div>

        <select
          value={selectedActivity}
          onChange={(e) => setSelectedActivity(e.target.value)}
          className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
        >
          {mockActivities.map((activity) => (
            <option key={activity.id} value={activity.id}>
              {activity.title}
            </option>
          ))}
        </select>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">AI-Powered Matching</p>
            <p>Our AI analyzes employee skills, experience levels, and learning patterns to provide the most suitable recommendations. Scores reflect overall fit and growth potential.</p>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl text-gray-900">Recommended Employees</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="w-4 h-4" aria-hidden="true" />
            <span>AI Confidence: High</span>
          </div>
        </div>

        {mockRecommendations.map((rec, index) => (
          <div
            key={rec.id}
            className="bg-white rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-semibold text-lg flex-shrink-0">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {rec.employeeName}
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      {rec.position} · {rec.department}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Match Score:</span>
                        <span className={`text-2xl font-semibold ${getScoreColor(rec.overallScore)}`}>
                          {rec.overallScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">AI Confidence:</span>
                        <span className="text-sm font-medium text-gray-900">{rec.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-secondary transition-colors">
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>

              {/* Overall Score Bar */}
              <div className="mb-4">
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${getScoreBackground(rec.overallScore)}`}
                    style={{ width: `${rec.overallScore}%` }}
                  />
                </div>
              </div>

              {/* Skill Breakdown */}
              <div className="mb-4">
                <button
                  onClick={() => setExpandedRecommendation(expandedRecommendation === rec.id ? null : rec.id)}
                  className="flex items-center gap-2 text-primary hover:underline mb-3"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Skill-by-Skill Breakdown</span>
                </button>

                {expandedRecommendation === rec.id && (
                  <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                    {rec.skillMatches.map((skill, idx) => (
                      <div key={idx} className="bg-secondary/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">{skill.skillName}</span>
                            {skill.gap && (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                                <AlertCircle className="w-3 h-3" />
                                Skill Gap
                              </span>
                            )}
                          </div>
                          <span className={`font-semibold ${getScoreColor(skill.score)}`}>
                            {skill.score}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                          <div>
                            <span className="text-muted-foreground">Required:</span>{' '}
                            <span className="font-medium text-gray-900">{skill.required}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Current:</span>{' '}
                            <span className="font-medium text-gray-900">{skill.current}</span>
                          </div>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getScoreBackground(skill.score)}`}
                            style={{ width: `${skill.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Reasoning */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">AI Insights & Reasoning</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{rec.aiReasoning}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust & Transparency Footer */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <h3 className="font-semibold text-gray-900 mb-3">How Our AI Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Target className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">Skill Matching</p>
              <p className="text-muted-foreground">Compares employee skills against activity requirements with weighted scoring</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Brain className="w-5 h-5 text-purple-600" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">Learning Potential</p>
              <p className="text-muted-foreground">Analyzes growth patterns and readiness for skill development</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">Transparent Decisions</p>
              <p className="text-muted-foreground">Every recommendation includes detailed reasoning and confidence scores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
