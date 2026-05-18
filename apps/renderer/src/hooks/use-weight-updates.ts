import { useEffect } from 'react';
import { useWeightStore } from '../store/weightStore';

export function useWeightUpdates() {
  const setLatestReading = useWeightStore((s) => s.setLatestReading);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onWeightUpdate((reading) => {
        setLatestReading(reading);
        // console.log(reading)
      });
    }
  }, [setLatestReading]);
}
