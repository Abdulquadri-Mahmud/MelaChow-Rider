'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    subscribeUserToPush,
    unsubscribeUserFromPush
} from '../lib/push-notification-service';
import toast from 'react-hot-toast';

const SERVICE_WORKER_STATUS_TIMEOUT_MS = 8000;

const withTimeout = (promise, ms, message) => {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), ms);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

export function usePushNotifications(role = 'user') {
    const [subscription, setSubscription] = useState(null);
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState('default');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const STORAGE_PREFIX = useMemo(() => `melachow_${role}_`, [role]);

    /**
     * Listen for messages from Service Worker (Foreground notifications)
     */
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        const handleMessage = (event) => {
            if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
                const { title, body } = event.data.payload;
                toast.success(
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm">{title}</span>
                        <span className="text-xs opacity-90">{body}</span>
                    </div>,
                    { duration: 5000 }
                );
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }, []);

    /**
     * Initialize and check support/status
     */
    useEffect(() => {
        const checkSupport = async () => {
            setLoading(true);
            const pushSupported =
                typeof window !== 'undefined' &&
                'serviceWorker' in navigator &&
                'PushManager' in window &&
                'Notification' in window;
            setIsSupported(pushSupported);

            if (pushSupported) {
                setPermission(Notification.permission);

                try {
                    const registration = await withTimeout(
                        navigator.serviceWorker.ready,
                        SERVICE_WORKER_STATUS_TIMEOUT_MS,
                        'Notification service is not ready yet'
                    );
                    const sub = await registration.pushManager.getSubscription();
                    setSubscription(sub);

                    // Sync with localStorage if needed
                    if (sub) {
                        localStorage.setItem(`${STORAGE_PREFIX}push_notifications_enabled`, 'true');
                    }
                } catch (err) {
                    console.error('Error checking push subscription:', err);
                    setError(err.message || 'Failed to check notification status');
                }
            }

            setLoading(false);
        };

        checkSupport();
    }, [STORAGE_PREFIX]);

    /**
     * Subscribe to push notifications
     */
    const subscribe = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (!isSupported) {
                throw new Error('Push notifications are not supported by this browser');
            }

            // First request permission
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                const sub = await subscribeUserToPush(role);
                setSubscription(sub);
                localStorage.setItem(`${STORAGE_PREFIX}push_notifications_enabled`, 'true');
                localStorage.setItem(`${STORAGE_PREFIX}push_prompt_dismissed`, 'true'); // Dismiss prompt once subscribed
                return true;
            } else if (result === 'denied') {
                setError('Notification permission denied');
                return false;
            }
        } catch (err) {
            console.error('Subscription error:', err);
            setError(err.message || 'Failed to subscribe to notifications');
            return false;
        } finally {
            setLoading(false);
        }
    }, [STORAGE_PREFIX, isSupported, role]);

    /**
     * Unsubscribe from push notifications
     */
    const unsubscribe = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await unsubscribeUserFromPush(role);
            setSubscription(null);
            localStorage.setItem(`${STORAGE_PREFIX}push_notifications_enabled`, 'false');
            return true;
        } catch (err) {
            console.error('Unsubscription error:', err);
            setError(err.message || 'Failed to unsubscribe from notifications');
            return false;
        } finally {
            setLoading(false);
        }
    }, [STORAGE_PREFIX, role]);

    /**
     * Handle prompt dismissal
     */
    const dismissPrompt = useCallback(() => {
        localStorage.setItem(`${STORAGE_PREFIX}push_prompt_dismissed`, 'true');
    }, [STORAGE_PREFIX]);

    /**
     * Check if prompt should be shown
     */
    const shouldShowPrompt = useCallback(() => {
        if (!isSupported || permission === 'denied' || subscription) {
            return false;
        }

        const dismissed = localStorage.getItem(`${STORAGE_PREFIX}push_prompt_dismissed`);
        return dismissed !== 'true';
    }, [STORAGE_PREFIX, isSupported, permission, subscription]);

    return {
        isSupported,
        subscription,
        permission,
        loading,
        error,
        subscribe,
        unsubscribe,
        shouldShowPrompt,
        dismissPrompt
    };
}

