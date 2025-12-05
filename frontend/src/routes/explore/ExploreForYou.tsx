import { useOutletContext } from "react-router-dom";
import Favorites from "../../components/features/Favorites";
import type { ExploreContextType } from "./types";

export default function ExploreForYou() {
  const { 
    events, 
    places, 
    openEventModal, 
    openPlaceModal, 
    toggleFavorite, 
    user 
  } = useOutletContext<ExploreContextType>();

  return (
    <section aria-labelledby="recomendaciones-heading">
      <h2 id="recomendaciones-heading" className="sr-only">Recomendaciones Personalizadas</h2>
      <Favorites
        events={events}
        places={places}
        onEventView={openEventModal}
        onPlaceView={openPlaceModal}
        onPlaceInterest={(p) => user && toggleFavorite(user.id, p.id)}
      />
    </section>
  );
}
