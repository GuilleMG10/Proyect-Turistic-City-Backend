import type { Place, EventWithStatus, User } from "../../types";

export type ExploreContextType = {
  places: Place[];
  events: EventWithStatus[];
  filteredPlaces: Place[];
  filteredEvents: EventWithStatus[];
  loading: boolean;
  user: User | null;
  toggleFavorite: (userId: number, placeId: number) => void;
  toggleEventInterest: (event: EventWithStatus) => void;
  openPlaceModal: (place: Place) => void;
  openEventModal: (event: EventWithStatus) => void;
};
