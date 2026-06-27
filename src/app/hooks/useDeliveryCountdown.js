// hooks/useDeliveryCountdown.js
import { useState, useEffect } from "react";

/**
 * Tracks the 1-hour delivery watchdog timer from acceptedAt.
 * Matches DELIVERY_TIMEOUT_MS on the backend.
 *
 * @param {string|null} acceptedAt  ISO date string when order was accepted
 * @returns {{ minutes, seconds, isWarning, isDanger, isExpired, remaining }}
 */
export function useDeliveryCountdown(acceptedAt) {
    const TIMEOUT_MS = 60 * 60 * 1000; // 1 hour — mirrors backend DELIVERY_TIMEOUT_MS

    const getDeadline = () =>
        acceptedAt ? new Date(acceptedAt).getTime() + TIMEOUT_MS : null;

    const [remaining, setRemaining] = useState(() => {
        const deadline = getDeadline();
        return deadline ? Math.max(0, deadline - Date.now()) : null;
    });

    useEffect(() => {
        const deadline = getDeadline();
        if (!deadline) {
            setRemaining(null);
            return;
        }

        const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [acceptedAt]); // eslint-disable-line react-hooks/exhaustive-deps

    if (remaining === null) {
        return { minutes: null, seconds: null, isWarning: false, isDanger: false, isExpired: false, remaining: null };
    }

    const minutes  = Math.floor(remaining / 60_000);
    const seconds  = Math.floor((remaining % 60_000) / 1000);
    const isWarning = minutes <= 15;
    const isDanger  = minutes <= 5;
    const isExpired = remaining === 0;

    return { minutes, seconds, isWarning, isDanger, isExpired, remaining };
}
