import { useOutletContext } from "react-router-dom";
import EventCard from "../../components/cards/EventCard";
import EmptyState from "../../components/ui/EmptyState";
import type { ExploreContextType } from "./types";

export default function ExploreEvents() {
  const { filteredEvents, openEventModal, loading } = useOutletContext<ExploreContextType>();

  if (loading) {
    return (
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 p-12 text-center border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">Cargando eventos...</p>
        </div>
      </section>
    );
  }

  if (filteredEvents.length === 0) {
    return <EmptyState type="no-events" />;
  }

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
