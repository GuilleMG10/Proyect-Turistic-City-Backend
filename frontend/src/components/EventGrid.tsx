import type { Event, EventWithStatus } from "../types";
import EventCard from "./EventCard";
import { getEventStatus } from "../services/api";

type Props = {
  events: Event[];
  onInterest?: (event: Event) => void;
  onView?: (event: Event) => void;
};

export default function EventGrid({ events, onInterest, onView }: Props) {
  if (!events.length) {
    return (
      <div className="rounded-2xl border bg-white py-16 text-center text-gray-500">
        <p>No se encontraron eventos.</p>
        <p className="text-sm mt-2">Intenta ajustar los filtros de búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        // Add status field to convert Event to EventWithStatus
        const eventWithStatus: EventWithStatus = {
          ...event,
          status: getEventStatus(event.event_date)
        };
        
        return (
          <EventCard
            key={event.id}
            event={eventWithStatus}
            onInterest={onInterest}
            onView={onView}
          />
        );
      })}
    </div>
  );
}