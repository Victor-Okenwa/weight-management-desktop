import { useWeightStore } from "@/store/weightStore";
import { useEffect } from "react";

export function useWeightUpdates() {
  const setLatestReading = useWeightStore((s) => s.setLatestReading);

   useEffect(() => {
    // This will work once the preload exposes window.electronAPI
    if (window.electronAPI) {
      window.electronAPI.onWeightUpdate((reading) => {
        setLatestReading(reading);
      });
    }
    // Cleanup if needed, but onWeightUpdate already removes listeners in preload
  }, [setLatestReading]);
}