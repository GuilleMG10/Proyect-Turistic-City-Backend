import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

type Props = {
  value: string; // HH:mm format (24-hour)
  onChange: (time: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
};

// Hours for the clock face (12-hour format display)
const CLOCK_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
// Minutes in 5-minute intervals
const CLOCK_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function TimePicker({ 
  value, 
  onChange, 
  label,
  required,
  placeholder = 'Seleccionar hora'
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [clockMode, setClockMode] = useState<'hours' | 'minutes'>('hours');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse time value
  const parseTime = (val: string) => {
    if (!val) return { hours: 9, minutes: 0 };
    const [h, m] = val.split(':').map(Number);
    return { hours: h || 0, minutes: m || 0 };
  };

  const { hours: selectedHours, minutes: selectedMinutes } = parseTime(value);
  const isPM = selectedHours >= 12;
  const displayHour = selectedHours % 12 || 12;

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

  // Reset clock mode when opening
  const handleOpen = () => {
    setClockMode('hours');
    setIsOpen(true);
  };

  const updateTime = (hours: number, minutes: number) => {
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    onChange(`${h}:${m}`);
  };

  const handleSelectHour = (hour12: number) => {
    // Convert to 24-hour format
    let hour24 = hour12;
    if (isPM && hour12 !== 12) {
      hour24 = hour12 + 12;
    } else if (!isPM && hour12 === 12) {
      hour24 = 0;
    }
    updateTime(hour24, selectedMinutes);
    setClockMode('minutes');
  };

  const handleSelectMinute = (minute: number) => {
    updateTime(selectedHours, minute);
    setIsOpen(false);
  };

  const handleToggleAMPM = (pm: boolean) => {
    let newHours = selectedHours;
    if (pm && selectedHours < 12) {
      newHours = selectedHours + 12;
    } else if (!pm && selectedHours >= 12) {
      newHours = selectedHours - 12;
    }
    updateTime(newHours, selectedMinutes);
  };

  // Format display time
  const formatDisplayTime = (val: string) => {
    if (!val) return '';
    const { hours, minutes } = parseTime(val);
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}  ${ampm}`;
  };

  // Calculate position for clock hands
  const getClockPosition = (val: number, total: number, radius: number = 85) => {
    const angle = (val / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: 100 + radius * Math.cos(angle),
      y: 100 + radius * Math.sin(angle)
    };
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <Clock className="h-4 w-4 inline mr-2 text-blue-500" />
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full px-4 py-3 border rounded-xl text-left flex items-center justify-between transition-all ${
          isOpen
            ? 'border-cyan-500 ring-2 ring-cyan-500/20 dark:ring-cyan-500/30'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } bg-white dark:bg-gray-700`}
      >
        <span className={value ? 'text-gray-900 dark:text-white font-medium tracking-wide' : 'text-gray-400 dark:text-gray-500'}>
          {value ? formatDisplayTime(value) : placeholder}
        </span>
        <Clock className={`h-5 w-5 transition-colors ${isOpen ? 'text-cyan-500' : 'text-gray-400'}`} />
      </button>

      {/* Clock dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[260px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                updateTime(now.getHours(), Math.floor(now.getMinutes() / 5) * 5);
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
