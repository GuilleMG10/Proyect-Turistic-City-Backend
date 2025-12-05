import { MapPin, ExternalLink, Star } from 'lucide-react';
import type { Place } from '../../../types';

type Props = {
  place: Place;
  onViewDetails?: () => void;
};

export default function PlacePopup({ place, onViewDetails }: Props) {
  return (
    <div className="min-w-[260px] max-w-[280px] p-4">
      {/* Header with gradient */}
      <div className="relative h-24 bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden mb-3 -mx-4 -mt-4">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 opacity-90" />
        <div className="absolute bottom-2 left-4 right-4">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-white/20 text-white backdrop-blur-sm border border-white/10">
            {place.category}
          </span>
        </div>
        {place.display_number && (
          <div className="absolute top-2 right-2 w-8 h-8 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold shadow-lg text-sm">
            {place.display_number}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-base leading-tight text-gray-900 dark:text-gray-100 mb-1">
        {place.name}
      </h3>
      
      {/* Location */}
      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-2">
        <MapPin className="h-3 w-3 flex-shrink-0" />
        <span className="text-xs truncate">{place.location}</span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed">
        {place.description}
      </p>
      
      {/* Rating and status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">4.5</span>
        </div>
        {place.active && (
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
            Abierto ahora
          </span>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={onViewDetails}
        className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-black dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        Ver detalles
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}
