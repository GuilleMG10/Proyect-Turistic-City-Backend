import { useOutletContext } from "react-router-dom";
import PlaceGrid from "../../components/features/PlaceGrid";
import type { ExploreContextType } from "./types";

export default function ExplorePlaces() {
  const { filteredPlaces, user, toggleFavorite, openPlaceModal } = useOutletContext<ExploreContextType>();

  return (
    <section aria-labelledby="explorar-heading">
      <h2 id="explorar-heading" className="sr-only">Explorar Lugares</h2>
      <PlaceGrid
        places={filteredPlaces}
        onInterest={(p) => user && toggleFavorite(user.id, p.id)}
        onView={openPlaceModal}
      />
    </section>
  );
}
