import { useEffect } from 'react';
import { useWeightStore } from '../store/weightStore';

export function useWeightUpdates() {
  const setLatestReading = useWeightStore((s) => s.setLatestReading);
  const setSerialStatus = useWeightStore((s) => s.setSerialStatus);

  useEffect(() => {
    if (window.electronAPI) {
      // Request current status immediately
      window.electronAPI.getSerialStatus().then((status) => {
        setSerialStatus(status);
      });

      window.electronAPI.onWeightUpdate((reading) => {
        setLatestReading(reading);
        // console.log(reading)
      });

      window.electronAPI.onSerialStatus((status) => {
        setSerialStatus(status);
        // When disconnected, consider resetting stable reading?
        if (status === 'disconnected') {
          setLatestReading({
            isStable: true,
            raw: 'Disconnected',
            weight: -1,
            unit: 'kg',
          }); // no longer valid
        }
      });
    }
  }, [setLatestReading, setSerialStatus]);
}
