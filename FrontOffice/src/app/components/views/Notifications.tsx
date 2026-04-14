import { useEffect, useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, Trash2, Filter } from 'lucide-react';
import API from '../../../api/api';

interface Notification {
  _id: string;
  type: 'success' | 'warning' | 'info' | 'alert';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  category: 'Recommendation' | 'Activity' | 'System';
  link?: string;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const categories = ['All', 'Recommendation', 'Activity', 'System'];

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data || []);
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const filteredNotifications = notifications.filter((n) => {
    const matchesRead = filter === 'all' || !n.read;
    const matchesCat = categoryFilter === 'All' || n.category === categoryFilter;
    return matchesRead && matchesCat;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    await API.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    await API.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    await API.delete(`/notifications/${id}`);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'alert':   return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100';
      case 'warning': return 'bg-yellow-100';
      case 'alert':   return 'bg-red-100';
      default:        return 'bg-blue-100';
    }
  };

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days > 0)  return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (mins > 0)  return `il y a ${mins} min`;
    return "à l'instant";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes les notifications sont lues'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="flex items-center gap-2 text-primary hover:underline">
            <CheckCircle className="w-4 h-4" /> Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            {(['all', 'unread'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}>
                {f === 'all' ? 'Toutes' : `Non lues (${unreadCount})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 md:ml-auto">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100 border border-slate-200" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-card rounded-lg shadow-sm p-12 border border-border text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground">
              {notifications.length === 0
                ? 'Aucune notification pour le moment'
                : 'Aucune notification dans cette catégorie'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {notifications.length === 0
                ? 'Les notifications apparaîtront ici lors des événements importants.'
                : 'Essayez un autre filtre.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(n => (
            <div key={n._id}
              className={`bg-card rounded-lg shadow-sm p-5 border transition-all ${n.read ? 'border-border' : 'border-primary/30 shadow-md'}`}>
              <div className="flex items-start gap-4">
                <div className={`${getBg(n.type)} p-3 rounded-lg flex-shrink-0`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{n.title}</h3>
                      {!n.read && <span className="w-2 h-2 bg-primary rounded-full" />}
                    </div>
                    <button onClick={() => deleteNotification(n._id)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors ml-2"
                      aria-label="Supprimer">
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{n.message}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{formatTime(n.createdAt)}</span>
                    <span className="text-xs px-2 py-1 bg-secondary rounded-full text-foreground">{n.category}</span>
                    {!n.read && (
                      <button onClick={() => markAsRead(n._id)} className="text-xs text-primary hover:underline">
                        Marquer comme lu
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
