import type { Event } from "../types";
import EventCard from "./EventCard";

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
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onInterest={onInterest}
          onView={onView}
        />
      ))}
    </div>
  );
}