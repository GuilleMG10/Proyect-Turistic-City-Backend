import { useState, useEffect } from 'react';
import { X, Bell, BellOff, Trash2, Calendar, Clock } from 'lucide-react';
import {
  getStoredNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  muteEvent,
  getUnreadCount,
} from '../utils/eventNotifications';

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
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
      >
        {/* Header */}
        <header className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <div>
              <h2 id="notifications-title" className="text-xl font-semibold">Notificaciones de Eventos</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">{unreadCount} sin leer</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar notificaciones"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Actions Bar */}
        {notifications.length > 0 && (
          <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {notifications.length} {notifications.length === 1 ? 'notificación' : 'notificaciones'}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay notificaciones</p>
              <p className="text-gray-400 text-sm mt-2">
                Te notificaremos sobre eventos próximos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Type Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNotificationTypeColor(notification.type)}`}>
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full" aria-label="Sin leer"></span>
                        )}
                      </div>

                      {/* Message */}
                      <p className="text-sm text-gray-900 mb-3">
                        {notification.message}
                      </p>

                      {/* Event Details */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(notification.eventDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.eventDate).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <p className="text-xs text-gray-400">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="p-1 hover:bg-gray-100 rounded text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Marcar como leída"
                          title="Marcar como leída"
                        >
                          <Bell className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleMuteEvent(notification.eventId, notification.eventName)}
                        className="p-1 hover:bg-gray-100 rounded text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        aria-label="Dejar de notificar"
                        title="Dejar de notificar"
                      >
                        <BellOff className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-1 hover:bg-gray-100 rounded text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
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
