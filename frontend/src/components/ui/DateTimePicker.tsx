import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from 'lucide-react';

type Props = {
  value: string; // ISO datetime string or datetime-local format
  onChange: (datetime: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
};

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Hours for the clock face (12-hour format display)
const CLOCK_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
// Minutes in 5-minute intervals
const CLOCK_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function DateTimePicker({ 
  value, 
  onChange, 
  minDate, 
  maxDate,
  placeholder = 'Seleccionar fecha y hora',
  label,
  required
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');
  const [clockMode, setClockMode] = useState<'hours' | 'minutes'>('hours');
  const [isPM, setIsPM] = useState(false);
  
  // Parse value into date and time parts
  const parseValue = (val: string) => {
    if (!val) return { date: '', hours: 12, minutes: 0 };
    
    // Handle both ISO and datetime-local formats
    const dateObj = new Date(val.includes('T') ? val : val + 'T00:00:00');
    if (isNaN(dateObj.getTime())) return { date: '', hours: 12, minutes: 0 };
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return {
      date: `${year}-${month}-${day}`,
      hours: dateObj.getHours(),
      minutes: dateObj.getMinutes()
    };
  };
  
  const { date: selectedDate, hours: selectedHours, minutes: selectedMinutes } = parseValue(value);
  
  // Track previous values for sync state updates
  const [prevValue, setPrevValue] = useState(value);
  const [prevActiveTab, setPrevActiveTab] = useState(activeTab);
  const [viewDateOverride, setViewDateOverride] = useState<Date | null>(null);
  
  // Sync isPM when value changes
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const { hours } = parseValue(value);
      setIsPM(hours >= 12);
    }
    setViewDateOverride(null); // Reset override when value changes
  }
  
  // Reset clock mode when switching to time tab
  if (activeTab === 'time' && prevActiveTab !== 'time') {
    setClockMode('hours');
    setPrevActiveTab('time');
  } else if (activeTab !== prevActiveTab) {
    setPrevActiveTab(activeTab);
  }
  
  // Compute viewDate: use override if set, otherwise derive from selectedDate
  const viewDate = useMemo(() => {
    if (viewDateOverride) return viewDateOverride;
    if (selectedDate) return new Date(selectedDate + 'T00:00:00');
    return new Date();
  }, [viewDateOverride, selectedDate]);
  
  const setViewDate = (date: Date) => setViewDateOverride(date);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = formatDateToISO(date);
    
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate + 'T00:00:00');
    return (
      day === selected.getDate() &&
      viewDate.getMonth() === selected.getMonth() &&
      viewDate.getFullYear() === selected.getFullYear()
    );
  };

  const formatDateToISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (hours: number, minutes: number) => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const updateDateTime = (newDate: string, newHours: number, newMinutes: number) => {
    onChange(`${newDate}T${formatTime(newHours, newMinutes)}`);
  };

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(day)) return;
    
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = formatDateToISO(newDate);
    
    updateDateTime(dateStr, selectedHours || 12, selectedMinutes || 0);
    setActiveTab('time');
  };

  const handleSelectHour = (hour: number) => {
    // Convert 12-hour to 24-hour format
    let hour24 = hour;
    if (isPM && hour !== 12) {
      hour24 = hour + 12;
    } else if (!isPM && hour === 12) {
      hour24 = 0;
    }
    
    const dateStr = selectedDate || formatDateToISO(new Date());
    updateDateTime(dateStr, hour24, selectedMinutes || 0);
    setClockMode('minutes');
  };

  const handleSelectMinute = (minute: number) => {
    const dateStr = selectedDate || formatDateToISO(new Date());
    updateDateTime(dateStr, selectedHours, minute);
    setIsOpen(false);
  };

  const handleToggleAMPM = (pm: boolean) => {
    setIsPM(pm);
    if (selectedDate) {
      let newHours = selectedHours;
      if (pm && selectedHours < 12) {
        newHours = selectedHours + 12;
      } else if (!pm && selectedHours >= 12) {
        newHours = selectedHours - 12;
      }
      updateDateTime(selectedDate, newHours, selectedMinutes);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setViewDate(newDate);
  };

  const formatDisplayDateTime = (val: string) => {
    if (!val) return '';
    const { date, hours, minutes } = parseValue(val);
    if (!date) return '';
    
    const dateObj = new Date(date + 'T00:00:00');
    const dateStr = dateObj.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    // Format time in 12-hour format
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const timeStr = `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
    
    return `${dateStr}, ${timeStr}`;
  };

  const clearDateTime = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Get current display hour in 12-hour format
  const displayHour = selectedHours % 12 || 12;

  // Calculate position for clock hands
  const getClockPosition = (val: number, total: number, radius: number = 85) => {
    const angle = (val / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: 100 + radius * Math.cos(angle),
      y: 100 + radius * Math.sin(angle)
    };
  };

  const days = getDaysInMonth(viewDate);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <Calendar className="h-4 w-4 inline mr-2 text-cyan-500" />
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border rounded-xl text-left flex items-center justify-between transition-all ${
          isOpen
            ? 'border-cyan-500 ring-2 ring-cyan-500/20 dark:ring-cyan-500/30'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } bg-white dark:bg-gray-800`}
      >
        <span className={value ? 'text-gray-900 dark:text-white capitalize' : 'text-gray-400 dark:text-gray-500'}>
          {value ? formatDisplayDateTime(value) : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={clearDateTime}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <Calendar className={`h-5 w-5 transition-colors ${isOpen ? 'text-cyan-500' : 'text-gray-400'}`} />
        </div>
      </button>

      {/* Calendar/Time dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab('date')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                activeTab === 'date'
                  ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Fecha
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('time')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                activeTab === 'time'
                  ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Hora
            </button>
          </div>

          {activeTab === 'date' ? (
            <>
              {/* Month/Year header */}
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => navigateMonth('prev')}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={() => navigateMonth('next')}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-0.5 px-2 py-1 border-b border-gray-100 dark:border-gray-700">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5 px-2 pb-2">
                {days.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day !== null && (
                      <button
                        type="button"
                        onClick={() => handleSelectDay(day)}
                        disabled={isDateDisabled(day)}
                        className={`w-full h-full rounded-md text-xs font-medium transition-all ${
                          isSelected(day)
                            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                            : isToday(day)
                            ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-300 dark:ring-cyan-700'
                            : isDateDisabled(day)
                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Time picker with clock face */
            <div className="p-4">
              {/* Time display header */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setClockMode('hours')}
                  className={`text-4xl font-light px-3 py-1 rounded-lg transition-all ${
                    clockMode === 'hours'
                      ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400'
                      : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {String(displayHour).padStart(2, '0')}
                </button>
                <span className="text-4xl font-light text-gray-400">:</span>
                <button
                  type="button"
                  onClick={() => setClockMode('minutes')}
                  className={`text-4xl font-light px-3 py-1 rounded-lg transition-all ${
                    clockMode === 'minutes'
                      ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400'
                      : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {String(selectedMinutes).padStart(2, '0')}
                </button>
                
                {/* AM/PM toggle */}
                <div className="flex flex-col ml-3 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleToggleAMPM(false)}
                    className={`px-2 py-1 text-xs font-semibold transition-all ${
                      !isPM
                        ? 'bg-cyan-600 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAMPM(true)}
                    className={`px-2 py-1 text-xs font-semibold transition-all ${
                      isPM
                        ? 'bg-cyan-600 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Clock face */}
              <div className="relative w-[200px] h-[200px] mx-auto">
                {/* Clock background */}
                <div className="absolute inset-0 rounded-full bg-gray-100 dark:bg-gray-700/50" />
                
                {/* Clock hand */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                  {clockMode === 'hours' ? (
                    <>
                      {/* Hour hand line */}
                      <line
                        x1="100"
                        y1="100"
                        x2={getClockPosition(displayHour % 12, 12).x}
                        y2={getClockPosition(displayHour % 12, 12).y}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-cyan-500"
                      />
                      {/* Center dot */}
                      <circle cx="100" cy="100" r="4" fill="currentColor" className="text-cyan-500" />
                      {/* Hour indicator dot */}
                      <circle
                        cx={getClockPosition(displayHour % 12, 12).x}
                        cy={getClockPosition(displayHour % 12, 12).y}
                        r="16"
                        fill="currentColor"
                        className="text-cyan-500"
                      />
                    </>
                  ) : (
                    <>
                      {/* Minute hand line */}
                      <line
                        x1="100"
                        y1="100"
                        x2={getClockPosition(selectedMinutes, 60).x}
                        y2={getClockPosition(selectedMinutes, 60).y}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-cyan-500"
                      />
                      {/* Center dot */}
                      <circle cx="100" cy="100" r="4" fill="currentColor" className="text-cyan-500" />
                      {/* Minute indicator dot */}
                      <circle
                        cx={getClockPosition(selectedMinutes, 60).x}
                        cy={getClockPosition(selectedMinutes, 60).y}
                        r="16"
                        fill="currentColor"
                        className="text-cyan-500"
                      />
                    </>
                  )}
                </svg>

                {/* Clock numbers */}
                {clockMode === 'hours' ? (
                  // Hour numbers
                  CLOCK_HOURS.map((hour, index) => {
                    const pos = getClockPosition(index, 12);
                    const isSelectedHour = displayHour === hour;
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => handleSelectHour(hour)}
                        className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          isSelectedHour
                            ? 'text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        style={{ left: pos.x, top: pos.y }}
                      >
                        {hour}
                      </button>
                    );
                  })
                ) : (
                  // Minute numbers (show every 5 minutes)
                  CLOCK_MINUTES.map((minute, index) => {
                    const pos = getClockPosition(index, 12);
                    const isSelectedMinute = selectedMinutes === minute;
                    return (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => handleSelectMinute(minute)}
                        className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          isSelectedMinute
                            ? 'text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        style={{ left: pos.x, top: pos.y }}
                      >
                        {String(minute).padStart(2, '0')}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const dateStr = formatDateToISO(now);
                updateDateTime(dateStr, now.getHours(), Math.floor(now.getMinutes() / 5) * 5);
                setViewDate(now);
                setIsPM(now.getHours() >= 12);
              }}
              className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              Ahora
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-700 rounded-lg transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
