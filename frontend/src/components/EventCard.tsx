import { memo, useCallback, useMemo } from "react";
import { Calendar, MapPin, Star, Clock, BadgeDollarSign, Users, Heart } from "lucide-react";
import type { EventWithStatus } from "../types";
import { useUserStore } from "../store/userStore";
import { getEventStatusColor } from "../utils/eventStatus";

type Props = {
  event: EventWithStatus;
  onInterest?: (e: EventWithStatus) => void;
  onView?: (e: EventWithStatus) => void;
  showTag?: boolean; // Show tag for event type or show full details
};

const EventCard = memo(function EventCard({ event, onInterest, onView, showTag = false }: Props) {
  const { user, addInterest, removeInterest, interests } = useUserStore();

  // Memoize expensive calculations
  const eventDate = useMemo(() => new Date(event.event_date), [event.event_date]);

  const formattedDate = useMemo(() => {
    return eventDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, [eventDate]);

  const formattedTime = useMemo(() => {
    return eventDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [eventDate]);

  const isEventInterested = useMemo(() => 
    user ? interests.some(i => i.event_id === event.id) : false, 
    [user, interests, event.id]
  );

  const averageRating = useMemo(() => {
    return event.reviews && event.reviews.length > 0
      ? event.reviews.reduce((sum, r) => sum + r.rating, 0) / event.reviews.length
      : null;
  }, [event.reviews]);

  // Memoize event handlers
  const handleFavoriteToggle = useCallback(() => {
    if (!user) return;

    if (isEventInterested) {
      removeInterest(event.id);
    } else {
      addInterest(event.id);
    }
  }, [user, isEventInterested, addInterest, removeInterest, event.id]);

  const handleInterest = useCallback(() => {
    onInterest?.(event);
  }, [onInterest, event]);

  const handleView = useCallback(() => {
    onView?.(event);
  }, [onView, event]);

  const statusConfig = getEventStatusColor(event.status);

  // If showing as tag (for calendar view), render compact version
  if (showTag) {
    return (
      <div 
        className={`${statusConfig.bg} ${statusConfig.text} px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={handleView}
        title={`${event.description} - ${statusConfig.label}`}
      >
        {event.name}
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
      {/* Header with date and status */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" aria-hidden="true" />
            <div>
              <p className="font-semibold">{formattedDate}</p>
              <p className="text-sm opacity-90">{formattedTime}</p>
            </div>
          </div>
          {user && (
            <button
              onClick={handleFavoriteToggle}
              className="p-1 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label={isEventInterested ? `Quitar ${event.name} de favoritos` : `Agregar ${event.name} a favoritos`}
              aria-pressed={isEventInterested}
            >
              <Heart className={`h-5 w-5 ${isEventInterested ? 'fill-red-400 text-red-400' : 'text-white'}`} aria-hidden="true" />
            </button>
          )}
        </div>
        
        {/* Status tag */}
        <div className="flex justify-end">
          <mark className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} bg-opacity-90`}>
            {statusConfig.label}
          </mark>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title + Rating */}
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg leading-tight line-clamp-1 dark:text-white">{event.name}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <address className="line-clamp-1 not-italic">{event.location}</address>
            </div>
          </div>
          {averageRating && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500" aria-label={`Calificación: ${averageRating.toFixed(1)} de 5 estrellas`}>
              <Star className="h-5 w-5 fill-amber-500" aria-hidden="true" />
              <strong className="font-medium">
                {averageRating.toFixed(1)}
              </strong>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{event.description}</p>

        {/* Event details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <time dateTime={event.event_date}>{formattedTime}</time>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1">
            <BadgeDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
            <strong>Bs {event.price}</strong>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <small>Todas las edades</small>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1">
            <i className="h-2 w-2 rounded-full bg-purple-500 dark:bg-purple-400 inline-block" aria-hidden="true" />
            <em>{event.category}</em>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex gap-3">
          {user && event.status !== 'finished' && (
            <button
              className="flex-1 rounded-md border dark:border-gray-600 dark:text-gray-200 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleInterest}
              aria-label={`Mostrar interés en ${event.name}`}
            >
              Me interesa
            </button>
          )}
          <button
            className={`${(user && event.status !== 'finished') ? 'flex-1' : 'w-full'} rounded-md bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 text-sm hover:bg-black dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`}
            onClick={handleView}
            aria-label={`Ver detalles de ${event.name}`}
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  );
});

EventCard.displayName = 'EventCard';

export default EventCard;