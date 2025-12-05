import { useState } from "react";
import { Heart, MapPin, Sparkles, TrendingUp } from "lucide-react";
import type { EventWithStatus, Place, UserInterest, PlaceFavorite } from "../../types";
import { useUserStore } from "../../store/userStore";
import EventCard from "../cards/EventCard";
import PlaceCard from "../cards/PlaceCard";
import RecommendationTabs from "./RecommendationTabs";
import EmptyState from "../ui/EmptyState";
import { useRecommendations } from "../../hooks/useRecommendations";
import { useFavorites, type FavoritesState } from "../../store/favoritesStore";

type Props = {
  events: EventWithStatus[];
  places: Place[];
  onEventView?: (event: EventWithStatus) => void;
  onPlaceView?: (place: Place) => void;
  onPlaceInterest?: (place: Place) => void;
};

type RecommendationType = 'favorites' | 'ai-suggested' | 'popular';

export default function Favorites({ 
  events, 
  places, 
  onEventView, 
  onPlaceView, 
  onPlaceInterest 
}: Props) {
  const { user, interests } = useUserStore();
  const [activeType, setActiveType] = useState<RecommendationType>('favorites');

  // Get user's interested events (from user_interests table)
  const favoriteEvents = events.filter(event => 
    interests.some((interest: UserInterest) => interest.event_id === event.id && interest.active)
  );
  
  const placeFavorites = useFavorites((state: FavoritesState) => state.favorites);
  const favoritePlaces = places.filter(place => 
    placeFavorites.some((fav: PlaceFavorite) => fav.place_id === place.id && fav.active)
  );

  const { aiSuggestions, popularContent } = useRecommendations(
    events,
    places,
    favoriteEvents,
    favoritePlaces
  );

  const { suggestedEvents, suggestedPlaces } = aiSuggestions;
  const { popularEvents, popularPlaces } = popularContent;

  if (!user) {
    return <EmptyState type="no-user" />;
  }

  const renderContent = () => {
    switch (activeType) {
      case 'favorites':
        if (favoriteEvents.length === 0 && favoritePlaces.length === 0) {
          return <EmptyState type="no-favorites" />;
        }
        
        return (
          <section className="space-y-6">
            {favoriteEvents.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <Heart className="h-5 w-5 text-red-500" />
                  Eventos Favoritos ({favoriteEvents.length})
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {favoriteEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onView={onEventView}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {favoritePlaces.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  Lugares Favoritos ({favoritePlaces.length})
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {favoritePlaces.map(place => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onView={onPlaceView}
                      onInterest={onPlaceInterest}
                    />
                  ))}
                </div>
              </section>
            )}
          </section>
        );

      case 'ai-suggested':
        if (suggestedEvents.length === 0 && suggestedPlaces.length === 0) {
          return <EmptyState type="no-ai-suggestions" />;
        }
        
        return (
          <section className="space-y-6">
            {suggestedEvents.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Eventos recomendados para ti ({suggestedEvents.length})
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedEvents.map((event: EventWithStatus) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onView={onEventView}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {suggestedPlaces.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <MapPin className="h-5 w-5 text-purple-500" />
                  Lugares que podrían gustarte ({suggestedPlaces.length})
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedPlaces.map((place: Place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onView={onPlaceView}
                      onInterest={onPlaceInterest}
                    />
                  ))}
                </div>
              </section>
            )}
          </section>
        );

      case 'popular':
        if (popularEvents.length === 0 && popularPlaces.length === 0) {
          return <EmptyState type="no-popular" />;
        }
        
        return (
          <section className="space-y-6">
            {popularEvents.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Eventos Populares ({popularEvents.length})
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {popularEvents.map((event: EventWithStatus) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onView={onEventView}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {popularPlaces.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Lugares Mejor Valorados ({popularPlaces.length})
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {popularPlaces.map((place: Place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onView={onPlaceView}
                      onInterest={onPlaceInterest}
                    />
                  ))}
                </div>
              </section>
            )}
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <main className="space-y-6">
      <RecommendationTabs activeType={activeType} onTypeChange={setActiveType} />
      {renderContent()}
    </main>
  );
}