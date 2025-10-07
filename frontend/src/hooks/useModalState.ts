import { useState } from "react";
import type { EventWithStatus, Place } from "../types";

export function useModalState() {
  const [selectedEvent, setSelectedEvent] = useState<EventWithStatus | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const openEventModal = (event: EventWithStatus) => setSelectedEvent(event);
  const closeEventModal = () => setSelectedEvent(null);

  const openPlaceModal = (place: Place) => setSelectedPlace(place);
  const closePlaceModal = () => setSelectedPlace(null);

  const openFilterModal = () => setIsFilterModalOpen(true);
  const closeFilterModal = () => setIsFilterModalOpen(false);

  return {
    // State
    selectedEvent,
    selectedPlace,
    isFilterModalOpen,

    // Actions
    openEventModal,
    closeEventModal,
    openPlaceModal,
    closePlaceModal,
    openFilterModal,
    closeFilterModal,

    // Computed
    isEventModalOpen: !!selectedEvent,
    isPlaceModalOpen: !!selectedPlace,
  };
}