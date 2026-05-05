'use client';

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRealtimeNotifications } from '@/app/hooks/useRealtimeNotifications';


/**
 * Component that listens for real-time notifications and displays toast alerts
 */
export default function RealtimeNotificationListener() {
    const { latestNotification } = useRealtimeNotifications();

    useEffect(() => {
        if (!latestNotification) return;

        // vendor_new_order toasts are handled in SocketContext with richer UI
        // Skip them here to avoid duplicate toasts
        if (latestNotification.type === 'vendor_new_order') return;

        // Get appropriate icon based on notification type
        const getIcon = (type) => {
            if (type?.includes('order')) return '🛍️';
            if (type?.includes('promo') || type?.includes('discount')) return '🎁';
            if (type?.includes('delivery')) return '🚚';
            if (type?.includes('cancel')) return '❌';
            return '🔔';
        };

        // Show toast notification
        toast.custom((t) => (
            <div
                className={`bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-4 flex items-start gap-4 max-w-md border-l-4 ${latestNotification.type?.includes('order')
                    ? 'border-orange-500'
                    : latestNotification.type?.includes('promo')
                        ? 'border-green-500'
                        : latestNotification.type?.includes('cancel')
                            ? 'border-red-500'
                            : 'border-blue-500'
                    } ${t.visible ? 'animate-in slide-in-from-right-full' : 'animate-out fade-out'}`}
                onClick={() => {
                    if (latestNotification.url) {
                        window.location.href = latestNotification.url;
                    }
                    toast.dismiss(t.id);
                }}
            >
                <div className="text-2xl flex-shrink-0">
                    {getIcon(latestNotification.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                        {latestNotification.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {latestNotification.body}
                    </p>
                    {latestNotification.url && (
                        <button className="text-orange-500 text-xs font-bold mt-2 hover:text-orange-600">
                            View Details →
                        </button>
                    )}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                    }}
                    className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                >
                    ✕
                </button>
            </div>
        ), {
            duration: 5000,
            position: 'top-right'
        });

        // Play notification sound (optional)
        if ('Audio' in window && latestNotification.type?.includes('order')) {
            try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => {
                    // Ignore errors (user might not have interacted with page yet)
                });
            } catch (error) {
                // Ignore audio errors
            }
        }

    }, [latestNotification]);

    return null; // This is a listener component, no UI
}
