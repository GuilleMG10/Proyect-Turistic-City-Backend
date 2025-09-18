import { MapPin, Star, Clock, BadgeDollarSign, Users, Calendar } from "lucide-react";
import { useState } from "react";
import type { Event } from "../types";

type Props = {
  event: Event;
  onInterest?: (e: Event) => void;
  onView?: (e: Event) => void;
};

export default function EventCard({ event, onInterest, onView }: Props) {
  const [imageError, setImageError] = useState(false);
  
  const ages =
    event.min_age == null && event.max_age == null
      ? "Todas las edades"
      : `${event.min_age ?? 0}+${event.max_age ? ` hasta ${event.max_age}` : ""}`;

  const price =
    event.price_min == null && event.price_max == null
      ? "Gratis / Consultar"
      : event.price_max && event.price_min && event.price_max !== event.price_min
      ? `Bs ${event.price_min} – ${event.price_max}`
      : `Bs ${event.price_min ?? event.price_max}`;

  // Smart image URL selection based on event category
  const getUnsplashImageUrl = () => {
    const category = event.category.toLowerCase();
    
    switch (category) {
      case 'cultura':
        return 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&h=800&fit=crop';
      case 'gastronomía':
        return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop';
      case 'entretenimiento':
        return 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=800&fit=crop';
      case 'música':
        return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop';
      case 'festival':
        return 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&h=800&fit=crop';
      default:
        return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop';
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm border">
      {/* imagen */}
      <div className="aspect-[16/10] w-full bg-gray-100 relative">
        <img
          src={imageError ? getUnsplashImageUrl() : (event.image_url && event.image_url.includes('unsplash.com') ? event.image_url : getUnsplashImageUrl())}
          alt={event.name}
          className="h-full w-full object-cover"
          onError={handleImageError}
        />
        {/* Event date badge */}
        <div className="absolute top-3 left-3 bg-white rounded-lg px-2 py-1 shadow-lg">
          <div className="text-xs font-semibold text-gray-900">
            {formatDate(event.event_date)}
          </div>
        </div>
      </div>

      {/* contenido */}
      <div className="p-4 space-y-3">
        {/* título + rating */}
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg leading-tight line-clamp-1">{event.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{event.venue || event.city || "Cochabamba"}</span>
            </p>
          </div>
          {event.rating != null && (
            <div className="flex items-center gap-1 text-amber-600">
              <Star className="h-5 w-5 fill-amber-500" />
              <span className="font-medium">{event.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-700 line-clamp-2">{event.description}</p>

        {/* barras/etiquetas como en el wireframe */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTime(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <BadgeDollarSign className="h-3.5 w-3.5" />
            <span>{price}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <Users className="h-3.5 w-3.5" />
            <span>{ages}</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" />
            <span>{event.category}</span>
          </div>
        </div>

        {/* botones inferiores */}
        <div className="pt-2 flex gap-3">
          <button
            className="flex-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => onInterest?.(event)}
          >
            Me interesa
          </button>
          <button
            className="flex-1 rounded-md bg-purple-600 text-white px-3 py-2 text-sm hover:bg-purple-700"
            onClick={() => onView?.(event)}
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  );
}