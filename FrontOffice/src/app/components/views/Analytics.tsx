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

// Interface pour les données utilisateur depuis l'API
interface AnalyticsUser {
  _id: string;
  role: string;
  departmentId?: { name?: string } | string | null;
  createdAt?: string; // Date de création pour le filtrage
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

// Interface pour les compétences
interface AnalyticsSkill {
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
  // États pour stocker les données chargées depuis l'API
  const [users, setUsers] = useState<AnalyticsUser[]>([]);
  const [activities, setActivities] = useState<AnalyticsActivity[]>([]);
  const [departments, setDepartments] = useState<AnalyticsDepartment[]>([]);
  const [skills, setSkills] = useState<AnalyticsSkill[]>([]);
  const [loading, setLoading] = useState(true); // Indicateur de chargement
  const [error, setError] = useState<string | null>(null); // Message d'erreur
  const [timeRange, setTimeRange] = useState('6months'); // Période sélectionnée pour le filtrage

  // Chargement des données au montage du composant
  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        // Récupération parallèle des données depuis l'API
        const [usersRes, activitiesRes, departmentsRes, skillsRes] = await Promise.all([
          API.get<AnalyticsUser[]>('/users'),
          API.get<AnalyticsActivity[]>('/activities'),
          API.get<AnalyticsDepartment[]>('/departments'),
          API.get<AnalyticsSkill[]>('/skills'),
        ]);

        // Mise à jour des états avec les données reçues
        setUsers(usersRes.data || []);
        setActivities(activitiesRes.data || []);
        setDepartments(departmentsRes.data || []);
        setSkills(skillsRes.data || []);
      } catch (err) {
        console.error('Analytics load failed', err);
        setError('Impossible de charger les données analytics.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  // Calcul de la date de début selon la période sélectionnée
  const timeRangeStart = useMemo(() => getTimeRangeStart(timeRange), [timeRange]);

  // Filtrage des utilisateurs selon la période (basé sur createdAt)
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!user.createdAt) return true; // Inclure si pas de date
      const date = new Date(user.createdAt);
      return !isNaN(date.getTime()) && date >= timeRangeStart;
    });
  }, [users, timeRangeStart]);

  // Filtrage des activités selon la période (basé sur createdAt ou startDate)
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const dateString = activity.createdAt || activity.startDate;
      if (!dateString) return true;
      const date = new Date(dateString);
      return !isNaN(date.getTime()) && date >= timeRangeStart;
    });
  }, [activities, timeRangeStart]);

  // Métriques principales du dashboard
  const summaryMetrics = useMemo(() => {
    const employeeCount = filteredUsers.filter((user) => user.role === 'EMPLOYEE').length;
    const departmentCount = departments.length; // Départements non filtrés par période
    const activityCount = filteredActivities.length;
    const skillCount = skills.length; // Compétences non filtrées par période

    return [
      {
        title: 'Nombre d\'employés',
        value: employeeCount.toString(),
        icon: <Users className="w-6 h-6" aria-hidden="true" />,
        color: 'bg-blue-500',
      },
      {
        title: 'Nombre de départements',
        value: departmentCount.toString(),
        icon: <Target className="w-6 h-6" aria-hidden="true" />,
        color: 'bg-purple-500',
      },
      {
        title: 'Nombre d\'activités',
        value: activityCount.toString(),
        icon: <Calendar className="w-6 h-6" aria-hidden="true" />,
        color: 'bg-orange-500',
      },
      {
        title: 'Nombre de compétences',
        value: skillCount.toString(),
        icon: <TrendingUp className="w-6 h-6" aria-hidden="true" />,
        color: 'bg-green-500',
      },
    ];
  }, [filteredUsers, departments, filteredActivities, skills]);

  // Données pour le graphique "Employés par département"
  const employeesByDepartment = useMemo(() => {
    const counts = new Map<string, number>();
    filteredUsers
      .filter((user) => user.role === 'EMPLOYEE')
      .forEach((user) => {
        const departmentName =
          typeof user.departmentId === 'object' && user.departmentId !== null
            ? user.departmentId.name || 'Inconnu'
            : 'Inconnu';
        counts.set(departmentName, (counts.get(departmentName) || 0) + 1);
      });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredUsers]);

  // Données pour le graphique "Répartition des rôles"
  const roleDistribution = useMemo(() => {
    const counts = filteredUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([role, count]) => ({ role, count }));
  }, [filteredUsers]);

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
          <p className="text-muted-foreground mt-2">Vue d\'ensemble dynamique des employés, activités et compétences pour le rôle {userRole}.</p>
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
              <span className="text-sm text-muted-foreground">Dernier mois</span>
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
              <p className="text-sm text-muted-foreground">Distribution des employés actifs par département.</p>
            </div>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeesByDepartment} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Répartition des rôles</h2>
          <p className="text-sm text-muted-foreground">Vue globale des profils utilisateur.</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={roleDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis type="number" stroke="#6B7280" />
                <YAxis type="category" dataKey="role" stroke="#6B7280" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#0EA5E9" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Deuxième section de graphiques : Statut des activités et Top compétences */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Activités par statut</h2>
          <p className="text-sm text-muted-foreground">Statut des activités existantes.</p>
          <div className="mt-6 h-72">
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
                  {activityStatusData.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsPie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Top compétences requises</h2>
          <p className="text-sm text-muted-foreground">Compétences les plus demandées par les activités.</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRequiredSkills} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Bar dataKey="count" fill="#14B8A6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
