import { useEffect } from 'react';
import { useWeightStore } from '../store/weightStore';

export function useWeightUpdates() {
  const setLatestReading = useWeightStore((s) => s.setLatestReading);
  const setStableReading = useWeightStore((s) => s.setStableReading);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onWeightUpdate((reading) => {
        setLatestReading(reading);
      });
      window.electronAPI.onWeightStable((reading) => {
        setStableReading(reading);
        console.log(reading)
      });
    }
  }, [setLatestReading, setStableReading]);
}