/**
 * Service Worker Registration Utility
 * 
 * Safely registers the service worker with proper error handling
 * and lifecycle management. This ensures PWA functionality doesn't
 * break the existing app.
 */

export async function registerServiceWorker() {
    // Only run in browser
    if (typeof window === 'undefined') {
        return null;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
        console.log('[PWA] Service workers are not supported');
        return null;
    }

    if (window.__melachowServiceWorkerRegistrationPromise) {
        return window.__melachowServiceWorkerRegistrationPromise;
    }

    window.__melachowServiceWorkerRegistrationPromise = registerServiceWorkerOnce();
    return window.__melachowServiceWorkerRegistrationPromise;
}

async function registerServiceWorkerOnce() {
    try {
        // Wait for page to load before registering
        if (document.readyState === 'loading') {
            await new Promise((resolve) => {
                window.addEventListener('load', resolve, { once: true });
            });
        }

        // Register the service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });

        console.log('[PWA] Service worker registered successfully:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
            registration.update();
        }, 60 * 60 * 1000); // Check every hour

        return registration;
    } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
        window.__melachowServiceWorkerRegistrationPromise = null;
        return null;
    }
}

/**
 * Unregister service worker (for debugging/testing)
 */
export async function unregisterServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const unregistered = await registration.unregister();
        console.log('[PWA] Service worker unregistered:', unregistered);
        return unregistered;
    } catch (error) {
        console.error('[PWA] Service worker unregistration failed:', error);
        return false;
    }
}

/**
 * Check if app is running as installed PWA
 */
export function isPWA() {
    if (typeof window === 'undefined') {
        return false;
    }

    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
    );
}

/**
 * Get PWA display mode
 */
export function getPWADisplayMode() {
    if (typeof window === 'undefined') {
        return 'browser';
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
        return 'standalone';
    }

    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    if (isFullscreen) {
        return 'fullscreen';
    }

    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    if (isMinimalUI) {
        return 'minimal-ui';
    }

    return 'browser';
}
