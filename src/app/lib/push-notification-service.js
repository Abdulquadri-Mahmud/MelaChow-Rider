import axios from 'axios';

const SERVICE_WORKER_TIMEOUT_MS = 10000;
const API_TIMEOUT_MS = 15000;

const withTimeout = (promise, ms, message) => {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), ms);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

async function getServiceWorkerRegistration() {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Push notifications are not supported by this browser');
    }

    const existingRegistration = await navigator.serviceWorker.getRegistration('/');
    if (existingRegistration) {
        return existingRegistration;
    }

    try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (error) {
        throw new Error(error?.message || 'Could not start notification service');
    }

    return withTimeout(
        navigator.serviceWorker.ready,
        SERVICE_WORKER_TIMEOUT_MS,
        'Notification service is taking too long to start. Please refresh and try again.'
    );
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 * Required for subscribing to push notifications
 */
export function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const getApiPath = (role, endpoint) => {
    let base = '/api/notifications';
    if (role === 'vendor') base = '/api/vendors/notifications';
    if (role === 'admin') base = '/api/admin/notifications';
    if (role === 'rider') base = '/api/riders/notifications';
    return `${base}/${endpoint}`;
};

/**
 * Fetch VAPID public key from backend
 */
export async function getVapidPublicKey(role = 'user') {
    try {
        // VAPID keys are global to the application and usually served 
        // from the base notification endpoint, not the segregated ones.
        const response = await axios.get(getApiPath('user', 'vapid-public-key'), {
            withCredentials: true,
            timeout: API_TIMEOUT_MS,
        });
        if (!response.data?.publicKey) {
            throw new Error('Notification key is not configured on the server');
        }
        return response.data.publicKey;
    } catch (error) {
        console.error('Failed to fetch VAPID public key:', error);
        throw error;
    }
}

/**
 * Send subscription to backend
 */
export async function sendSubscriptionToServer(subscription, role = 'user') {
    try {
        // Determine device type
        let deviceType = 'desktop';
        if (/Mobi|Android/i.test(navigator.userAgent)) {
            deviceType = 'mobile';
        } else if (/Tablet|iPad/i.test(navigator.userAgent)) {
            deviceType = 'tablet';
        }

        const payload = {
            subscription,
            deviceType
        };

        const response = await axios.post(getApiPath(role, 'subscribe'), payload, {
            withCredentials: true,
            timeout: API_TIMEOUT_MS,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to send subscription to server:', error);
        throw error;
    }
}

/**
 * Remove subscription from backend
 */
export async function removeSubscriptionFromServer(subscription, role = 'user') {
    try {
        const path = getApiPath(role, 'unsubscribe');
        const config = {
            withCredentials: true,
            timeout: API_TIMEOUT_MS,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const response = await axios.post(path, subscription, config);
        return response.data;
    } catch (error) {
        console.error('Failed to remove subscription from server:', error);
        throw error;
    }
}

/**
 * Trigger a test notification
 */
export async function testPushNotification(role = 'user') {
    try {
        const response = await axios.post(getApiPath(role, 'test'), {}, {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.error('Failed to trigger test notification:', error);
        throw error;
    }
}

/**
 * Subscribe user to push notifications
 */
export async function subscribeUserToPush(role = 'user') {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported by this browser');
    }

    try {
        const registration = await getServiceWorkerRegistration();
        const vapidPublicKey = await getVapidPublicKey(role);
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await withTimeout(
                registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey,
                }),
                SERVICE_WORKER_TIMEOUT_MS,
                'Notification subscription is taking too long. Please try again.'
            );
        }

        await sendSubscriptionToServer(subscription, role);
        return subscription;
    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        throw error;
    }
}

/**
 * Unsubscribe user from push notifications
 */
export async function unsubscribeUserFromPush(role = 'user') {
    try {
        const registration = await getServiceWorkerRegistration();
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const subscriptionData = subscription.toJSON();
            await removeSubscriptionFromServer(subscriptionData, role);
            await subscription.unsubscribe();
        }
        return true;
    } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
        throw error;
    }
}
