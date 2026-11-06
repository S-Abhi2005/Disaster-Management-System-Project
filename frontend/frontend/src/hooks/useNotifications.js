import { useEffect, useRef } from 'react';
import { simulateIncomingAlert } from '../api/alertService';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';

/**
 * useNotifications — simulates real-time WebSocket alerts via setInterval.
 * In production, replace the interval with socket.io-client event listeners.
 *
 * Usage: call once at the root layout level (DashboardLayout)
 */
const useNotifications = (intervalMs = 45000) => {
  const { isAuthenticated } = useAuthStore();
  const addNotification     = useUIStore((s) => s.addNotification);
  const timerRef            = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Push one alert immediately on mount (after a short delay)
    const bootstrapTimer = setTimeout(() => {
      const alert = simulateIncomingAlert();
      addNotification({
        id:        alert.id,
        title:     alert.title,
        message:   alert.message,
        type:      alert.type,
        timestamp: alert.timestamp,
        read:      false,
      });
    }, 4000);

    // Then push one every intervalMs
    timerRef.current = setInterval(() => {
      const alert = simulateIncomingAlert();
      addNotification({
        id:        alert.id,
        title:     alert.title,
        message:   alert.message,
        type:      alert.type,
        timestamp: alert.timestamp,
        read:      false,
      });
    }, intervalMs);

    return () => {
      clearTimeout(bootstrapTimer);
      clearInterval(timerRef.current);
    };
  }, [isAuthenticated, intervalMs]);
};

export default useNotifications;
