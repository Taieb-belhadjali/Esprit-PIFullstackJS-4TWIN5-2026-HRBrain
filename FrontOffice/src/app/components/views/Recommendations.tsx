import React, { useState, useEffect, useRef } from 'react';
import { Target, Brain, CheckCircle, XCircle, TrendingUp, Sparkles, ChevronDown, Clock, PlayCircle, Users, X } from 'lucide-react';
import axios from 'axios';

type UserRole = 'HR' | 'Manager' | 'Employee';
interface RecommendationsProps { userRole: UserRole; }

interface ApiRecommendation {
  employee: { _id: string; name: string; email: string };
  skillMatchScore: number;
  contextScore: number;
  progressionScore: number;
  finalScore: number;
  employeeSkills: { skillId: string; skillName: string; level: string }[];
  aiReasons?: string[];
  decision?: 'approved' | 'rejected';
}

interface Activity { _id: string; title: string; context?: string; nombreDePlaces?: number; }

interface RunAllResult {
  activityId: string;
  title: string;
  elapsedMs: number;
  rankings: number;
  error?: string;
}

const MOCK_CARD: ApiRecommendation = {
  employee: { _id: 'mock1', name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
  skillMatchScore: 74, contextScore: 70, progressionScore: 65, finalScore: 70.5,
  employeeSkills: [
    { skillId: '1', skillName: 'DOCKER', level: 'HIGH' },
    { skillId: '2', skillName: 'GIT', level: 'EXPERT' },
    { skillId: '3', skillName: 'PYTHON', level: 'MEDIUM' },
  ],
};

/** Affiche le temps écoulé depuis startedAt, mis à jour chaque seconde */
function ElapsedTimer({ startedAt }: { startedAt: Date }) {
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return <span className="ml-2 text-indigo-500">{m > 0 ? `${m}m ` : ''}{s}s</span>;
}

interface CardProps {
  rec: ApiRecommendation;
  index: number;
  activityId: string;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  getScoreColor: (s: number) => string;
  getScoreBg: (s: number) => string;
}

function RecommendationCard({ rec, index, activityId, expandedId, setExpandedId, getScoreColor, getScoreBg }: CardProps) {
  const [decision, setDecision] = React.useState<'approved' | 'rejected' | null>(rec.decision ?? null);
  const [saving, setSaving] = React.useState(false);

  const handleDecision = async (d: 'approved' | 'rejected') => {
    setSaving(true);
    try {
      await axios.post(`http://localhost:3000/recommendations/${activityId}/decision`, {
        employeeId: rec.employee._id,
        decision: d,
        aiScore: rec.finalScore,
        aiReasons: rec.aiReasons ?? [],
      });
      setDecision(d);
    } catch { alert('Erreur lors de la sauvegarde de la décision'); }
    finally { setSaving(false); }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
      decision === 'approved' ? 'border-green-300' : decision === 'rejected' ? 'border-red-300' : 'border-border'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold text-lg flex-shrink-0 ${
              index === 0 ? 'bg-yellow-100 text-yellow-700' :
              index === 1 ? 'bg-gray-100 text-gray-600' :
              index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'
            }`}>#{index + 1}</div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">{rec.employee.name}</h3>
              <p className="text-muted-foreground text-sm mb-3">{rec.employee.email}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">Score final :</span>
                <span className={`text-2xl font-semibold ${getScoreColor(rec.finalScore)}`}>{rec.finalScore}</span>
                <span className="text-sm text-gray-400">/100</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {decision ? (
              <span className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                decision === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {decision === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {decision === 'approved' ? 'Approuvé' : 'Rejeté'}
              </span>
            ) : (
              <>
                <button onClick={() => handleDecision('approved')} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" /> Approuver
                </button>
                <button onClick={() => handleDecision('rejected')} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-secondary transition-colors text-sm disabled:opacity-50">
                  <XCircle className="w-4 h-4" /> Rejeter
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="w-full bg-secondary rounded-full h-2.5">
            <div className={`h-2.5 rounded-full transition-all ${getScoreBg(rec.finalScore)}`} style={{ width: `${rec.finalScore}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Skill Match', value: rec.skillMatchScore, color: 'bg-blue-400' },
            { label: 'Progression', value: rec.progressionScore, color: 'bg-purple-400' },
            { label: 'Context', value: rec.contextScore, color: 'bg-green-400' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-6 text-right">{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        {rec.employeeSkills.length > 0 && (
          <div className="mb-4">
            <button onClick={() => setExpandedId(expandedId === rec.employee._id ? null : rec.employee._id)}
              className="flex items-center gap-2 text-primary hover:underline text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Compétences ({rec.employeeSkills.length})</span>
            </button>
            {expandedId === rec.employee._id && (
              <div className="flex flex-wrap gap-2 pl-6 border-l-2 border-primary/20">
                {rec.employeeSkills.map((s, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-secondary rounded-full text-gray-700">
                    {s.skillName} · {s.level}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shrink-0"><Brain className="w-5 h-5 text-primary" /></div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 mb-2">AI Insights</p>
              {rec.aiReasons && rec.aiReasons.length > 0 ? (
                <ul className="space-y-1">
                  {rec.aiReasons.map((reason, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">•</span>{reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">Score calculé par le moteur mathématique.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Recommendations({ userRole }: RecommendationsProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [apiResults, setApiResults] = useState<ApiRecommendation[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingReco, setLoadingReco] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [generationStartedAt, setGenerationStartedAt] = useState<Date | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingLast, setLoadingLast] = useState(false);
  const [hasNoReco, setHasNoReco] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [runAllResults, setRunAllResults] = useState<RunAllResult[]>([]);
  const [selectedRunAllActivity, setSelectedRunAllActivity] = useState<string | null>(null);
  const [detailResults, setDetailResults] = useState<{ [activityId: string]: ApiRecommendation[] }>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [lastNSeats, setLastNSeats] = useState(5);
  const cancelledRef = useRef(false);
  const currentActivityRef = useRef<string>('');

  const mergeRankingsWithCandidates = (
    rankings: { employeeId: string; score: number; reasons: string[] }[],
    candidates: ApiRecommendation[],
    decisions: { employeeId: string; decision: string }[] = [],
  ): ApiRecommendation[] =>
    rankings.map((r) => {
      const candidate = candidates.find((c) => String(c.employee._id) === String(r.employeeId));
      const dec = decisions.find((d) => String(d.employeeId) === String(r.employeeId));
      return {
        employee: candidate?.employee ?? { _id: r.employeeId, name: r.employeeId, email: '' },
        skillMatchScore: candidate?.skillMatchScore ?? 0,
        contextScore: candidate?.contextScore ?? 0,
        progressionScore: candidate?.progressionScore ?? 0,
        finalScore: r.score,
        employeeSkills: candidate?.employeeSkills ?? [],
        aiReasons: r.reasons,
        decision: (dec?.decision as 'approved' | 'rejected') ?? undefined,
      };
    });

  const loadLastRecommendation = async (activityId: string) => {
    if (!activityId) return;
    currentActivityRef.current = activityId;
    setLoadingLast(true);
    setApiResults([]);
    setElapsedMs(null);
    setHasNoReco(false);
    try {
      const recoRes = await axios.get(`http://localhost:3000/recommendations/${activityId}`);

      // Stale response — user already switched to another activity
      if (currentActivityRef.current !== activityId) return;

      const ollamaJson = recoRes.data?.jsonOllama;
      if (!ollamaJson?.rankings?.length) {
        if (currentActivityRef.current === activityId) setHasNoReco(true);
        return;
      }

      setElapsedMs(ollamaJson.elapsedMs ?? null);

      const decisionsRes = await axios.get(`http://localhost:3000/recommendations/${activityId}/decisions`);
      if (currentActivityRef.current !== activityId) return;

      let candidates: ApiRecommendation[] = [];
      if (ollamaJson.candidates?.length) {
        candidates = ollamaJson.candidates.map((c: any) => ({
          employee: { _id: c.employeeId, name: c.name, email: c.email },
          skillMatchScore: c.skillMatchScore ?? 0,
          contextScore: c.contextScore ?? 0,
          progressionScore: c.progressionScore ?? 0,
          finalScore: 0,
          employeeSkills: c.employeeSkills ?? [],
        }));
      } else {
        const top100Res = await axios.get(`http://localhost:3000/recommendations/${activityId}/top100`);
        if (currentActivityRef.current !== activityId) return;
        candidates = top100Res.data?.candidates ?? [];
      }

      setApiResults(mergeRankingsWithCandidates(ollamaJson.rankings, candidates, decisionsRes.data ?? []));
    } catch { }
    finally {
      if (currentActivityRef.current === activityId) setLoadingLast(false);
    }
  };

  useEffect(() => {
    axios.get('http://localhost:3000/activities')
      .then((res) => {
        setActivities(res.data);
        if (res.data.length > 0) {
          setSelectedActivityId(res.data[0]._id);
          loadLastRecommendation(res.data[0]._id);
        }
      })
      .catch(() => setActivities([]))
      .finally(() => setLoadingActivities(false));
  }, []);

  const handleCancel = () => {
    cancelledRef.current = true;
    setLoadingReco(false);
  };

  const handleRecommend = async () => {
    if (!selectedActivityId) return;
    cancelledRef.current = false;
    setLoadingReco(true);
    setGenerationStatus('running');
    setGenerationStartedAt(new Date());
    setApiResults([]);
    setElapsedMs(null);
    const launchTime = new Date().toISOString();
    try {
      await axios.post(
        `http://localhost:3000/recommendations/${selectedActivityId}/generate`,
        { top_k: selectedActivity?.nombreDePlaces || lastNSeats },
      );

      // Poll /status toutes les 3s pour afficher l'état, puis /history pour les résultats
      let ollamaJson: any = null;
      for (let attempt = 0; attempt < 200; attempt++) {
        if (cancelledRef.current) return;
        await new Promise((r) => setTimeout(r, 3000));
        if (cancelledRef.current) return;

        try {
          // Vérifier le statut
          const statusRes = await axios.get(`http://localhost:3000/recommendations/${selectedActivityId}/status`);
          const st = statusRes.data?.status;
          if (st === 'done' || st === 'error') {
            setGenerationStatus(st);
          }

          // Chercher le résultat dans l'historique
          const histRes = await axios.get(`http://localhost:3000/recommendations/${selectedActivityId}/history`);
          const newEntry = (histRes.data ?? []).find(
            (e: any) => new Date(e.createdAt) > new Date(launchTime) && e.jsonOllama?.rankings?.length > 0
          );
          if (newEntry) { ollamaJson = newEntry.jsonOllama; break; }
        } catch { /* pas encore prêt */ }
      }

      if (!ollamaJson) { alert('Timeout — Ollama n\'a pas répondu dans les 10 minutes.'); return; }

      setElapsedMs(ollamaJson?.elapsedMs ?? null);
      const rankings: { employeeId: string; score: number; reasons: string[] }[] = ollamaJson?.rankings ?? [];

      const top100Res = await axios.get(`http://localhost:3000/recommendations/${selectedActivityId}/top100`);
      const candidates: ApiRecommendation[] = top100Res.data?.candidates ?? [];
      const decisionsRes = await axios.get(`http://localhost:3000/recommendations/${selectedActivityId}/decisions`);
      setApiResults(mergeRankingsWithCandidates(rankings, candidates, decisionsRes.data ?? []));
      setHasNoReco(false);
    } catch (err: any) {
      setGenerationStatus('error');
      alert(`Erreur : ${err?.response?.data?.message ?? err.message}`);
    } finally {
      setLoadingReco(false);
    }
  };

  const loadDetail = async (activityId: string) => {
    if (selectedRunAllActivity === activityId) {
      setSelectedRunAllActivity(null);
      return;
    }
    setSelectedRunAllActivity(activityId);
    if (detailResults[activityId]) return; // already loaded

    setLoadingDetail(activityId);
    try {
      const [recoRes, top100Res] = await Promise.all([
        axios.get(`http://localhost:3000/recommendations/${activityId}`),
        axios.get(`http://localhost:3000/recommendations/${activityId}/top100`),
      ]);
      const rankings: { employeeId: string; score: number; reasons: string[] }[] =
        recoRes.data?.jsonOllama?.rankings ?? [];
      const candidates: ApiRecommendation[] = top100Res.data?.candidates ?? [];

      const merged: ApiRecommendation[] = rankings.map((r) => {
        const candidate = candidates.find((c) => String(c.employee._id) === String(r.employeeId));
        return {
          employee: candidate?.employee ?? { _id: r.employeeId, name: r.employeeId, email: '' },
          skillMatchScore: candidate?.skillMatchScore ?? 0,
          contextScore: candidate?.contextScore ?? 0,
          progressionScore: candidate?.progressionScore ?? 0,
          finalScore: r.score,
          employeeSkills: candidate?.employeeSkills ?? [],
          aiReasons: r.reasons,
        };
      });
      setDetailResults((prev) => ({ ...prev, [activityId]: merged }));
    } catch {
      setDetailResults((prev) => ({ ...prev, [activityId]: [] }));
    } finally {
      setLoadingDetail(null);
    }
  };

  const handleRunAll = async () => {
    if (!window.confirm(`Lancer Ollama sur toutes les activités (${activities.length}) ? Cela peut prendre plusieurs minutes.`)) return;
    setLoadingAll(true);
    setRunAllResults([]);
    // Fire-and-forget — le backend tourne en arrière-plan
    axios.post('http://localhost:3000/recommendations/generate-all', { top_k: lastNSeats })
      .catch((err: any) => alert(`Erreur : ${err?.response?.data?.message ?? err.message}`));
    // Retour immédiat — afficher un message informatif (pas d'activityId fictif)
    setRunAllResults([{ activityId: '', title: '⏳ Run All lancé en arrière-plan — consulte l\'historique de chaque activité pour voir les résultats au fur et à mesure.', elapsedMs: 0, rankings: 0 }]);
    setLoadingAll(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-blue-600';
    if (score >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-blue-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatElapsed = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const selectedActivity = activities.find((a) => a._id === selectedActivityId);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-gray-900">AI Recommendation Engine</h1>
        <p className="text-muted-foreground">Get intelligent employee recommendations based on skills and activity requirements</p>
      </div>

      {/* Activity Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg"><Brain className="w-6 h-6 text-primary" /></div>
          <div>
            <h2 className="text-xl text-gray-900">Select Activity</h2>
            <p className="text-sm text-muted-foreground">Choose an activity to see AI-powered recommendations</p>
          </div>
        </div>

        <div className="flex gap-3 items-stretch mb-3">
          {/* Dropdown */}
          <div className="relative flex-1">
            <select
              value={selectedActivityId}
              onChange={(e) => { setSelectedActivityId(e.target.value); setApiResults([]); setElapsedMs(null); loadLastRecommendation(e.target.value); }}
              disabled={loadingActivities}
              className="w-full appearance-none px-4 py-3 pr-10 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base bg-white disabled:opacity-50"
            >
              {loadingActivities ? <option>Chargement...</option> :
                activities.length === 0 ? <option>Aucune activité disponible</option> :
                activities.map((a) => <option key={a._id} value={a._id}>{a.title}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Last N seats */}
          <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-lg bg-white shrink-0">
            <Users size={15} className="text-gray-400" />
            <span className="text-sm text-gray-500">
              {selectedActivity?.nombreDePlaces
                ? `${selectedActivity.nombreDePlaces} places`
                : 'Top'}
            </span>
            {!selectedActivity?.nombreDePlaces && (
              <input
                type="number" min={1} max={20} value={lastNSeats}
                onChange={(e) => setLastNSeats(Math.max(1, parseInt(e.target.value) || 5))}
                className="w-12 text-center text-sm font-medium border-0 focus:outline-none"
              />
            )}
          </div>

          {/* Single activity button */}
          <button onClick={handleRecommend} disabled={!selectedActivityId || loadingReco || loadingActivities}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium shrink-0">
            {loadingReco
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Sparkles className="w-4 h-4" />}
            {loadingReco ? 'Génération Ollama...' : 'Recommandation IA'}
          </button>

          {/* Cancel button */}
          {loadingReco && (
            <button onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shrink-0">
              <X className="w-4 h-4" /> Annuler
            </button>
          )}

          {/* Run all button — temporarily disabled */}
          {/* <button onClick={handleRunAll} disabled={loadingAll || loadingReco || activities.length === 0}
            className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium shrink-0"
            title={`Lancer sur toutes les activités (${activities.length})`}>
            {loadingAll
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <PlayCircle className="w-4 h-4" />}
            {loadingAll ? 'En cours...' : 'Run All'}
          </button> */}
        </div>

        {/* Elapsed time */}
        {elapsedMs !== null && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <Clock size={14} className="text-green-500" />
            <span>Généré en <span className="font-medium text-gray-700">{formatElapsed(elapsedMs)}</span></span>
          </div>
        )}

        {/* Generation status banner */}
        {loadingReco && generationStatus === 'running' && (
          <div className="mt-3 flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700">
            <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin shrink-0" />
            <div>
              <span className="font-medium">Ollama génère les recommandations…</span>
              {generationStartedAt && (
                <ElapsedTimer startedAt={generationStartedAt} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Run All Results */}
      {runAllResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-5 border border-border">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <PlayCircle size={16} className="text-indigo-600" />
            Résultats Run All ({runAllResults.length} activités)
          </h3>
          <div className="space-y-2">
            {runAllResults.map((r) => (
              <div key={r.activityId}>
                <div
                  onClick={() => !r.error && r.activityId && loadDetail(r.activityId)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    r.error ? 'bg-red-50' :
                    selectedRunAllActivity === r.activityId ? 'bg-indigo-50 border border-indigo-200' :
                    'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                  }`}
                >
                  <span className="font-medium text-gray-800 truncate flex-1">{r.title}</span>
                  <div className="flex items-center gap-4 shrink-0 ml-3">
                    {r.error ? (
                      <span className="text-red-500 text-xs">{r.error}</span>
                    ) : (
                      <>
                        <span className="text-gray-500">{r.rankings} rankings</span>
                        <span className="flex items-center gap-1 text-green-600">
                          <Clock size={12} />{formatElapsed(r.elapsedMs)}
                        </span>
                        {loadingDetail === r.activityId
                          ? <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          : <ChevronDown size={14} className={`text-gray-400 transition-transform ${selectedRunAllActivity === r.activityId ? 'rotate-180' : ''}`} />
                        }
                      </>
                    )}
                  </div>
                </div>

                {/* Detail panel */}
                {selectedRunAllActivity === r.activityId && detailResults[r.activityId] && (
                  <div className="mt-2 ml-3 space-y-3 border-l-2 border-indigo-200 pl-4">
                    {detailResults[r.activityId].length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">Aucune recommandation disponible.</p>
                    ) : (
                      detailResults[r.activityId].map((rec, index) => (
                        <RecommendationCard
                          key={rec.employee._id}
                          rec={rec}
                          index={index}
                          activityId={r.activityId}
                          expandedId={expandedId}
                          setExpandedId={setExpandedId}
                          getScoreColor={getScoreColor}
                          getScoreBg={getScoreBg}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading last recommendation */}
      {loadingLast && (
        <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
          <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm">Chargement de la dernière recommandation…</span>
        </div>
      )}

      {/* Empty state */}
      {apiResults.length === 0 && !loadingReco && !loadingLast && runAllResults.length === 0 && (
        hasNoReco ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="p-5 bg-indigo-50 rounded-full">
              <Sparkles className="w-10 h-10 text-indigo-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800 mb-1">Aucune recommandation pour cette activité</p>
              <p className="text-sm text-gray-500 max-w-sm">
                Cette activité n'a pas encore été analysée par l'IA. Lance une recommandation pour obtenir le classement des meilleurs candidats.
              </p>
            </div>
            <button
              onClick={handleRecommend}
              disabled={!selectedActivityId || loadingReco || loadingActivities}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Lancer la recommandation IA
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Brain className="w-4 h-4" />
              <span>Exemple de card — les vraies données apparaîtront après le calcul</span>
            </div>
            <RecommendationCard rec={MOCK_CARD} index={0} activityId="" expandedId={expandedId} setExpandedId={setExpandedId} getScoreColor={getScoreColor} getScoreBg={getScoreBg} />
          </div>
        )
      )}

      {/* Results */}
      {apiResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-gray-900">
              Top {apiResults.length} employés recommandés
              {selectedActivity && <span className="text-base font-normal text-gray-500 ml-2">— {selectedActivity.title}</span>}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {elapsedMs !== null && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <Clock size={13} />{formatElapsed(elapsedMs)}
                </span>
              )}
              <span>Skill 40% · Progression 30% · Context 30%</span>
            </div>
          </div>

          {apiResults.map((rec, index) => (
            <RecommendationCard key={rec.employee._id} rec={rec} index={index}
              activityId={selectedActivityId}
              expandedId={expandedId} setExpandedId={setExpandedId}
              getScoreColor={getScoreColor} getScoreBg={getScoreBg} />
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <h3 className="font-semibold text-gray-900 mb-3">How Our AI Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { icon: <Target className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100', title: 'Skill Matching (40%)', desc: 'Ratio pondéré entre le niveau employé et le niveau requis' },
            { icon: <Brain className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100', title: 'Progression (30%)', desc: 'Zone idéale d\'apprentissage — gap de 1 ou 2 niveaux' },
            { icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-100', title: 'Context (30%)', desc: 'Adéquation avec le contexte (Upskilling, Expertise…)' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className={`p-2 ${item.bg} rounded-lg flex-shrink-0`}>{item.icon}</div>
              <div>
                <p className="font-medium text-gray-900 mb-1">{item.title}</p>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
