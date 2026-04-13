import { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, Trash2, Filter } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: 'Recommendation' | 'Activity' | 'Skill' | 'System';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'info',
    title: 'New Recommendation Available',
    message: '5 employees have been recommended for "Advanced React Patterns" activity',
    timestamp: '2026-02-08T10:30:00',
    read: false,
    category: 'Recommendation',
  },
  {
    id: '2',
    type: 'success',
    title: 'Activity Completed',
    message: 'Sarah Johnson completed "Cloud Migration Training" with excellent results',
    timestamp: '2026-02-08T09:15:00',
    read: false,
    category: 'Activity',
  },
  {
    id: '3',
    type: 'warning',
    title: 'Skill Gap Identified',
    message: 'Critical skill gap detected in Engineering department for AWS expertise',
    timestamp: '2026-02-07T16:45:00',
    read: true,
    category: 'Skill',
  },
  {
    id: '4',
    type: 'info',
    title: 'New Employee Added',
    message: 'Michael Chen has been added to the system',
    timestamp: '2026-02-07T14:20:00',
    read: true,
    category: 'System',
  },
  {
    id: '5',
    type: 'alert',
    title: 'Activity Deadline Approaching',
    message: 'Leadership Development Program enrollment closes in 2 days',
    timestamp: '2026-02-07T11:00:00',
    read: true,
    category: 'Activity',
  },
  {
    id: '6',
    type: 'success',
    title: 'Skill Updated',
    message: 'Emily Rodriguez improved React skill level to Expert',
    timestamp: '2026-02-06T15:30:00',
    read: true,
    category: 'Skill',
  },
];

export function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const categories = ['All', 'Recommendation', 'Activity', 'Skill', 'System'];

  const filteredNotifications = notifications.filter((notif) => {
    const matchesReadFilter = filter === 'all' || !notif.read;
    const matchesCategoryFilter = categoryFilter === 'All' || notif.category === categoryFilter;
    return matchesReadFilter && matchesCategoryFilter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'alert':
        return 'bg-red-100';
      case 'info':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <CheckCircle className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'unread'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2 md:ml-auto">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-card rounded-lg shadow-sm p-12 border border-border text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications to display</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-card rounded-lg shadow-sm p-6 border transition-all ${
                notification.read ? 'border-border' : 'border-primary/30 shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`${getNotificationBg(notification.type)} p-3 rounded-lg flex-shrink-0`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{notification.title}</h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors ml-2"
                      aria-label={`Supprimer la notification : ${notification.title}`}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                    <span className="text-xs px-2 py-1 bg-secondary rounded-full text-foreground">
                      {notification.category}
                    </span>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        Mark as read
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
