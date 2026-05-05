'use client';

import { useSocket } from '@/app/context/SocketContext';

/**
 * Hook for real-time notifications via Socket.IO
 * Now consumes from SocketContext for global state persistence
 */
export function useRealtimeNotifications() {
    const { isConnected, unreadCount, latestNotification, refreshUnreadCount } = useSocket();

    return {
        isConnected,
        unreadCount,
        latestNotification,
        refreshUnreadCount
    };
}
