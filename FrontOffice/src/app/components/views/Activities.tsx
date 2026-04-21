import { useState, useEffect } from 'react';
import { Search, Plus, X, Sparkles } from 'lucide-react';
import API, { apiGet } from '../../../api/api';
import { ActivityCard } from '../activities/ActivityCard';
import { extractSkills } from '../../../api/nlpApi';
import { Activity } from '../activities/types';
import { ActivityRecommendations } from '../activities/ActivityRecommendations';
import { ActivityRecommendationHistory } from '../activities/ActivityRecommendationHistory';
import { useVoiceCommand } from '../voice/VoiceCommandContext';
import Pagination from '../ui/pagination';
import { useAppTranslation } from '../../hooks/useAppTranslation';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useFocusTrap } from '../../hooks/useFocusTrap';

type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';

interface ActivitiesProps {
  userRole: UserRole;
  language?: string;
}

interface SkillEntry { skillId: string; level: string; contributionToScore: number; }

const EMPTY_FORM = {
  title: '',
  description: '',
  type: '',
  context: '',
  status: 'Draft',
  startDate: '',
  endDate: '',
  nombreDePlaces: 0,
  targetedDepartmentId: '',
};

const LEVELS = ['Low', 'Medium', 'High', 'Expert'];

export function Activities({ userRole }: ActivitiesProps) {
  const t = useAppTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [requiredSkills, setRequiredSkills] = useState<SkillEntry[]>([]);
  const [skillPick, setSkillPick] = useState('');
  const [levelPick, setLevelPick] = useState('Medium');
  const [contribPick, setContribPick] = useState(1);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [recommendActivity, setRecommendActivity] = useState<Activity | null>(null);
  const [historyActivity, setHistoryActivity] = useState<Activity | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDeleteActivity, setConfirmDeleteActivity] = useState<Activity | null>(null);
  const itemsPerPage = 9;

  // WCAG 2.1.1 — focus trap sur la modal de création/édition
  const modalRef = useFocusTrap(showModal, () => setShowModal(false));

  const { pendingCommand, commandData, clearPendingCommand } = useVoiceCommand();

  useEffect(() => {
    // Fire all 3 independent requests in parallel — total time = slowest one,
    // not the sum of all 3 (was ~3× slower with sequential awaits).
    // apiGet deduplicates /departments and /skills if Skills view is also mounted.
    Promise.all([
      apiGet(userRole === 'Manager' ? '/departments/my' : '/departments').catch(() => ({ data: [] })),
      API.get('/activities').catch(() => ({ data: [] })),
      apiGet('/skills').catch(() => ({ data: [] })),
    ]).then(([deptRes, actRes, skillRes]) => {
      setDepartments(deptRes.data);
      setActivities(actRes.data);
      setSkills(skillRes.data);
      setLoading(false);
    });
  }, [userRole]);

  useEffect(() => {
    if (pendingCommand === 'create-activity') {
      if (commandData?.name) createActivityDirectly(commandData.name);
      else openCreate();
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand]);

  const fetchDepartments = async () => {
    try {
      const url = userRole === 'Manager' ? '/departments/my' : '/departments';
      const res = await API.get(url);
      setDepartments(res.data);
    }
    catch { setDepartments([]); }
  };

  const fetchSkills = async () => {
    try { const res = await API.get('/skills'); setSkills(res.data); }
    catch { setSkills([]); }
  };

  // Used after mutations (create/update/delete) to refresh only activities
  const fetchActivities = async () => {
    setLoading(true);
    try { const res = await API.get('/activities'); setActivities(res.data); }
    catch { setActivities([]); }
    finally { setLoading(false); }
  };

  // Extract skills from description using NLP with level detection
  const handleExtractSkills = async () => {
    if (!form.description && !form.title) return;

    // Combine title + description for better skill detection
    const combinedText = `${form.title} ${form.description}`.trim();

    try {
      const res = await extractSkills(combinedText);
      const extractedSkills = res.data.skills || [];
      
      // Map NLP levels to our levels
      const levelMap: Record<string, string> = {
        'Beginner': 'Low',
        'Intermediate': 'Medium', 
        'Advanced': 'High',
        'Expert': 'Expert'
      };
      
      // Add extracted skills to requiredSkills if not already present
      const newSkills: SkillEntry[] = [];
      for (const extracted of extractedSkills) {
        const skillName = typeof extracted === 'string' ? extracted : extracted.skill;
        const skillLevel = typeof extracted === 'string' ? 'Medium' : extracted.level;
        
        const skill = skills.find((s: any) => s.name.toLowerCase() === skillName.toLowerCase());
        if (skill && !requiredSkills.find(rs => rs.skillId === skill._id)) {
          newSkills.push({
            skillId: skill._id,
            level: levelMap[skillLevel] || 'Medium',
            contributionToScore: 1
          });
        }
      }
      
      if (newSkills.length > 0) {
        setRequiredSkills([...requiredSkills, ...newSkills]);
      }
    } catch (err) {
      console.error('Error extracting skills:', err);
    }
  };

  const openCreate = () => {
    setEditingActivity(null);
    setForm(EMPTY_FORM);
    setRequiredSkills([]);
    setSkillPick('');
    setLevelPick('Medium');
    setContribPick(1);
    setSkillSearch('');
    setShowModal(true);
  };

  const openEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setForm({
      title: activity.title,
      description: activity.description ?? '',
      type: activity.type ?? '',
      context: activity.context ?? '',
      status: activity.status,
      startDate: activity.startDate ? activity.startDate.slice(0, 10) : '',
      endDate: activity.endDate ? activity.endDate.slice(0, 10) : '',
      nombreDePlaces: activity.nombreDePlaces,
      targetedDepartmentId: activity.targetedDepartmentId ?? '',
    });
    // normalize requiredSkills (populated or raw)
    setRequiredSkills(
      (activity.requiredSkills ?? []).map((rs) => ({
        skillId: typeof rs.skillId === 'object' ? rs.skillId._id : rs.skillId,
        level: rs.level,
        contributionToScore: (rs as any).contributionToScore ?? 1,
      }))
    );
    setSkillPick('');
    setLevelPick('Medium');
    setContribPick(1);
    setSkillSearch('');
    setShowModal(true);
  };

  const addSkill = () => {
    if (!skillPick) return;
    if (requiredSkills.some((rs) => rs.skillId === skillPick)) return;
    setRequiredSkills([...requiredSkills, { skillId: skillPick, level: levelPick, contributionToScore: contribPick }]);
    setSkillPick('');
    setSkillSearch('');
    setLevelPick('Medium');
    setContribPick(1);
  };

  const removeSkill = (skillId: string) => {
    setRequiredSkills(requiredSkills.filter((rs) => rs.skillId !== skillId));
  };

  const updateSkillLevel = (skillId: string, level: string) => {
    setRequiredSkills(requiredSkills.map((rs) => rs.skillId === skillId ? { ...rs, level } : rs));
  };

  const updateSkillContrib = (skillId: string, contributionToScore: number) => {
    setRequiredSkills(requiredSkills.map((rs) => rs.skillId === skillId ? { ...rs, contributionToScore } : rs));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    const payload = { ...form, requiredSkills };
    try {
      if (editingActivity) {
        await API.patch(`/activities/${editingActivity._id}`, payload);
      } else {
        await API.post('/activities', payload);
      }
      fetchActivities();
      setShowModal(false);
    } catch { alert('Erreur lors de la sauvegarde'); }
  };

  const handleDelete = async (id: string) => {
    // WCAG 2.1.1 — window.confirm() est bloquant et non accessible
    // Remplacé par ConfirmDialog (voir state confirmDeleteActivity)
    const activity = activities.find(a => a._id === id);
    if (activity) setConfirmDeleteActivity(activity);
  };

  const doDelete = async (id: string) => {
    try { await API.delete(`/activities/${id}`); fetchActivities(); }
    catch { alert('Erreur lors de la suppression'); }
  };

  const createActivityDirectly = async (name: string) => {
    try {
      await API.post('/activities', { title: name, status: 'Draft', nombreDePlaces: 0, requiredSkills: [] });
      fetchActivities();
    } catch { alert(`Erreur lors de la création de "${name}"`); }
  };

  const filtered = activities.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset page on search change
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const canManage = userRole === 'Manager' || userRole === 'SUPERADMIN';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1 text-foreground">{t('activities')}</h1>
          <p className="text-muted-foreground">{t('activitiesDesc')}</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-5 h-5" /> {t('addActivity')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchActivities')}
              aria-label={t('searchActivities')}            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t('showingActivities', { count: filtered.length, total: activities.length })}</p>
      </div>

      {/* WCAG 4.1.3 — aria-live annonce les changements de liste aux lecteurs d'écran */}
      <div aria-live="polite" aria-atomic="false">
      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Chargement des activités…">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100 border border-slate-200" aria-hidden="true" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-lg font-semibold text-foreground">
            {activities.length === 0 ? t('noActivitiesYet') : t('noActivitiesFound')}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {activities.length === 0 ? t('startAddingActivity') : t('tryDifferentSearch')}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map((activity) => {
              const dept = departments.find((d) => d._id === activity.targetedDepartmentId);
              return (
                <ActivityCard
                  key={activity._id}
                  activity={activity}
                  departmentName={dept?.name}
                  userRole={userRole}
                  onEdit={canManage ? openEdit : () => {}}
                  onDelete={canManage ? handleDelete : () => {}}
                  onRecommend={canManage ? setRecommendActivity : undefined}
                  onHistory={canManage ? setHistoryActivity : undefined}
                />
              );
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
      </div>{/* end aria-live */}

      {/* Modal — WCAG 2.1.1 focus trap + 4.1.2 role/aria */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" aria-hidden="true" />
      )}
      {showModal && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-card rounded-xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 id="activity-modal-title" className="text-xl font-semibold text-foreground mb-5">
              {editingActivity ? "Modifier l'activité" : 'Nouvelle activité'}
            </h2>

            <div className="space-y-4">
              <div>
                {/* WCAG 1.3.1 — htmlFor associe le label à l'input */}
                <label htmlFor="act-title" className="block text-sm text-foreground mb-1">
                  Titre <span aria-hidden="true" className="text-destructive">*</span>
                  <span className="sr-only">(obligatoire)</span>
                </label>
                <input
                  id="act-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Titre de l'activité"
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="act-description" className="block text-sm text-foreground mb-1">
                  Description
                  <button type="button" onClick={handleExtractSkills}
                    className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Extraire automatiquement les compétences depuis la description">
                    <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />
                    Extraire
                  </button>
                </label>
                <textarea
                  id="act-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Décrivez l'activité…"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="act-type" className="block text-sm text-foreground mb-1">Type</label>
                  <input
                    id="act-type"
                    type="text"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ex: Workshop"
                  />
                </div>
                <div>
                  <label htmlFor="act-context" className="block text-sm text-foreground mb-1">Contexte</label>
                  <select
                    id="act-context"
                    value={form.context}
                    onChange={(e) => setForm({ ...form, context: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Choisir --</option>
                    <option value="Upskilling">Upskilling</option>
                    <option value="Expertise">Expertise</option>
                    <option value="Consolidation">Consolidation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="act-status" className="block text-sm text-foreground mb-1">Statut</label>
                  <select
                    id="act-status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Validated">Validated</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="act-places" className="block text-sm text-foreground mb-1">Nombre de places</label>
                  <input
                    id="act-places"
                    type="number"
                    min={0}
                    value={form.nombreDePlaces}
                    onChange={(e) => setForm({ ...form, nombreDePlaces: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="act-start" className="block text-sm text-foreground mb-1">Date début</label>
                  <input
                    id="act-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="act-end" className="block text-sm text-foreground mb-1">Date fin</label>
                  <input
                    id="act-end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="act-dept" className="block text-sm text-foreground mb-1">Département cible</label>
                <select
                  id="act-dept"
                  value={form.targetedDepartmentId}
                  onChange={(e) => setForm({ ...form, targetedDepartmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Aucun --</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>

              {/* Required Skills */}
              <div>
                <label className="block text-sm text-foreground mb-2">Required Skills</label>

                {/* Picker */}
                <div className="flex gap-2 mb-3">
                  {/* Autocomplete skill search */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={(e) => { setSkillSearch(e.target.value); setSkillPick(''); setShowSkillDropdown(true); }}
                      onFocus={() => setShowSkillDropdown(true)}
                      onBlur={() => setTimeout(() => setShowSkillDropdown(false), 150)}
                      placeholder="Rechercher un skill..."
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {showSkillDropdown && skillSearch.trim().length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {skills
                          .filter((s) =>
                            s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
                            !requiredSkills.some((rs) => rs.skillId === s._id)
                          )
                          .slice(0, 20)
                          .map((s) => (
                            <button
                              key={s._id}
                              type="button"
                              onMouseDown={() => {
                                setSkillPick(s._id);
                                setSkillSearch(s.name);
                                setShowSkillDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              {s.name}
                            </button>
                          ))}
                        {skills.filter((s) =>
                          s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
                          !requiredSkills.some((rs) => rs.skillId === s._id)
                        ).length === 0 && (
                          <p className="px-3 py-2 text-sm text-muted-foreground">Aucun skill trouvé</p>
                        )}
                      </div>
                    )}
                  </div>
                  <select value={levelPick} onChange={(e) => setLevelPick(e.target.value)}
                    className="px-2 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <input
                    type="number" min={1} max={100} value={contribPick}
                    onChange={(e) => setContribPick(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-2 border border-input rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Poids (contribution au score)"
                  />
                  <button type="button" onClick={addSkill} disabled={!skillPick}
                    aria-label="Ajouter le skill sélectionné"
                    className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors">
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Le poids détermine l'importance relative de chaque skill dans le score.</p>

                {/* List */}
                {requiredSkills.length > 0 && (
                  <div className="space-y-2">
                    {requiredSkills.map((rs) => {
                      const skill = skills.find((s) => s._id === rs.skillId);
                      const totalContrib = requiredSkills.reduce((s, r) => s + r.contributionToScore, 0);
                      const pct = totalContrib > 0 ? Math.round((rs.contributionToScore / totalContrib) * 100) : 0;
                      return (
                        <div key={rs.skillId} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <span className="flex-1 text-sm text-foreground min-w-0 truncate">{skill?.name ?? rs.skillId}</span>
                          <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                          <select value={rs.level} onChange={(e) => updateSkillLevel(rs.skillId, e.target.value)}
                            className="text-xs px-2 py-1 border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary">
                            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                          <input
                            type="number" min={1} max={100} value={rs.contributionToScore}
                            onChange={(e) => updateSkillContrib(rs.skillId, Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-14 text-xs px-2 py-1 border border-input rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-primary"
                            title="Poids"
                          />
                          <button type="button" onClick={() => removeSkill(rs.skillId)}
                            aria-label={`Retirer le skill ${skills.find(s => s._id === rs.skillId)?.name ?? rs.skillId}`}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors">
                            <X size={14} aria-hidden="true" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.title.trim()}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {editingActivity ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Recommendations Panel */}
      {recommendActivity && (
        <ActivityRecommendations
          activityId={recommendActivity._id}
          activityTitle={recommendActivity.title}
          onClose={() => setRecommendActivity(null)}
        />
      )}

      {/* History Panel */}
      {historyActivity && (
        <ActivityRecommendationHistory
          activityId={historyActivity._id}
          activityTitle={historyActivity.title}
          onClose={() => setHistoryActivity(null)}
        />
      )}

      {/* WCAG 2.1.1 — ConfirmDialog remplace window.confirm() non accessible */}
      <ConfirmDialog
        open={!!confirmDeleteActivity}
        title="Supprimer l'activité"
        message={`Voulez-vous vraiment supprimer "${confirmDeleteActivity?.title}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={async () => {
          if (confirmDeleteActivity) {
            await doDelete(confirmDeleteActivity._id);
            setConfirmDeleteActivity(null);
          }
        }}
        onCancel={() => setConfirmDeleteActivity(null)}
      />
    </div>
  );
}


