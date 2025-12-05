import { MapPin, Trash2, Info } from "lucide-react";
import type { ItineraryItem } from "../../types";

type Props = {
  items: ItineraryItem[];
  onRemoveItem: (itemId: number) => void;
  onViewDetails: (item: ItineraryItem) => void;
};

export default function ItineraryTimeline({ items, onRemoveItem, onViewDetails }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No hay items en este itinerario</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {items.map((item, index) => {
        const isPlace = item.place_id !== null;
        const itemData = isPlace ? item.place : item.event;
        const itemType = isPlace ? 'Lugar' : 'Evento';
        const isLast = index === items.length - 1;
        
        if (!itemData) return null;

        return (
          <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0 group">
            {/* Timeline Line and Dot */}
            <div className="relative flex flex-col items-center flex-shrink-0">
              {/* Time Badge */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-3 rounded-xl shadow-lg flex flex-col items-center justify-center min-w-[90px] w-[90px] z-10 relative overflow-hidden">
                <span className="text-xs font-medium text-white/90">Paso {index + 1}</span>
                <span className="text-base font-bold mt-1 text-white">{item.start_time}</span>
                <span className="text-xs text-white/75">a</span>
                <span className="text-base font-bold text-white">{item.end_time}</span>
              </div>
              
              {/* Timeline Connector */}
              {!isLast && (
                <div className="w-0.5 flex-1 mt-2 bg-gradient-to-b from-blue-400 to-blue-200 dark:from-blue-600 dark:to-gray-700 min-h-[20px]"></div>
              )}
            </div>

            {/* Content Card */}
            <article className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        isPlace 
                          ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' 
                          : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                      }`}>
                        {itemType}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {itemData.category}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {itemData.name}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <MapPin className="h-4 w-4 text-primary-500" />
                      <span>{itemData.location}</span>
                    </div>

                    {isPlace && item.place && (
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-700/50 inline-block px-3 py-1 rounded-lg">
                        Costo: Bs. {(item.place.price ?? 0).toFixed(2)}
                      </div>
                    )}

                    {!isPlace && item.event && (
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-700/50 inline-block px-3 py-1 rounded-lg">
                        Costo: Bs. {(item.event.price ?? 0).toFixed(2)}
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 italic border-l-2 border-primary-200 dark:border-primary-800 pl-3 py-1">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onViewDetails(item)}
                      className="p-2.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-colors"
                      aria-label="Ver detalles"
                      title="Ver detalles"
                    >
                      <Info className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                      aria-label="Eliminar del itinerario"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}
