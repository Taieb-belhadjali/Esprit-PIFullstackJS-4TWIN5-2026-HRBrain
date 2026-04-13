import React, { useEffect, useState } from 'react';
import { X, History, Brain, Clock, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface HistoryEntry {
  _id: string;
  activityId: string;
  createdAt: string;
  jsonOllama: {
    source?: string;
    elapsedMs?: number;
    rankings: {
      employeeId: string;
      score: number;
      reasons: string[];
    }[];
  };
}

interface Candidate {
  employee: { _id: string; name: string; email: string };
}

interface Props {
  activityId: string;
  activityTitle: string;
  onClose: () => void;
}

const formatElapsed = (ms?: number) => {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
};

export const ActivityRecommendationHistory: React.FC<Props> = ({ activityId, activityTitle, onClose }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      axios.get(`http://localhost:3000/recommendations/${activityId}/history`),
      axios.get(`http://localhost:3000/recommendations/${activityId}/top100`),
    ])
      .then(([histRes, top100Res]) => {
        setHistory(histRes.data);
        setCandidates(top100Res.data?.candidates ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activityId]);

  const resolveName = (employeeId: string): string => {
    const found = candidates.find((c) => String(c.employee._id) === String(employeeId));
    return found ? found.employee.name : employeeId;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <History size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Historique des recommandations</h2>
              <p className="text-sm text-muted-foreground">{activityTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History size={32} className="mx-auto mb-3 opacity-30" />
              <p>Aucune recommandation générée pour cette activité.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, i) => {
                const isExpanded = expandedEntry === entry._id;
                const isLatest = i === 0;
                return (
                  <div key={entry._id} className={`border rounded-xl overflow-hidden ${isLatest ? 'border-purple-200' : 'border-gray-100'}`}>
                    {/* Entry header */}
                    <button
                      onClick={() => setExpandedEntry(isExpanded ? null : entry._id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isLatest ? 'bg-purple-50 hover:bg-purple-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isLatest ? 'bg-purple-100' : 'bg-gray-200'}`}>
                          <Brain size={14} className={isLatest ? 'text-purple-600' : 'text-muted-foreground'} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                            {isLatest && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                                Dernière
                              </span>
                            )}
                            {entry.jsonOllama?.source === 'algo-fallback' && (
                              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                                Fallback algo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            <span>{entry.jsonOllama?.rankings?.length ?? 0} rankings</span>
                            {entry.jsonOllama?.elapsedMs && (
                              <span className="flex items-center gap-1">
                                <Clock size={11} />{formatElapsed(entry.jsonOllama.elapsedMs)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </button>

                    {/* Rankings detail */}
                    {isExpanded && (
                      <div className="p-4 space-y-3 border-t border-gray-100">
                        {(entry.jsonOllama?.rankings ?? []).map((r, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                  idx === 1 ? 'bg-gray-200 text-muted-foreground' :
                                  idx === 2 ? 'bg-orange-100 text-orange-600' :
                                  'bg-primary/10 text-primary'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{resolveName(r.employeeId)}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{r.employeeId}</p>
                                </div>
                              </div>
                              <span className={`text-sm font-bold ${r.score >= 75 ? 'text-green-600' : r.score >= 50 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                                {r.score}/100
                              </span>
                            </div>
                            {r.reasons?.length > 0 && (
                              <ul className="space-y-1 pl-2 border-l-2 border-purple-100">
                                {r.reasons.map((reason, ri) => (
                                  <li key={ri} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <TrendingUp size={10} className="text-purple-400 mt-0.5 shrink-0" />
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
