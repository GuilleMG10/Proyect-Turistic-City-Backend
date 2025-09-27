import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Heart } from "lucide-react";
import type { EventWithStatus } from "../types";
import { useUserStore } from "../store/userStore";

type Props = {
  events: EventWithStatus[];
  onEventView?: (event: EventWithStatus) => void;
  onCreateEvent?: (date: Date) => void;
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Calendar({ events, onEventView, onCreateEvent }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Move useUserStore to component level - NEVER inside loops/conditionals/functions
  const { user, addInterest, removeInterest, isInterested } = useUserStore();

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const eventDate = new Date(event.event_date);
    const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, EventWithStatus[]>);

  const getEventsForDate = (day: number) => {
    const dateKey = `${currentYear}-${currentMonth}-${day}`;
    return eventsByDate[dateKey] || [];
  };

  const isToday = (day: number) => {
    return today.getDate() === day &&
           today.getMonth() === currentMonth &&
           today.getFullYear() === currentYear;
  };

  const isSelected = (day: number) => {
    return selectedDate &&
           selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentMonth &&
           selectedDate.getFullYear() === currentYear;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(clickedDate);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate.getDate()) : [];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          {MONTHS[currentMonth]} {currentYear}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
          >
            Hoy
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 bg-gray-50">
              {DAYS.map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayEvents = day ? getEventsForDate(day) : [];
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      day ? 'bg-white' : 'bg-gray-25'
                    } ${isSelected(day || 0) ? 'bg-blue-50 border-blue-200' : ''}`}
                    onClick={() => day && handleDateClick(day)}
                  >
                    {day && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${
                            isToday(day) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''
                          }`}>
                            {day}
                          </span>
                          {onCreateEvent && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCreateEvent(new Date(currentYear, currentMonth, day));
                              }}
                              className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        {/* Event tags */}
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={`bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs cursor-pointer hover:bg-blue-200 transition-colors ${
                                selectedDate && selectedDate.getDate() === day ? 'ring-2 ring-blue-300' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDateClick(day);
                              }}
                              title={`${event.description} - Click para ver detalles`}
                            >
                              {event.name}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayEvents.length - 3} más
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Events */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {selectedDate ? (
              `Eventos - ${selectedDate.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}`
            ) : (
              'Selecciona una fecha'
            )}
          </h3>

          {selectedDate ? (
            selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => {
                  const isEventInterested = user ? isInterested(event.id) : false;

                  const handleFavoriteToggle = () => {
                    if (!user || event.status === 'finished') return;
                    
                    if (isEventInterested) {
                      removeInterest(event.id);
                    } else {
                      addInterest(event.id);
                    }
                  };

                  return (
                    <div key={event.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{event.name}</h4>
                        <div className="flex items-center gap-2">
                          {user && event.status !== 'finished' && (
                            <button
                              onClick={handleFavoriteToggle}
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <Heart className={`h-4 w-4 ${isEventInterested ? 'fill-red-400 text-red-400' : 'text-gray-400'}`} />
                            </button>
                          )}
                          <span className={`px-2 py-1 rounded text-xs ${
                            event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            event.status === 'happening' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {event.status === 'upcoming' ? 'Próximo' :
                             event.status === 'happening' ? 'En vivo' : 'Terminado'}
                          </span>
                        </div>
                      </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                    <p className="text-xs text-gray-500 mb-3">
                      📍 {event.location} • 💰 Bs {event.price}
                    </p>
                      <button
                        onClick={() => onEventView?.(event)}
                        className="w-full bg-gray-900 text-white text-xs py-2 px-3 rounded hover:bg-black transition-colors"
                      >
                        Ver detalles completos
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No hay eventos este día</p>
                {onCreateEvent && (
                  <button
                    onClick={() => onCreateEvent(selectedDate)}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    ¿Quieres crear uno?
                  </button>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Haz clic en una fecha para ver los eventos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}