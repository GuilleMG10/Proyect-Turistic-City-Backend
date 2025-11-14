import { useState } from "react";
import { Heart, Sparkles, MapPin } from "lucide-react";
import type { EventWithStatus, Place } from "../types";
import { useUserStore } from "../store/userStore";
import EventCard from "./EventCard";
import PlaceCard from "./PlaceCard";
import ErrorBanner from "./ErrorBanner";
import RecommendationTabs from "./RecommendationTabs";
import EmptyState from "./EmptyState";
import { useRecommendations } from "../hooks/useRecommendations";
import { useFavorites } from "../hooks/useFavorites";

type Props = {
  events: EventWithStatus[];
  places: Place[];
  onEventView?: (event: EventWithStatus) => void;
  onEventInterest?: (event: EventWithStatus) => void;
  onPlaceView?: (place: Place) => void;
  onPlaceInterest?: (place: Place) => void;
};

type RecommendationType = 'favorites' | 'ai-suggested' | 'popular';

export default function Favorites({ 
  events, 
  places, 
  onEventView, 
  onEventInterest, 
  onPlaceView, 
  onPlaceInterest 
}: Props) {
  const { user, interests } = useUserStore();
  const [activeType, setActiveType] = useState<RecommendationType>('favorites');
  const loading = false;
  const error = null;

  // Get user's interested events (from user_interests table)
  const favoriteEvents = events.filter(event => 
    interests.some(interest => interest.event_id === event.id && interest.active)
  );
  
  const placeFavorites = useFavorites((state) => state.favorites);
  const favoritePlaces = places.filter(place => 
    placeFavorites.some(fav => fav.place_id === place.id && fav.active)
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
                      onInterest={onEventInterest}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {favoritePlaces.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
        return (
          <section className="space-y-6">
            <aside className="text-center py-4">
              <Sparkles className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <p className="text-sm text-gray-600">
                Basado en tus intereses y favoritos
              </p>
            </aside>
            
            {suggestedEvents.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4">
                  Eventos recomendados para ti
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onView={onEventView}
                      onInterest={onEventInterest}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {suggestedPlaces.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4">
                  Lugares que podrían gustarte
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedPlaces.map(place => (
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
        return (
          <section className="space-y-6">
            {popularEvents.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4">
                  Eventos Populares
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {popularEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onView={onEventView}
                      onInterest={onEventInterest}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {popularPlaces.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4">
                  Lugares Mejor Valorados
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {popularPlaces.map(place => (
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
      {error && <ErrorBanner message={error} />}

      <RecommendationTabs activeType={activeType} onTypeChange={setActiveType} />

      {/* Content */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200/70" />
          ))}
        </div>
      ) : (
        renderContent()
      )}
    </main>
  );
}