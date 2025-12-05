import { memo, useCallback, useMemo } from "react";
import type { MouseEvent } from "react";
import { MapPin, Star, Clock, Heart } from "lucide-react";
import type { EventWithStatus, Review, UserInterest } from "../../types";
import { useUserStore } from "../../store/userStore";
import { getEventStatusColor } from "../../utils/eventStatus";

type Props = {
  event: EventWithStatus;
  onView?: (e: EventWithStatus) => void;
  showTag?: boolean; // Show tag for event type or show full details
};

const EventCard = memo(function EventCard({ event, onView, showTag = false }: Props) {
  const { user, addInterest, removeInterest, interests } = useUserStore();

  // Memoize expensive calculations
  const eventDate = useMemo(() => new Date(event.event_date), [event.event_date]);

  const formattedTime = useMemo(() => {
    return eventDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [eventDate]);

  const isEventInterested = useMemo(() => 
    user ? interests.some((i: UserInterest) => i.event_id === event.id) : false, 
    [user, interests, event.id]
  );

  const averageRating = useMemo(() => {
    return event.reviews && event.reviews.length > 0
      ? event.reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / event.reviews.length
      : null;
  }, [event.reviews]);

  // Memoize event handlers
  const handleFavoriteToggle = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    if (isEventInterested) {
      removeInterest(event.id);
    } else {
      addInterest(event.id);
    }
  }, [user, isEventInterested, addInterest, removeInterest, event.id]);

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
    <article 
      onClick={handleView}
      className="group relative flex flex-col h-full overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* Header with Status Badge and Favorite */}
      <div className="flex items-center justify-between p-4 pb-0">
        {/* Status Badge */}
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${statusConfig.bg} ${statusConfig.text}`}>
          {statusConfig.label}
        </span>

        {/* Favorite Button */}
        {user && (
           <button
             onClick={handleFavoriteToggle}
             className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full shadow-sm transition-all hover:scale-110 active:scale-95 border border-gray-200 dark:border-gray-600"
             title={isEventInterested ? "Quitar de favoritos" : "Me interesa"}
           >
             <Heart className={`h-4 w-4 transition-colors ${isEventInterested ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
           </button>
        )}
      </div>

      <div className="p-5 flex flex-col h-full">
        {/* Header: Date */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600/50 group-hover:scale-110 transition-transform">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                {eventDate.toLocaleString('es-ES', { month: 'short' }).slice(0, 3)}
              </span>
              <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                {eventDate.getDate()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {eventDate.toLocaleString('es-ES', { weekday: 'long' })}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Title & Location */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {event.name}
          </h3>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 flex-grow">
          {event.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
             {event.category}
           </span>
           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
             Bs {event.price}
           </span>
           {averageRating && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
              <Star className="h-3 w-3 mr-1 fill-current" />
              {averageRating.toFixed(1)}
            </span>
           )}
        </div>
      </div>
    </article>
  );
});

EventCard.displayName = 'EventCard';

export default EventCard;