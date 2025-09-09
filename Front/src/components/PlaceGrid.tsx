import type { Place } from "../types";
import PlaceCard from "./PlaceCard";

export default function PlaceGrid({
  places,
  onInterest,
  onView,
}: {
  places: Place[];
  onInterest?: (p: Place) => void;
  onView?: (p: Place) => void;
}) {
  if (!places.length) {
    return (
      <div className="rounded-2xl border bg-white py-16 text-center text-gray-500">
        No se encontraron lugares
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((p) => (
        <PlaceCard key={p.id} place={p} onInterest={onInterest} onView={onView} />
      ))}
    </div>
  );
}
