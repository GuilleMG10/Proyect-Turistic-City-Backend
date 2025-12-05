import { useOutletContext } from "react-router-dom";
import PlaceGrid from "../../components/features/PlaceGrid";
import type { ExploreContextType } from "./types";

export default function ExplorePlaces() {
  const { filteredPlaces, user, toggleFavorite, openPlaceModal, loading } = useOutletContext<ExploreContextType>();

  if (loading) {
    return (
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 p-12 text-center border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">Cargando lugares...</p>
        </div>
      </section>
    );
  }

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
