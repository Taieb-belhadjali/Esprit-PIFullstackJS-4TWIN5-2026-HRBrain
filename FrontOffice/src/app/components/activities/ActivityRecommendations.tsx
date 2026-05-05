import React, { useState } from 'react';
import { X, Users, ChevronUp, ChevronDown, Award, TrendingUp, Brain } from 'lucide-react';
import API from '../../../api/api';

interface RecommendationResult {
  employee: { _id: string; name: string; email: string; skills: any[] };
  skillMatchScore: number;
  contextScore: number;
  progressionScore: number;
  finalScore: number;
  employeeSkills: { skillId: string; skillName: string; level: string }[];
}

interface Props {
  activityId: string;
  activityTitle: string;
  onClose: () => void;
  autoLoad?: boolean;
}

const ScoreBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
    <span className="text-xs font-medium text-muted-foreground w-8 text-right">{value}</span>
  </div>
);

const getRankBadge = (rank: number) => {
  if (rank === 1) return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
  if (rank === 2) return 'bg-gray-100 text-muted-foreground border border-gray-300';
  if (rank === 3) return 'bg-orange-100 text-orange-600 border border-orange-300';
  return 'bg-card text-muted-foreground border border-gray-200';
};

export const ActivityRecommendations: React.FC<Props> = ({ activityId, activityTitle, onClose, autoLoad = false }) => {
  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sortField, setSortField] = useState<keyof RecommendationResult>('finalScore');
  const [sortAsc, setSortAsc] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/activities/${activityId}/recommendations`);
      setResults(res.data);
      setLoaded(true);
    } catch { alert('Erreur lors du chargement des recommandations'); }
    finally { setLoading(false); }
  };

  // Auto-load for read-only consumers (e.g. SUPERADMIN)
  React.useEffect(() => { if (autoLoad) load(); }, []);

  const toggleSort = (field: keyof RecommendationResult) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const sorted = [...results].sort((a, b) => {
    const va = a[sortField] as number;
    const vb = b[sortField] as number;
    return sortAsc ? va - vb : vb - va;
  });

  const SortIcon = ({ field }: { field: keyof RecommendationResult }) =>
    sortField === field
      ? sortAsc ? <ChevronUp size={13} /> : <ChevronDown size={13} />
      : <ChevronDown size={13} className="opacity-30" />;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recommandations</h2>
              <p className="text-sm text-muted-foreground">{activityTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {!loaded ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="p-4 bg-indigo-50 rounded-full">
                <Brain size={32} className="text-indigo-500" />
              </div>
              {loading ? (
                <span className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
              ) : !autoLoad && (
                <>
                  <p className="text-muted-foreground text-center max-w-sm">
                    Calcule les meilleurs employés pour cette activité selon leurs compétences, le contexte et leur potentiel de progression.
                  </p>
                  <button
                    onClick={load}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Award size={16} /> Calculer les recommandations
                  </button>
                </>
              )}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">Aucun employé trouvé.</div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{results.length} employé(s) classé(s)</p>

              {/* Legend */}
              <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Skill Match (50%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Context (30%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Progression (20%)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium w-10">#</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Employé</th>
                      <th className="py-2 px-3 text-muted-foreground font-medium cursor-pointer select-none" onClick={() => toggleSort('skillMatchScore')}>
                        <span className="flex items-center justify-center gap-1">Skill <SortIcon field="skillMatchScore" /></span>
                      </th>
                      <th className="py-2 px-3 text-muted-foreground font-medium cursor-pointer select-none" onClick={() => toggleSort('contextScore')}>
                        <span className="flex items-center justify-center gap-1">Context <SortIcon field="contextScore" /></span>
                      </th>
                      <th className="py-2 px-3 text-muted-foreground font-medium cursor-pointer select-none" onClick={() => toggleSort('progressionScore')}>
                        <span className="flex items-center justify-center gap-1"><TrendingUp size={12} /> Progression <SortIcon field="progressionScore" /></span>
                      </th>
                      <th className="py-2 px-3 text-muted-foreground font-medium cursor-pointer select-none" onClick={() => toggleSort('finalScore')}>
                        <span className="flex items-center justify-center gap-1">Score final <SortIcon field="finalScore" /></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r, i) => (
                      <tr key={r.employee._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getRankBadge(i + 1)}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-foreground">{r.employee.name}</p>
                          <p className="text-xs text-muted-foreground">{r.employee.email}</p>
                        </td>
                        <td className="py-3 px-3 w-32">
                          <ScoreBar value={r.skillMatchScore} color="bg-blue-400" />
                        </td>
                        <td className="py-3 px-3 w-32">
                          <ScoreBar value={r.contextScore} color="bg-green-400" />
                        </td>
                        <td className="py-3 px-3 w-32">
                          <ScoreBar value={r.progressionScore} color="bg-purple-400" />
                        </td>
                        <td className="py-3 px-3 w-28">
                          <div className="flex items-center justify-center">
                            <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${
                              r.finalScore >= 75 ? 'bg-green-100 text-green-700' :
                              r.finalScore >= 50 ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-muted-foreground'
                            }`}>
                              {r.finalScore}/100
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
