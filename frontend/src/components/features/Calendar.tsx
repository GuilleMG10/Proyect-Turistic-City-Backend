import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Heart, MapPin, DollarSign, Calendar as CalendarIcon, Clock } from "lucide-react";
import type { EventWithStatus } from "../../types";
import { useUserStore } from "../../store/userStore";
import { getEventStatusColor } from "../../utils/eventStatus";

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
    <section className="space-y-6">
      {/* Calendar Header */}
      <header className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {MONTHS[currentMonth]} <span className="text-gray-400 font-normal">{currentYear}</span>
          </h2>
        </div>
        
        <nav className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-1 rounded-xl" aria-label="Navegación de calendario">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 transition-all shadow-sm hover:shadow"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all shadow-sm hover:shadow"
          >
            Hoy
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 transition-all shadow-sm hover:shadow"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </nav>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <section className="lg:col-span-2" aria-label="Calendario mensual">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Days of week header */}
            <header className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
              {DAYS.map(day => (
                <div key={day} className="py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {day}
                </div>
              ))}
            </header>

            {/* Calendar days */}
            <div className="grid grid-cols-7 bg-gray-50/50 dark:bg-gray-900/50">
              {calendarDays.map((day, index) => {
                const dayEvents = day ? getEventsForDate(day) : [];
                const isCurrentDay = day ? isToday(day) : false;
                const isSelectedDay = day ? isSelected(day) : false;

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[140px] p-3 border-r border-b border-gray-100 dark:border-gray-700/50 transition-all duration-200
                      ${!day ? 'bg-gray-50/30 dark:bg-gray-900/30' : 'bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'}
                      ${isSelectedDay ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/30 dark:bg-blue-900/10 z-10' : ''}
                    `}
                    onClick={() => day && handleDateClick(day)}
                  >
                    {day && (
                      <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <time className={`
                            text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all
                            ${isCurrentDay 
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none' 
                              : isSelectedDay 
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                : 'text-gray-700 dark:text-gray-300'}
                          `}>
                            {day}
                          </time>
                          {onCreateEvent && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCreateEvent(new Date(currentYear, currentMonth, day));
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Event tags */}
                        <div className="space-y-1.5 flex-grow">
                          {/* Desktop: Show event names */}
                          <div className="hidden md:flex flex-col gap-1.5">
                            {dayEvents.slice(0, 3).map((event: EventWithStatus) => {
                              const statusColor = getEventStatusColor(event.status);
                              return (
                                <div
                                  key={event.id}
                                  className={`
                                    px-2 py-1.5 rounded-lg text-[10px] font-medium truncate transition-all border
                                    ${statusColor.bg} ${statusColor.text} border-transparent hover:border-current/20
                                  `}
                                  title={`${event.name} - ${event.description}`}
                                >
                                  {event.name}
                                </div>
                              );
                            })}
                            {dayEvents.length > 3 && (
                              <div className="text-[10px] font-medium text-gray-400 text-center py-1">
                                +{dayEvents.length - 3} más
                              </div>
                            )}
                          </div>
                          
                          {/* Mobile: Show dots */}
                          <div className="md:hidden flex justify-center gap-1 mt-auto">
                            {dayEvents.slice(0, 3).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Selected Date Events Sidebar */}
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
                  ? `${selectedDateEvents.length} eventos programados`
                  : 'Selecciona una fecha para ver detalles'
                }
              </p>
            </header>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedDate ? (
                selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((event: EventWithStatus) => {
                    const isEventInterested = user ? isInterested(event.id) : false;
                    const statusConfig = getEventStatusColor(event.status);
                    const eventTime = new Date(event.event_date).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    const handleFavoriteToggle = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (!user || event.status === 'finished') return;
                      if (isEventInterested) {
                        removeInterest(event.id);
                      } else {
                        addInterest(event.id);
                      }
                    };

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
                              onClick={handleFavoriteToggle}
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
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <CalendarIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">Selecciona una fecha</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Haz clic en cualquier día del calendario para ver los eventos disponibles.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}