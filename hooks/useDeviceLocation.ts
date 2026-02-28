import { useState, useCallback } from "react";
import * as Location from "expo-location";

interface DeviceLocation {
  latitude: number;
  longitude: number;
}

interface UseDeviceLocationResult {
  location: DeviceLocation | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => Promise<DeviceLocation | null>;
}

/**
 * Hook for requesting and managing device location.
 * Centralizes expo-location permission and GPS retrieval logic.
 */
export function useDeviceLocation(): UseDeviceLocationResult {
  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async (): Promise<DeviceLocation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Request permission first
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError("Location permission denied. Please enable it in Settings.");
        return null;
      }

      // Get current position with high accuracy
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: DeviceLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setLocation(coords);
      return coords;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get location";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { location, isLoading, error, requestLocation };
}
