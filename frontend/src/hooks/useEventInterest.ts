import { useState } from "react";
import { useUserStore } from "../store/userStore";
import type { EventWithStatus } from "../types";

export function useEventInterest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, addInterest, removeInterest, isInterested } = useUserStore();

  const toggleInterest = async (event: EventWithStatus) => {
    if (!user) {
      setError("Usuario no autenticado");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isInterested(event.id)) {
        // Remove interest
        await removeInterest(event.id);
      } else {
        // Add interest
        await addInterest(event.id);
      }
    } catch (err) {
      console.error("Error toggling event interest:", err);
      setError("Error al actualizar interés en el evento");
    } finally {
      setLoading(false);
    }
  };

  return {
    toggleInterest,
    isInterested,
    loading,
    error,
  };
}