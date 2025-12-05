import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import type { EventWithStatus } from "../../types";
import { getEventStatusColor } from "../../utils/eventStatus";

type Props = {
  currentDate: Date;
  selectedDate: Date | null;
  events: EventWithStatus[];
  onDateClick: (date: Date) => void;
  onMonthChange: (direction: 'prev' | 'next') => void;
  onTodayClick: () => void;
  onCreateEvent?: (date: Date) => void;
  onDateChange?: (date: Date) => void;
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Calendar grid component with month navigation and event indicators
 */
export default function CalendarGrid({ 
  currentDate, 
  selectedDate, 
  events, 
  onDateClick, 
  onMonthChange, 
  onCreateEvent,
  onDateChange
}: Props) {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());
  const pickerRef = useRef<HTMLDivElement>(null);
  
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update picker year when currentDate changes
  useEffect(() => {
    setPickerYear(currentDate.getFullYear());
  }, [currentDate]);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(pickerYear, monthIndex, 1);
    if (onDateChange) {
      onDateChange(newDate);
    }
    setShowMonthPicker(false);
  };

  const handlePickerYearChange = (direction: 'prev' | 'next') => {
    setPickerYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Create calendar grid
  const calendarDays: (number | null)[] = [];

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

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    onDateClick(clickedDate);
  };

  return (
    <section className="lg:col-span-2" aria-label="Calendario mensual">
      {/* Calendar Header */}
      <header className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6">
        <div className="flex items-center gap-3 relative" ref={pickerRef}>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <button
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white capitalize hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {MONTHS[currentMonth]} <span className="text-gray-400 font-normal">{currentYear}</span>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Month/Year Picker Dropdown */}
          {showMonthPicker && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 p-4 min-w-[280px]">
              {/* Year Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => handlePickerYearChange('prev')}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{pickerYear}</span>
                <button
                  onClick={() => handlePickerYearChange('next')}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              {/* Months Grid */}
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((month, index) => {
                  const isCurrentMonth = index === currentMonth && pickerYear === currentYear;
                  const isTodayMonth = index === today.getMonth() && pickerYear === today.getFullYear();
                  return (
                    <button
                      key={month}
                      onClick={() => handleMonthSelect(index)}
                      className={`
                        px-3 py-2 text-sm font-medium rounded-lg transition-all
                        ${isCurrentMonth 
                          ? 'bg-blue-600 text-white' 
                          : isTodayMonth
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {month.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              
              {/* Quick actions */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                <button
                  onClick={() => {
                    setPickerYear(today.getFullYear());
                    handleMonthSelect(today.getMonth());
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  Hoy
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Monthly event count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl">
            <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {(() => {
                const monthEvents = events.filter(event => {
                  const eventDate = new Date(event.event_date);
                  return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
                });
                return `${monthEvents.length} evento${monthEvents.length !== 1 ? 's' : ''}`;
              })()}
            </span>
          </div>
          <button
            onClick={() => onMonthChange('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => onMonthChange('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Days of week header */}
        <header className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
          {DAYS.map(day => (
            <div key={day} className="py-2 md:py-4 text-center text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
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
                  min-h-[100px] md:min-h-[140px] p-2 md:p-3 border-r border-b border-gray-100 dark:border-gray-700/50 transition-all duration-200
                  ${!day ? 'bg-gray-50/30 dark:bg-gray-900/30' : 'bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'}
                  ${isSelectedDay ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/30 dark:bg-blue-900/10 z-10' : ''}
                `}
                onClick={() => day && handleDateClick(day)}
              >
                {day && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <time className={`
                        text-xs md:text-sm font-bold w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full transition-all
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
  );
}
