import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

type Props = {
  value: string;
  onChange: (date: string) => void;
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

export default function DatePicker({ 
  value, 
  onChange, 
  minDate, 
  maxDate,
  placeholder = 'Seleccionar fecha',
  label,
  required
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDateOverride, setViewDateOverride] = useState<Date | null>(null);
  const [prevValue, setPrevValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state update when value changes externally
  if (value !== prevValue) {
    setPrevValue(value);
    setViewDateOverride(null); // Reset override when value changes
  }

  // Compute viewDate: use override if set, otherwise derive from value
  const viewDate = useMemo(() => {
    if (viewDateOverride) return viewDateOverride;
    if (value) return new Date(value + 'T00:00:00');
    return new Date();
  }, [viewDateOverride, value]);

  const setViewDate = (date: Date) => setViewDateOverride(date);

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
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add the days of the month
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
    if (!value) return false;
    const selectedDate = new Date(value + 'T00:00:00');
    return (
      day === selectedDate.getDate() &&
      viewDate.getMonth() === selectedDate.getMonth() &&
      viewDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const formatDateToISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(day)) return;
    
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(formatDateToISO(newDate));
    setIsOpen(false);
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

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const days = getDaysInMonth(viewDate);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <Calendar className="h-4 w-4 inline mr-2 text-blue-500" />
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
            ? 'border-blue-500 ring-2 ring-blue-500/20 dark:ring-blue-500/30'
            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
        } bg-white dark:bg-slate-700`}
      >
        <span className={value ? 'text-slate-900 dark:text-white capitalize' : 'text-slate-400 dark:text-slate-500'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={clearDate}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
          <Calendar className={`h-5 w-5 transition-colors ${isOpen ? 'text-blue-500' : 'text-slate-400'}`} />
        </div>
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[300px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Month/Year header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </button>
            <span className="font-semibold text-slate-900 dark:text-white">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 p-3">
            {days.map((day, index) => (
              <div key={index} className="aspect-square">
                {day !== null && (
                  <button
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    disabled={isDateDisabled(day)}
                    className={`w-full h-full rounded-lg text-sm font-medium transition-all ${
                      isSelected(day)
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : isToday(day)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-700'
                        : isDateDisabled(day)
                        ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex items-center justify-between p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                onChange(formatDateToISO(today));
                setViewDate(today);
                setIsOpen(false);
              }}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
