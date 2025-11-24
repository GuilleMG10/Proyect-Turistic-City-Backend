import type { Place } from "../../types";
import PlaceCard from "../cards/PlaceCard";
import EmptyState from "../ui/EmptyState";

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
    return <EmptyState type="no-places" />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((p) => (
        <PlaceCard key={p.id} place={p} onInterest={onInterest} onView={onView} />
      ))}
    </div>
  );
}
