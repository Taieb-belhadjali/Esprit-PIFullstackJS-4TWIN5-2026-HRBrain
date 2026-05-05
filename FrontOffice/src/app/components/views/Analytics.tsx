import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Users, Target, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Cell,
} from 'recharts';
import API from '../../../api/api';

// Types et rôles utilisateur
type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';

// Props du composant Analytics
interface AnalyticsProps {
  userRole: UserRole;
  language?: string;
}

// Interface pour les données d'activité depuis l'API
interface AnalyticsActivity {
  _id: string;
  title: string;
  status?: string;
  startDate?: string;
  createdAt?: string; // Date de création pour le filtrage
  requiredSkills?: Array<{ skillId: any }>; // Compétences requises
}

// Interface pour les départements
interface AnalyticsDepartment {
  _id: string;
  name: string;
}

// Couleurs pour les graphiques en secteurs
const COLORS = ['#2563EB', '#9333EA', '#059669', '#F59E0B', '#EF4444', '#7C3AED', '#2563EB'];

/**
 * Formate une date en string français (jour mois année)
 * @param dateString - La date à formater
 * @returns La date formatée ou 'N/A' si invalide
 */
function formatDateLabel(dateString?: string) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Calcule la date de début selon la période sélectionnée
 * @param range - La période ('1month', '3months', etc.)
 * @returns La date de début correspondante
 */
function getTimeRangeStart(range: string) {
  const now = new Date();
  switch (range) {
    case '1month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3months':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6months':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  }
}

/**
 * Composant Analytics - Dashboard d'analyses pour les employés, activités et compétences
 * @param userRole - Rôle de l'utilisateur connecté
 */
export function Analytics({ userRole }: AnalyticsProps) {
  // Aggregated stats from backend (no heavy user list)
  const [totalEmployees,   setTotalEmployees]   = useState(0);
  const [empByDeptData,    setEmpByDeptData]    = useState<{ name: string; count: number }[]>([]);
  const [roleDistData,     setRoleDistData]     = useState<{ role: string; count: number }[]>([]);
  const [totalSkills,      setTotalSkills]      = useState(0);
  const [activities,       setActivities]       = useState<AnalyticsActivity[]>([]);
  const [departments,      setDepartments]      = useState<AnalyticsDepartment[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);
  const [timeRange,        setTimeRange]        = useState('6months');

  // Load activities + departments once per role change (not affected by timeRange)
  useEffect(() => {
    async function loadStatic() {
      try {
        setLoading(true);
        setError(null);
        if (userRole === 'Manager') {
          const [activitiesRes, deptRes] = await Promise.all([
            API.get<AnalyticsActivity[]>('/activities'),
            API.get<AnalyticsDepartment[]>('/departments/my'),
          ]);
          const myDepts: AnalyticsDepartment[] = Array.isArray(deptRes.data) ? deptRes.data : [];
          setDepartments(myDepts);
          setActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);
          const firstDeptId = myDepts[0]?._id;
          if (firstDeptId) {
            const scRes = await API.get(`/skills/count?departmentId=${firstDeptId}`);
            setTotalSkills(scRes.data?.count ?? 0);
          }
        } else {
          const [activitiesRes, departmentsRes, skillCountRes] = await Promise.all([
            API.get<AnalyticsActivity[]>('/activities'),
            API.get<AnalyticsDepartment[]>('/departments'),
            API.get('/skills/count'),
          ]);
          setActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);
          setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data : []);
          setTotalSkills(skillCountRes.data?.count ?? 0);
        }
      } catch (err) {
        console.error('Analytics static load failed', err);
        setError('Impossible de charger les données analytics.');
      } finally {
        setLoading(false);
      }
    }
    loadStatic();
  }, [userRole]);

  // Reload user-aggregation stats whenever role OR time range changes
  useEffect(() => {
    async function loadStats() {
      try {
        const since = getTimeRangeStart(timeRange).toISOString();
        const statsRes = await API.get(`/users/analytics-stats?since=${encodeURIComponent(since)}`);
        setTotalEmployees(statsRes.data?.employeeCount ?? 0);
        setEmpByDeptData(
          (statsRes.data?.empByDept ?? []).map((d: any) => ({
            name: d.department ?? d.name ?? 'Inconnu',
            count: d.count,
          })),
        );
        setRoleDistData(Array.isArray(statsRes.data?.roleDistribution) ? statsRes.data.roleDistribution : []);
      } catch (err) {
        console.error('Analytics stats load failed', err);
      }
    }
    loadStats();
  }, [userRole, timeRange]);

  const timeRangeStart = useMemo(() => getTimeRangeStart(timeRange), [timeRange]);

  // Only activities are filtered by time range (users come pre-aggregated)
  const filteredActivities = useMemo(() => {
    return (Array.isArray(activities) ? activities : []).filter((activity) => {
      const dateString = activity.createdAt || activity.startDate;
      if (!dateString) return true;
      const date = new Date(dateString);
      return !isNaN(date.getTime()) && date >= timeRangeStart;
    });
  }, [activities, timeRangeStart]);

  // KPI metrics
  const summaryMetrics = useMemo(() => {
    const isManager = userRole === 'Manager';
    return [
      {
        title: isManager ? 'Employés (mes depts)' : 'Nombre d\'employés',
        value: totalEmployees.toString(),
        icon: <Users className="w-6 h-6" aria-hidden="true" />,
        color: 'bg-blue-500',
      },
      {
        title: isManager ? 'Mes départements' : 'Nombre de départements',
        value: departments.length.toString(),
        icon: <Target className="w-6 h-6" aria-hidden="true" />,
        color: 'bg-purple-500',
      },
      {
        title: isManager ? 'Activités (mes depts)' : 'Nombre d\'activités',
        value: filteredActivities.length.toString(),
        icon: <Calendar className="w-6 h-6" aria-hidden="true" />,
        color: 'bg-orange-500',
      },
      {
        title: 'Nombre de compétences',
        value: totalSkills.toString(),
        icon: <TrendingUp className="w-6 h-6" aria-hidden="true" />,
        color: 'bg-green-500',
      },
    ];
  }, [totalEmployees, departments, filteredActivities, totalSkills, userRole]);

  // Charts — come directly from backend aggregation
  const employeesByDepartment = empByDeptData;
  const roleDistribution      = roleDistData;

  // Données pour le graphique en secteurs "Activités par statut"
  const activityStatusData = useMemo(() => {
    const counts = filteredActivities.reduce((acc, activity) => {
      const status = activity.status || 'Inconnu';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [filteredActivities]);

  // Données pour le graphique "Top compétences requises"
  const topRequiredSkills = useMemo(() => {
    const counts = new Map<string, number>();
    filteredActivities.forEach((activity) => {
      activity.requiredSkills?.forEach((required) => {
        const skillName =
          required.skillId && typeof required.skillId === 'object'
            ? required.skillId.name || 'Autre'
            : required.skillId || 'Autre';
        counts.set(skillName, (counts.get(skillName) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredActivities]);

  // Liste des 5 activités les plus récentes pour le tableau
  const recentActivities = useMemo(() => {
    return [...filteredActivities]
      .sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [filteredActivities]);

  // Affichage du skeleton de chargement
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded-3xl bg-card" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-40 rounded-3xl bg-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Affichage de l'erreur si échec du chargement
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-3xl bg-red-600 p-6 text-white">{error}</div>
      </div>
    );
  }

  // Rendu principal du dashboard
  return (
    <div className="p-6 space-y-6">
      {/* En-tête avec titre et sélecteur de période */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            {userRole === 'Manager'
              ? 'Vue analytique de vos départements — employés, activités et compétences.'
              : 'Vue d\'ensemble globale — employés, activités, départements et compétences.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="analytics-timerange" className="text-sm font-medium text-foreground">Période</label>
          <select
            id="analytics-timerange"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="1month">1 mois</option>
            <option value="3months">3 mois</option>
            <option value="6months">6 mois</option>
            <option value="1year">1 an</option>
          </select>
        </div>
      </div>

      {/* Grille des métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {summaryMetrics.map((metric) => (
          <div key={metric.title} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className={`${metric.color} rounded-2xl p-3 text-white`}>{metric.icon}</div>
              <span className="text-sm text-muted-foreground">
                {userRole === 'Manager' ? 'Mes depts' : 'Global'}
              </span>
            </div>
            <p className="mt-6 text-4xl font-semibold text-foreground">{metric.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{metric.title}</p>
          </div>
        ))}
      </div>

      {/* Première section de graphiques : Employés par département et Répartition des rôles */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Employés par département</h2>
              <p className="text-sm text-muted-foreground">
                {userRole === 'Manager' ? 'Distribution dans vos départements.' : 'Distribution des employés actifs par département.'}
              </p>
            </div>
          </div>
          <div className="mt-6 h-72">
            {employeesByDepartment.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeesByDepartment} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Répartition des rôles</h2>
          <p className="text-sm text-muted-foreground">Vue globale des profils utilisateur.</p>
          <div className="mt-6 h-72">
            {roleDistribution.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={roleDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis type="number" stroke="#6B7280" />
                  <YAxis type="category" dataKey="role" stroke="#6B7280" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0EA5E9" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Deuxième section de graphiques : Statut des activités et Top compétences */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Activités par statut</h2>
          <p className="text-sm text-muted-foreground">Statut des activités existantes.</p>
          <div className="mt-6 h-72">
            {activityStatusData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <RechartsPie
                    data={activityStatusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {activityStatusData.map((_entry, index) => (
                      <Cell key={`status-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </RechartsPie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Top compétences requises</h2>
          <p className="text-sm text-muted-foreground">Compétences les plus demandées par les activités.</p>
          <div className="mt-6 h-72">
            {topRequiredSkills.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRequiredSkills} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#14B8A6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tableau des activités récentes */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Suivi détaillé des activités</h2>
            <p className="text-sm text-muted-foreground">Dernières activités créées et leur statut.</p>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium text-foreground">Titre</th>
                <th className="px-4 py-3 font-medium text-foreground">Statut</th>
                <th className="px-4 py-3 font-medium text-foreground">Date de début</th>
                <th className="px-4 py-3 font-medium text-foreground">Compétences requises</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentActivities.map((activity) => (
                <tr key={activity._id} className="hover:bg-secondary/50">
                  <td className="px-4 py-3 text-foreground">{activity.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{activity.status || 'Inconnu'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateLabel(activity.startDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{activity.requiredSkills?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
