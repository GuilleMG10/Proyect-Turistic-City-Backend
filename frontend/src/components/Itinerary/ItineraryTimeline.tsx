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
          <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Timeline Line and Dot */}
            <div className="relative flex flex-col items-center">
              {/* Time Badge */}
              <div className="bg-gradient-to-br from-cyan-600 to-blue-600 dark:from-cyan-700 dark:to-blue-700 text-white p-3 rounded-lg shadow-lg flex flex-col items-center justify-center min-w-[100px] z-10">
                <span className="text-xs font-medium opacity-90">Paso {index + 1}</span>
                <span className="text-base font-bold mt-1">{item.start_time}</span>
                <span className="text-xs opacity-75">a</span>
                <span className="text-base font-bold">{item.end_time}</span>
              </div>
              
              {/* Timeline Connector */}
              {!isLast && (
                <div className="absolute top-[120px] left-1/2 -translate-x-1/2 flex flex-col items-center">
                  {/* Vertical Line */}
                  <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-400 to-blue-400 dark:from-cyan-500 dark:to-blue-600"></div>
                  {/* Connection Dot */}
                  <div className="w-3 h-3 rounded-full bg-cyan-500 dark:bg-cyan-600 border-2 border-white dark:border-gray-800 shadow-md"></div>
                  {/* Vertical Line continues */}
                  <div className="w-0.5 h-full bg-gradient-to-b from-blue-400 to-cyan-300 dark:from-blue-600 dark:to-cyan-700"></div>
                </div>
              )}
            </div>

            {/* Content Card */}
            <article className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isPlace 
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' 
                          : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                      }`}>
                        {itemType}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {itemData.category}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {itemData.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{itemData.location}</span>
                    </div>

                    {isPlace && item.place && (
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Costo: Bs. {item.place.price.toFixed(2)}
                      </div>
                    )}

                    {!isPlace && item.event && (
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Costo: Bs. {item.event.price.toFixed(2)}
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onViewDetails(item)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      aria-label="Ver detalles"
                      title="Ver detalles"
                    >
                      <Info className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
