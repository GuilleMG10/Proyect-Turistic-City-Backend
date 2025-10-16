import { useEffect, useState } from "react";
import type { Place, EventWithStatus } from "../types";
import { ApiService } from "../services/api";
import { useUserStore } from "../store/userStore";
import { useFavorites } from "./useFavorites";

export function useDataLoading() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const { user, loadUserInterests } = useUserStore();
  const { loadFavorites } = useFavorites();

  // Load user-specific data when user exists (on login or page reload)
  useEffect(() => {
    if (user) {
      loadUserInterests();
      loadFavorites(user.id);
    }
  }, [user?.id, loadUserInterests, loadFavorites]);

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

        // Load places from API
        const placesData = await ApiService.getPlaces();
        if (!cancelled) {
          setPlaces(placesData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        if (!cancelled) {
          setError('Error al cargar los datos. Intentando de nuevo...');
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
  }, [refetchTrigger]);

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