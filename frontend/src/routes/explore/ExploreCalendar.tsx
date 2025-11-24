import { useOutletContext } from "react-router-dom";
import Calendar from "../../components/features/Calendar";
import type { ExploreContextType } from "./types";

export default function ExploreCalendar() {
  const { events, openEventModal } = useOutletContext<ExploreContextType>();

  return (
    <section aria-labelledby="calendario-heading">
      <h2 id="calendario-heading" className="sr-only">Calendario de Eventos</h2>
      <Calendar
        events={events}
        onEventView={openEventModal}
        onCreateEvent={(date) => console.log("Crear evento en:", date)}
      />
    </section>
  );
}
