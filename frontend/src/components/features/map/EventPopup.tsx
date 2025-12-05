import { MapPin, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import type { Event } from '../../../types';

type Props = {
  event: Event;
  onViewDetails?: () => void;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function EventPopup({ event, onViewDetails }: Props) {
  return (
    <div className="min-w-[260px] max-w-[280px] p-4">
      {/* Header with gradient */}
      <div className="relative h-24 bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden mb-3 -mx-4 -mt-4">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-90" />
        <div className="absolute bottom-2 left-4 right-4">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-white/20 text-white backdrop-blur-sm border border-white/10">
            {event.category}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-base leading-tight text-gray-900 dark:text-gray-100 mb-1">
        {event.name}
      </h3>
      
      {/* Location */}
      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-3">
        <MapPin className="h-3 w-3 flex-shrink-0" />
        <span className="text-xs truncate">{event.location}</span>
      </div>

      {/* Date and price info */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-1.5 rounded-md border border-gray-100 dark:border-gray-600">
          <Calendar className="h-3 w-3 text-purple-500 dark:text-purple-400" />
          <span className="truncate">{formatDate(event.event_date)}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-1.5 rounded-md border border-gray-100 dark:border-gray-600">
          <DollarSign className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
          <span className="font-medium">{event.price === 0 ? 'Gratis' : `${event.price} Bs`}</span>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={onViewDetails}
        className="w-full py-2 bg-gray-900 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        Ver detalles
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}
