import React from "react";
import { Heart, MapPin, DollarSign, Calendar as CalendarIcon, Clock } from "lucide-react";
import type { EventWithStatus } from "../../types";
import { useUserStore } from "../../store/userStore";
import { getEventStatusColor } from "../../utils/eventStatus";

type Props = {
  selectedDate: Date | null;
  events: EventWithStatus[];
  onEventView?: (event: EventWithStatus) => void;
  onCreateEvent?: (date: Date) => void;
};

/**
 * Sidebar showing events for the selected date in the calendar
 */
export default function EventSidebar({ selectedDate, events, onEventView, onCreateEvent }: Props) {
  const { user, addInterest, removeInterest, isInterested } = useUserStore();

  const handleFavoriteToggle = (e: React.MouseEvent, event: EventWithStatus) => {
    e.stopPropagation();
    if (!user || event.status === 'finished') return;
    if (isInterested(event.id)) {
      removeInterest(event.id);
    } else {
      addInterest(event.id);
    }
  };

  return (
    <aside className="space-y-6" aria-label="Eventos del día seleccionado">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 h-full">
        <header className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {selectedDate ? (
              selectedDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })
            ) : (
              'Eventos del día'
            )}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedDate 
              ? `${events.length} eventos programados`
              : 'Selecciona una fecha para ver detalles'
            }
          </p>
        </header>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {selectedDate ? (
            events.length > 0 ? (
              events.map((event: EventWithStatus) => {
                const isEventInterested = user ? isInterested(event.id) : false;
                const statusConfig = getEventStatusColor(event.status);
                const eventTime = new Date(event.event_date).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <article 
                    key={event.id} 
                    className="group relative bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={() => onEventView?.(event)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                      {user && event.status !== 'finished' && (
                        <button
                          onClick={(e) => handleFavoriteToggle(e, event)}
                          className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:scale-110 transition-all"
                        >
                          <Heart className={`h-3.5 w-3.5 ${isEventInterested ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                        </button>
                      )}
                    </div>

                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {event.name}
                    </h4>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {eventTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {event.price > 0 ? `Bs ${event.price}` : 'Gratis'}
                      </span>
                    </div>

                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800/50 p-2 rounded-lg">
                      <MapPin className="h-3 w-3 mr-1.5 text-gray-400" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </article>
                );
              })
            ) : (
              <EmptyDateState selectedDate={selectedDate} onCreateEvent={onCreateEvent} />
            )
          ) : (
            <SelectDatePrompt />
          )}
        </div>
      </div>
    </aside>
  );
}

function EmptyDateState({ selectedDate, onCreateEvent }: { selectedDate: Date; onCreateEvent?: (date: Date) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <CalendarIcon className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-gray-900 dark:text-white font-medium mb-1">Sin eventos</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No hay actividades programadas para este día.</p>
      {onCreateEvent && (
        <button
          onClick={() => onCreateEvent(selectedDate)}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Programar un evento
        </button>
      )}
    </div>
  );
}

function SelectDatePrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center h-full">
      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
        <CalendarIcon className="h-8 w-8 text-blue-500" />
      </div>
      <p className="text-gray-900 dark:text-white font-medium">Selecciona una fecha</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Haz clic en cualquier día del calendario para ver los eventos disponibles.
      </p>
    </div>
  );
}
