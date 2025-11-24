import ItineraryTab from "../../components/Itinerary/ItineraryTab";

export default function ExploreItinerary() {
  return (
    <section aria-labelledby="itinerario-heading">
      <h2 id="itinerario-heading" className="sr-only">Mis Itinerarios</h2>
      <ItineraryTab />
    </section>
  );
}
