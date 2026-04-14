import { useEffect, useState } from 'react';
import { Mail, Briefcase, Building2, BookOpen, CheckCircle, Star } from 'lucide-react';
import API from '../../../api/api';

type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';

interface ProfileProps {
  user: { email: string; role: UserRole; name: string; id?: string };
}

const LEVEL_COLORS: Record<string, string> = {
  LOW:    'bg-yellow-50 text-yellow-700',
  MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH:   'bg-green-50 text-green-700',
  EXPERT: 'bg-purple-50 text-purple-700',
};

export function Profile({ user }: ProfileProps) {
  const [profile, setProfile]       = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [approvedActivities, setApprovedActivities] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const meRes = await API.get('/users/me');
        setProfile(meRes.data);

        if (user.role === 'Manager') {
          const deptRes = await API.get('/departments/my');
          setDepartments(deptRes.data || []);
        }

        if (user.role === 'Employee') {
          const approvedRes = await API.get(`/recommendations/employee/${meRes.data._id}/approved`);
          setApprovedActivities(approvedRes.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.role]);

  if (loading) return <div className="p-6 text-center text-slate-500">Chargement du profil…</div>;
  if (!profile) return <div className="p-6 text-center text-red-500">Impossible de charger le profil.</div>;

  const skills: any[] = profile.skills || [];
  const initials = profile.name?.substring(0, 2).toUpperCase() ?? '??';

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* ── Card Info ── */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h1>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{profile.email}</div>
              <div className="flex items-center gap-2"><Briefcase className="w-4 h-4" />{profile.role}</div>
              {profile.departmentId?.name && (
                <div className="flex items-center gap-2"><Building2 className="w-4 h-4" />{profile.departmentId.name}</div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">{skills.length}</p>
              <p className="text-xs text-muted-foreground">Skills</p>
            </div>
            {user.role === 'Employee' && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-900">{approvedActivities.length}</p>
                <p className="text-xs text-muted-foreground">Activités</p>
              </div>
            )}
            {user.role === 'Manager' && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                <p className="text-xs text-muted-foreground">Départements</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Card Skills (Employee + Manager) ── */}
      {(user.role === 'Employee' || user.role === 'Manager') && (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Mes Skills</h2>
            <span className="ml-auto text-sm text-muted-foreground">{skills.length} skill{skills.length > 1 ? 's' : ''}</span>
          </div>
          {skills.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucun skill enregistré.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s: any, i: number) => (
                <span key={i} className={`text-xs px-3 py-1 rounded-full font-medium ${LEVEL_COLORS[s.level?.toUpperCase?.()] ?? 'bg-gray-100 text-gray-700'}`}>
                  {s.name ?? s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Card Activités approuvées (Employee uniquement) ── */}
      {user.role === 'Employee' && (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">Activités approuvées</h2>
          </div>
          {approvedActivities.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucune activité approuvée pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {approvedActivities.map((a: any) => (
                <div key={a._id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{a.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.type && <span className="mr-2">{a.type}</span>}
                        {a.context && <span className="mr-2">· {a.context}</span>}
                        {a.decidedAt && <span>· Approuvé le {new Date(a.decidedAt).toLocaleDateString('fr-FR')}</span>}
                      </p>
                    </div>
                    {a.aiScore != null && (
                      <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                        Score {a.aiScore}
                      </span>
                    )}
                  </div>
                  {a.requiredSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.requiredSkills.map((rs: any, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                          {typeof rs.skillId === 'object' ? rs.skillId.name : rs.skillId}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Card Départements (Manager uniquement) ── */}
      {user.role === 'Manager' && (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Mes Départements</h2>
          </div>
          {departments.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucun département assigné.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {departments.map((d: any) => (
                <div key={d._id} className="border border-border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{d.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{d._id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Card Skills HR/SUPERADMIN ── */}
      {(user.role === 'HR' || user.role === 'SUPERADMIN') && (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Informations du compte</h2>
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{profile.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{profile.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Rôle</span>
              <span className="font-medium">{profile.role}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
