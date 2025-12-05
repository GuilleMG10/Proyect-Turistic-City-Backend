import { useEffect, useState } from "react";
import type { Place, EventWithStatus } from "../types";
import { ApiService } from "../services/api";
import { useUserStore } from "../store/userStore";
import { useFavorites } from "../store/favoritesStore";
import { assignPlaceNumbers } from "../utils/placeNumbering";
import { useToastStore } from "../store/toastStore";

export function useDataLoading() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const { user, loadUserInterests } = useUserStore();
  const { loadFavorites } = useFavorites();
  const addToast = useToastStore((state) => state.addToast);

  // Load user-specific data when user exists (on login or page reload)
  useEffect(() => {
    if (user) {
      loadUserInterests();
      loadFavorites(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Load events from API
        const eventsData = await ApiService.getEvents();
        if (!cancelled) {
          setEvents(eventsData);
        }

        // Load places from API and assign display numbers
        const placesData = await ApiService.getPlaces();
        if (!cancelled) {
          const placesWithNumbers = assignPlaceNumbers(placesData);
          setPlaces(placesWithNumbers);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        if (!cancelled) {
          const msg = 'Hubo un problema al mostrar los datos. Por favor, intenta de nuevo más tarde.';
          // setError(msg); // Disable setting error state to avoid banner
          addToast(msg, 'error');
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [refetchTrigger, addToast]);

  return {
    places,
    events,
    loading,
    error,
    refetch: () => {
      setRefetchTrigger(prev => prev + 1);
    }
  };
}