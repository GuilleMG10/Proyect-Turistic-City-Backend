import { useOutletContext } from "react-router-dom";
import ItineraryTab from "../../components/Itinerary/ItineraryTab";
import type { ExploreContextType } from "./types";

export default function ExploreItinerary() {
  const { places } = useOutletContext<ExploreContextType>();

  return (
    <section aria-labelledby="itinerario-heading">
      <h2 id="itinerario-heading" className="sr-only">Mis Itinerarios</h2>
      <ItineraryTab places={places} />
    </section>
  );
}
