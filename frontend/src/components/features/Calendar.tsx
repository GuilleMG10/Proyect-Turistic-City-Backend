import { useState } from "react";
import type { EventWithStatus } from "../../types";
import CalendarGrid from "./CalendarGrid";
import EventSidebar from "./EventSidebar";

type Props = {
  events: EventWithStatus[];
  onEventView?: (event: EventWithStatus) => void;
  onCreateEvent?: (date: Date) => void;
};

/**
 * Calendar component with monthly grid view and event sidebar
 * Composed of CalendarGrid and EventSidebar sub-components
 */
export default function Calendar({ events, onEventView, onCreateEvent }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    setSelectedDate(null);
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  // Get events for the selected date
  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate();
    });
  };

  return (
    <section className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-8">
        <CalendarGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          events={events}
          onDateClick={setSelectedDate}
          onMonthChange={navigateMonth}
          onTodayClick={handleTodayClick}
          onCreateEvent={onCreateEvent}
          onDateChange={handleDateChange}
        />

        <EventSidebar
          selectedDate={selectedDate}
          events={getEventsForSelectedDate()}
          onEventView={onEventView}
          onCreateEvent={onCreateEvent}
        />
      </div>
    </section>
  );
}