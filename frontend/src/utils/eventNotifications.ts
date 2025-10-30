import type { EventWithStatus } from '../types';

export type NotificationType = '24h' | '5h' | '1h' | '10min' | 'start' | '1h_after';

export interface EventNotification {
  id: string;
  eventId: number;
  eventName: string;
  eventDate: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
}

const NOTIFICATION_STORAGE_KEY = 'event-notifications';
const MUTED_EVENTS_KEY = 'muted-event-notifications';
const SHOWN_NOTIFICATIONS_KEY = 'shown-notifications';

// Get time until event in milliseconds
function getTimeUntilEvent(eventDate: string): number {
  return new Date(eventDate).getTime() - Date.now();
}

// Check if a notification should be shown
function shouldShowNotification(
  event: EventWithStatus,
  type: NotificationType,
  shownNotifications: Set<string>
): boolean {
  const timeUntil = getTimeUntilEvent(event.event_date);
  const notificationId = `${event.id}-${type}`;
  
  // Don't show if already shown
  if (shownNotifications.has(notificationId)) {
    return false;
  }
  
  const ONE_HOUR = 60 * 60 * 1000;
  const TEN_MINUTES = 10 * 60 * 1000;
  
  switch (type) {
    case '24h':
      // Show between 24h and 23h before
      return timeUntil <= 24 * ONE_HOUR && timeUntil > 23 * ONE_HOUR;
    case '5h':
      // Show between 5h and 4h before
      return timeUntil <= 5 * ONE_HOUR && timeUntil > 4 * ONE_HOUR;
    case '1h':
      // Show between 1h and 50min before
      return timeUntil <= ONE_HOUR && timeUntil > 50 * 60 * 1000;
    case '10min':
      // Show between 10min and 5min before
      return timeUntil <= TEN_MINUTES && timeUntil > 5 * 60 * 1000;
    case 'start':
      // Show when event starts (within 2 minutes window)
      return timeUntil <= 2 * 60 * 1000 && timeUntil >= -2 * 60 * 1000;
    case '1h_after':
      // Show 1 hour after event started
      return timeUntil <= -ONE_HOUR && timeUntil > -(ONE_HOUR + 5 * 60 * 1000);
    default:
      return false;
  }
}

// Generate notification message
function getNotificationMessage(type: NotificationType, eventName: string, eventDate: string): string {
  const date = new Date(eventDate);
  const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
  
  switch (type) {
    case '24h':
      return `"${eventName}" comienza en 24 horas - ${dateStr} a las ${timeStr}`;
    case '5h':
      return `"${eventName}" comienza en 5 horas - Hoy a las ${timeStr}`;
    case '1h':
      return `"${eventName}" comienza en 1 hora - Hoy a las ${timeStr}`;
    case '10min':
      return `"${eventName}" comienza en 10 minutos - ${timeStr}`;
    case 'start':
      return `"${eventName}" está comenzando ahora - ${timeStr}`;
    case '1h_after':
      return `"${eventName}" comenzó hace 1 hora - ¿Cómo estuvo?`;
    default:
      return `Recordatorio de evento: "${eventName}"`;
  }
}

// Get all notifications from localStorage
export function getStoredNotifications(): EventNotification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save notifications to localStorage
function saveNotifications(notifications: EventNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Failed to save notifications:', error);
  }
}

// Get muted events
export function getMutedEvents(): Set<number> {
  try {
    const stored = localStorage.getItem(MUTED_EVENTS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

// Save muted events
export function muteEvent(eventId: number): void {
  try {
    const muted = getMutedEvents();
    muted.add(eventId);
    localStorage.setItem(MUTED_EVENTS_KEY, JSON.stringify([...muted]));
  } catch (error) {
    console.error('Failed to mute event:', error);
  }
}

// Get shown notifications
function getShownNotifications(): Set<string> {
  try {
    const stored = localStorage.getItem(SHOWN_NOTIFICATIONS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

// Mark notification as shown
function markNotificationShown(notificationId: string): void {
  try {
    const shown = getShownNotifications();
    shown.add(notificationId);
    localStorage.setItem(SHOWN_NOTIFICATIONS_KEY, JSON.stringify([...shown]));
  } catch (error) {
    console.error('Failed to mark notification shown:', error);
  }
}

// Check events and generate notifications
export function checkAndGenerateNotifications(events: EventWithStatus[]): EventNotification[] {
  const mutedEvents = getMutedEvents();
  const shownNotifications = getShownNotifications();
  const newNotifications: EventNotification[] = [];
  const notificationTypes: NotificationType[] = ['24h', '5h', '1h', '10min', 'start', '1h_after'];
  
  // Filter only upcoming and happening events that aren't muted
  const relevantEvents = events.filter(
    event => (event.status === 'upcoming' || event.status === 'happening') && !mutedEvents.has(event.id)
  );
  
  for (const event of relevantEvents) {
    for (const type of notificationTypes) {
      if (shouldShowNotification(event, type, shownNotifications)) {
        const notificationId = `${event.id}-${type}`;
        const notification: EventNotification = {
          id: notificationId,
          eventId: event.id,
          eventName: event.name,
          eventDate: event.event_date,
          type,
          message: getNotificationMessage(type, event.name, event.event_date),
          timestamp: Date.now(),
          read: false,
        };
        
        newNotifications.push(notification);
        markNotificationShown(notificationId);
      }
    }
  }
  
  // Add to existing notifications
  if (newNotifications.length > 0) {
    const existingNotifications = getStoredNotifications();
    const updatedNotifications = [...newNotifications, ...existingNotifications];
    saveNotifications(updatedNotifications);
  }
  
  return newNotifications;
}

// Mark notification as read
export function markNotificationRead(notificationId: string): void {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  saveNotifications(updated);
}

// Mark all notifications as read
export function markAllNotificationsRead(): void {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
}

// Delete notification
export function deleteNotification(notificationId: string): void {
  const notifications = getStoredNotifications();
  const updated = notifications.filter(n => n.id !== notificationId);
  saveNotifications(updated);
}

// Clear old notifications (older than 7 days)
export function clearOldNotifications(): void {
  const notifications = getStoredNotifications();
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const updated = notifications.filter(n => n.timestamp > sevenDaysAgo);
  saveNotifications(updated);
}

// Get unread notification count
export function getUnreadCount(): number {
  const notifications = getStoredNotifications();
  return notifications.filter(n => !n.read).length;
}
