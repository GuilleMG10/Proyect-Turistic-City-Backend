import { useOutletContext } from "react-router-dom";
import EventCard from "../../components/cards/EventCard";
import type { ExploreContextType } from "./types";

export default function ExploreEvents() {
  const { filteredEvents, openEventModal } = useOutletContext<ExploreContextType>();

  return (
    <section aria-labelledby="eventos-heading">
      <h2 id="eventos-heading" className="sr-only">Eventos Disponibles</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onView={openEventModal}
          />
        ))}
      </div>
    </section>
  );
}
