import { useState, useEffect } from 'react';
import { Search, Plus, X, Sparkles } from 'lucide-react';
import axios from 'axios';
import { ActivityCard } from '../activities/ActivityCard';
import { extractSkills } from '../../../api/nlpApi';
import { Activity } from '../activities/types';
import { ActivityRecommendations } from '../activities/ActivityRecommendations';
import { ActivityRecommendationHistory } from '../activities/ActivityRecommendationHistory';
import { useVoiceCommand } from '../voice/VoiceCommandContext';
import Pagination from '../ui/Pagination';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface ActivitiesProps {
  userRole: UserRole;
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
  const itemsPerPage = 9;

  const { pendingCommand, commandData, clearPendingCommand } = useVoiceCommand();

  useEffect(() => { fetchDepartments(); fetchActivities(); fetchSkills(); }, []);

  useEffect(() => {
    if (pendingCommand === 'create-activity') {
      if (commandData?.name) createActivityDirectly(commandData.name);
      else openCreate();
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand]);

  const fetchDepartments = async () => {
    try { const res = await axios.get('http://localhost:3000/departments'); setDepartments(res.data); }
    catch { setDepartments([]); }
  };

  const fetchSkills = async () => {
    try { const res = await axios.get('http://localhost:3000/skills'); setSkills(res.data); }
    catch { setSkills([]); }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try { const res = await axios.get('http://localhost:3000/activities'); setActivities(res.data); }
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
        await axios.patch(`http://localhost:3000/activities/${editingActivity._id}`, payload);
      } else {
        await axios.post('http://localhost:3000/activities', payload);
      }
      fetchActivities();
      setShowModal(false);
    } catch { alert('Erreur lors de la sauvegarde'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette activité ?')) return;
    try { await axios.delete(`http://localhost:3000/activities/${id}`); fetchActivities(); }
    catch { alert('Erreur lors de la suppression'); }
  };

  const createActivityDirectly = async (name: string) => {
    try {
      await axios.post('http://localhost:3000/activities', { title: name, status: 'Draft', nombreDePlaces: 0, requiredSkills: [] });
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

  const canManage = userRole === 'HR' || userRole === 'Manager';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1 text-gray-900">Activities</h1>
          <p className="text-muted-foreground">Manage training programs and development activities</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-5 h-5" /> Create Activity
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search activities..."              aria-label="Rechercher une activité"            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Showing {filtered.length} of {activities.length} activities</p>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100 border border-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-lg font-semibold text-slate-800">
            {activities.length === 0 ? 'Aucune activité pour le moment' : 'Aucun résultat trouvé'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {activities.length === 0 ? 'Commence par créer ta première activité.' : 'Essaie une autre recherche.'}
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
                  onEdit={openEdit}
                  onDelete={handleDelete}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">
              {editingActivity ? "Modifier l'activité" : 'Nouvelle activité'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Titre *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Titre de l'activité" />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Description
                  <button type="button" onClick={handleExtractSkills}
                    className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                    title="Extraire automatiquement les compétences">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Extraire
                  </button>
                </label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" rows={3}
                  placeholder="Décrivez l'activité... (ex: Formation React et Node.js pour équipe frontend)" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Type</label>
                  <input type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ex: Workshop" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Contexte</label>
                  <select value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">-- Choisir --</option>
                    <option value="Upskilling">Upskilling</option>
                    <option value="Expertise">Expertise</option>
                    <option value="Consolidation">Consolidation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Statut</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Draft">Draft</option>
                    <option value="Validated">Validated</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Nombre de places</label>
                  <input type="number" min={0} value={form.nombreDePlaces}
                    onChange={(e) => setForm({ ...form, nombreDePlaces: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date début</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date fin</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Département cible</label>
                <select value={form.targetedDepartmentId} onChange={(e) => setForm({ ...form, targetedDepartmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">-- Aucun --</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>

              {/* Required Skills */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Required Skills</label>

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
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                          <p className="px-3 py-2 text-sm text-gray-400">Aucun skill trouvé</p>
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
                <p className="text-xs text-gray-400 mb-3">Le poids détermine l'importance relative de chaque skill dans le score.</p>

                {/* List */}
                {requiredSkills.length > 0 && (
                  <div className="space-y-2">
                    {requiredSkills.map((rs) => {
                      const skill = skills.find((s) => s._id === rs.skillId);
                      const totalContrib = requiredSkills.reduce((s, r) => s + r.contributionToScore, 0);
                      const pct = totalContrib > 0 ? Math.round((rs.contributionToScore / totalContrib) * 100) : 0;
                      return (
                        <div key={rs.skillId} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <span className="flex-1 text-sm text-gray-800 min-w-0 truncate">{skill?.name ?? rs.skillId}</span>
                          <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
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
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-secondary transition-colors">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={!form.title.trim()}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
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
    </div>
  );
}
