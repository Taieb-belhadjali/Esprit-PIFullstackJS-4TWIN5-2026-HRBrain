import { useEffect, useMemo, useState } from 'react';
import { Users, Brain, Activity, Target, TrendingUp, Building2, CheckCircle } from 'lucide-react';
import {
  BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAppTranslation } from '../../hooks/useAppTranslation';
import API from '../../../api/api';

type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';

interface HomeProps {
  userRole: UserRole;
}

const STATUS_COLORS: Record<string, string> = {
  active:    '#10B981',
  inactive:  '#6B7280',
  completed: '#3B82F6',
  pending:   '#F59E0B',
  cancelled: '#EF4444',
};
const DEPT_COLOR = '#1E3A8A';

const renderPieLabel = ({ name, percent }: any) =>
  `${name} ${(percent * 100).toFixed(0)}%`;

export function Home({ userRole }: HomeProps) {
  const t = useAppTranslation();

  const [loading,        setLoading]        = useState(true);
  const [employeeCount,  setEmployeeCount]  = useState(0);
  const [deptCount,      setDeptCount]      = useState(0);
  const [activityCount,  setActivityCount]  = useState(0);
  const [skillCount,     setSkillCount]     = useState(0);
  const [empByDept,      setEmpByDept]      = useState<{ department: string; count: number }[]>([]);
  const [actByStatus,    setActByStatus]    = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentActs,     setRecentActs]     = useState<{ _id: string; title: string; status?: string; startDate?: string }[]>([]);

  // ── Employee-specific ────────────────────────────────────────────────────────
  const [approvedCount,  setApprovedCount]  = useState(0);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        if (userRole === 'Employee') {
          const meRes = await API.get('/users/me');
          const uid = String(meRes.data?._id ?? meRes.data?.id ?? '');
          if (uid) {
            const approvedRes = await API.get(`/recommendations/employee/${uid}/approved`);
            const approved = Array.isArray(approvedRes.data) ? approvedRes.data : [];
            setApprovedCount(approved.length);
            setRecentActs(approved.slice(0, 5));
            setActivityCount(approved.length);
          }
          return;
        }

        if (userRole === 'Manager') {
          const [deptRes, actStatsRes, userStatsRes] = await Promise.all([
            API.get('/departments/my'),
            API.get('/activities/stats'),
            API.get('/users/analytics-stats'),
          ]);

          const myDepts: any[] = Array.isArray(deptRes.data) ? deptRes.data : [];
          const actStats = actStatsRes.data as { total: number; statusDistribution: { status: string; count: number }[]; recent: any[] };
          const userStats = userStatsRes.data as { employeeCount: number; empByDept: { department: string; count: number }[] };

          setDeptCount(myDepts.length);
          setEmployeeCount(userStats.employeeCount ?? 0);
          setActivityCount(actStats.total ?? 0);
          setEmpByDept(Array.isArray(userStats.empByDept) ? userStats.empByDept : []);
          setActByStatus((actStats.statusDistribution ?? []).map((s) => ({
            name: s.status, value: s.count, color: STATUS_COLORS[s.status] ?? '#9333EA',
          })));
          setRecentActs(Array.isArray(actStats.recent) ? actStats.recent : []);
          return;
        }

        // HR / SUPERADMIN — global view (fast endpoints)
        const [statsRes, actStatsRes, deptRes, skillCountRes] = await Promise.all([
          API.get('/users/analytics-stats'),
          API.get('/activities/stats'),
          API.get('/departments'),
          API.get('/skills/count'),
        ]);

        const depts: any[] = Array.isArray(deptRes.data) ? deptRes.data : [];
        const actStats = actStatsRes.data as { total: number; statusDistribution: { status: string; count: number }[]; recent: any[] };

        setEmployeeCount(statsRes.data?.employeeCount ?? 0);
        setDeptCount(depts.length);
        setActivityCount(actStats.total ?? 0);
        setSkillCount(skillCountRes.data?.count ?? 0);
        setEmpByDept(Array.isArray(statsRes.data?.empByDept) ? statsRes.data.empByDept : []);
        setActByStatus((actStats.statusDistribution ?? []).map((s) => ({
          name: s.status, value: s.count, color: STATUS_COLORS[s.status] ?? '#9333EA',
        })));
        setRecentActs(Array.isArray(actStats.recent) ? actStats.recent : []);
      } catch (err) {
        console.error('Home load failed', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userRole]);

  const metrics = useMemo(() => {
    if (userRole === 'Employee') {
      return [
        { titleKey: 'Activités approuvées', value: String(approvedCount), icon: <CheckCircle className="w-6 h-6" />, color: 'bg-green-500' },
        { titleKey: 'Activités totales',     value: String(activityCount), icon: <Activity className="w-6 h-6" />,     color: 'bg-blue-500' },
      ];
    }
    if (userRole === 'Manager') {
      return [
        { titleKey: 'Employés (mes depts)', value: String(employeeCount), icon: <Users className="w-6 h-6" />,     color: 'bg-blue-500' },
        { titleKey: 'Mes départements',     value: String(deptCount),     icon: <Building2 className="w-6 h-6" />, color: 'bg-purple-500' },
        { titleKey: 'Mes activités',        value: String(activityCount), icon: <Activity className="w-6 h-6" />,  color: 'bg-green-500' },
      ];
    }
    // HR / SUPERADMIN
    return [
      { titleKey: t('totalEmployees'),          value: String(employeeCount), icon: <Users className="w-6 h-6" />,    color: 'bg-blue-500' },
      { titleKey: t('departmentsCount' as any) || 'Départements', value: String(deptCount), icon: <Building2 className="w-6 h-6" />, color: 'bg-purple-500' },
      { titleKey: t('ongoingActivities'),       value: String(activityCount), icon: <Activity className="w-6 h-6" />, color: 'bg-green-500' },
      { titleKey: 'Compétences',                value: String(skillCount),    icon: <Brain className="w-6 h-6" />,    color: 'bg-orange-500' },
    ];
  }, [userRole, employeeCount, deptCount, activityCount, skillCount, approvedCount, t]);

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-10 bg-secondary rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-secondary rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-secondary rounded-lg" />
          <div className="h-72 bg-secondary rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2 text-foreground">{t('dashboard')}</h1>
        <p className="text-muted-foreground">
          {userRole === 'Manager'
            ? 'Vue de vos départements — données en temps réel.'
            : userRole === 'Employee'
            ? 'Bienvenue ! Retrouvez ici vos activités et recommandations.'
            : 'Vue d\'ensemble globale de votre organisation — données en temps réel.'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${metrics.length === 4 ? 'lg:grid-cols-4' : metrics.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        {metrics.map((metric, index) => (
          <div key={index} className="bg-card rounded-lg shadow-sm p-6 border border-border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`${metric.color} text-white p-3 rounded-lg`} aria-hidden="true">
                {metric.icon}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" aria-hidden="true" />
                <span className="text-green-600 text-xs">Temps réel</span>
              </div>
            </div>
            <h3 className="text-2xl font-semibold mb-1 text-foreground">{metric.value}</h3>
            <p className="text-sm text-muted-foreground">{metric.titleKey}</p>
          </div>
        ))}
      </div>

      {/* Charts — not shown for Employee */}
      {userRole !== 'Employee' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employees per department */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h2 className="text-xl mb-4 text-foreground">
              {userRole === 'Manager' ? 'Employés par département (mes depts)' : 'Employés par département'}
            </h2>
            {empByDept.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={empByDept}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="department" stroke="#6B7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6B7280" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill={DEPT_COLOR} radius={[8, 8, 0, 0]} name="Employés" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Activities by status */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h2 className="text-xl mb-4 text-foreground">
              {userRole === 'Manager' ? 'Mes activités par statut' : 'Activités par statut'}
            </h2>
            {actByStatus.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={actByStatus} cx="50%" cy="50%" labelLine={false} label={renderPieLabel}
                    outerRadius={100} dataKey="value">
                    {actByStatus.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Recent activities table */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl text-foreground">
            {userRole === 'Employee' ? 'Mes activités approuvées' : 'Activités récentes'}
          </h2>
          <Target className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
        </div>
        {recentActs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Aucune activité à afficher.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Titre</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Date de début</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentActs.map((act) => (
                  <tr key={act._id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{act.title}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${STATUS_COLORS[act.status ?? ''] ?? '#9333EA'}20`, color: STATUS_COLORS[act.status ?? ''] ?? '#9333EA' }}>
                        {act.status ?? 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate((act as any).startDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
