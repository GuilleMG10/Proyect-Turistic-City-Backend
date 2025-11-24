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
            <div className="relative flex flex-col items-center">
              {/* Time Badge */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white p-3 rounded-xl shadow-lg shadow-primary-900/20 flex flex-col items-center justify-center min-w-[100px] z-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="text-xs font-medium opacity-90 relative z-10">Paso {index + 1}</span>
                <span className="text-base font-bold mt-1 relative z-10">{item.start_time}</span>
                <span className="text-xs opacity-75 relative z-10">a</span>
                <span className="text-base font-bold relative z-10">{item.end_time}</span>
              </div>
              
              {/* Timeline Connector */}
              {!isLast && (
                <div className="absolute top-[120px] left-1/2 -translate-x-1/2 flex flex-col items-center h-[calc(100%-100px)]">
                  {/* Vertical Line */}
                  <div className="w-0.5 h-full bg-gradient-to-b from-primary-400 to-primary-200 dark:from-primary-600 dark:to-slate-700"></div>
                </div>
              )}
            </div>

            {/* Content Card */}
            <article className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300">
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
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {itemData.category}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {itemData.name}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 mb-3">
                      <MapPin className="h-4 w-4 text-primary-500" />
                      <span>{itemData.location}</span>
                    </div>

                    {isPlace && item.place && (
                      <div className="text-sm text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-700/50 inline-block px-3 py-1 rounded-lg">
                        Costo: Bs. {item.place.price.toFixed(2)}
                      </div>
                    )}

                    {!isPlace && item.event && (
                      <div className="text-sm text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-700/50 inline-block px-3 py-1 rounded-lg">
                        Costo: Bs. {item.event.price.toFixed(2)}
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 italic border-l-2 border-primary-200 dark:border-primary-800 pl-3 py-1">
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
