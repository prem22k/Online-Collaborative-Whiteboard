import { useEffect, useState } from 'react';
import { SERVER_URL } from '../utils/constants';

export default function useStatusPolling(intervalMs = 1000) {
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${SERVER_URL}/status`);
        const json = await res.json();
        setQueueSize(json.queueSize ?? 0);
      } catch {
        // Server may not be ready yet — fail silently
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return queueSize;
}
