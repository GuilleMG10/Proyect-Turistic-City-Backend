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

export default function EventCard({ event, onInterest, onView, showTag = false }: Props) {
  const { user, addInterest, removeInterest, isInterested } = useUserStore();
  
  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  const formattedTime = eventDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isEventInterested = user ? isInterested(event.id) : false;

  const handleFavoriteToggle = () => {
    if (!user) return;
    
    if (isEventInterested) {
      removeInterest(event.id);
    } else {
      addInterest(event.id);
    }
  };

  const statusConfig = getEventStatusColor(event.status);

  // If showing as tag (for calendar view), render compact version
  if (showTag) {
    return (
      <div 
        className={`${statusConfig.bg} ${statusConfig.text} px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={() => onView?.(event)}
        title={`${event.description} - ${statusConfig.label}`}
      >
        {event.name}
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm border">
      {/* Header with date and status */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <div>
              <p className="font-semibold">{formattedDate}</p>
              <p className="text-sm opacity-90">{formattedTime}</p>
            </div>
          </div>
          {user && (
            <button
              onClick={handleFavoriteToggle}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <Heart className={`h-5 w-5 ${isEventInterested ? 'fill-red-400 text-red-400' : 'text-white'}`} />
            </button>
          )}
        </div>
        
        {/* Status tag */}
        <div className="flex justify-end">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} bg-opacity-90`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title + Rating */}
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg leading-tight line-clamp-1">{event.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{event.location}</span>
            </p>
          </div>
          {event.reviews && event.reviews.length > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <Star className="h-5 w-5 fill-amber-500" />
              <span className="font-medium">
                {(event.reviews.reduce((sum, r) => sum + r.rating, 0) / event.reviews.length).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-700 line-clamp-2">{event.description}</p>

        {/* Event details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <BadgeDollarSign className="h-3.5 w-3.5" />
            <span>Bs {event.price}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <Users className="h-3.5 w-3.5" />
            <span>Todas las edades</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" />
            <span>{event.category}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex gap-3">
          {event.status !== 'finished' && (
            <button
              className="flex-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => onInterest?.(event)}
            >
              Me interesa
            </button>
          )}
          <button
            className={`${event.status === 'finished' ? 'flex-1' : 'flex-1'} rounded-md bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black`}
            onClick={() => onView?.(event)}
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  );
}