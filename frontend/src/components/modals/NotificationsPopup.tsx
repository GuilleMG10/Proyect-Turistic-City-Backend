import { useState, useEffect } from 'react';
import { X, Bell, BellOff, Trash2, Calendar, Clock } from 'lucide-react';
import {
  getStoredNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  muteEvent,
  getUnreadCount,
} from '../../utils/eventNotifications';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function NotificationsPopup({ isOpen, onClose }: Props) {
  // Load notifications directly when component renders
  const notifications = isOpen 
    ? getStoredNotifications().sort((a, b) => b.timestamp - a.timestamp)
    : [];
  const unreadCount = isOpen ? getUnreadCount() : 0;
  const [, setRefresh] = useState(0);

  // Force re-render when notifications change
  const loadNotifications = () => {
    setRefresh(prev => prev + 1);
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleMarkRead = (notificationId: string) => {
    markNotificationRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    loadNotifications();
  };

  const handleDelete = (notificationId: string) => {
    deleteNotification(notificationId);
    loadNotifications();
  };

  const handleMuteEvent = (eventId: number, eventName: string) => {
    if (confirm(`¿Dejar de notificar sobre "${eventName}"?`)) {
      muteEvent(eventId);
      // Refresh to show updated notifications
      loadNotifications();
    }
  };

  const getNotificationTypeLabel = (type: string): string => {
    switch (type) {
      case '24h': return 'En 24 horas';
      case '5h': return 'En 5 horas';
      case '1h': return 'En 1 hora';
      case '10min': return 'En 10 minutos';
      case 'start': return '¡Comienza ahora!';
      case '1h_after': return 'Hace 1 hora';
      default: return 'Notificación';
    }
  };

  const getNotificationTypeColor = (type: string): string => {
    switch (type) {
      case '24h': return 'bg-blue-100 text-blue-800';
      case '5h': return 'bg-yellow-100 text-yellow-800';
      case '1h': return 'bg-orange-100 text-orange-800';
      case '10min': return 'bg-red-100 text-red-800';
      case 'start': return 'bg-green-100 text-green-800';
      case '1h_after': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[80] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
      >
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 id="notifications-title" className="text-xl font-bold text-white">Notificaciones</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-blue-100 font-medium">{unreadCount} sin leer</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white transition-colors relative z-10"
            aria-label="Cerrar notificaciones"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Actions Bar */}
        {notifications.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              {notifications.length} {notifications.length === 1 ? 'notificación' : 'notificaciones'}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg px-3 py-1.5 font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/30">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No hay notificaciones</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
                Te notificaremos sobre eventos próximos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`border rounded-xl p-4 transition-all duration-200 ${
                    notification.read 
                      ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm' 
                      : 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Type Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getNotificationTypeColor(notification.type)}`}>
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                        {!notification.read && (
                          <span className="w-2.5 h-2.5 bg-primary-600 rounded-full animate-pulse" aria-label="Sin leer"></span>
                        )}
                      </div>

                      {/* Message */}
                      <p className="text-sm text-slate-900 dark:text-slate-100 mb-3 font-medium leading-relaxed">
                        {notification.message}
                      </p>

                      {/* Event Details */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg inline-flex">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary-500" />
                          {new Date(notification.eventDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary-500" />
                          {new Date(notification.eventDate).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                          aria-label="Marcar como leída"
                          title="Marcar como leída"
                        >
                          <Bell className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleMuteEvent(notification.eventId, notification.eventName)}
                        className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                        aria-label="Dejar de notificar"
                        title="Dejar de notificar"
                      >
                        <BellOff className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        aria-label="Eliminar notificación"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
