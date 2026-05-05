'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import socketService from '@/app/lib/socketService';

/**
 * Hook for subscribing to real-time order updates
 */
export function useOrderTracking(orderId) {
    useEffect(() => {
        if (!orderId) return;

        // Subscribe to order updates
        socketService.subscribeToOrder(orderId);

        return () => {
            // Unsubscribe when component unmounts
            socketService.unsubscribeFromOrder(orderId);
        };
    }, [orderId]);

    // Listen for order status updates
    const onStatusUpdate = (callback) => {
        socketService.onOrderStatusUpdate((data) => {
            if (data.orderId === orderId) {
                callback(data);
            }
        });
    };

    // Listen for delivery location updates
    const onLocationUpdate = (callback) => {
        socketService.onDeliveryLocationUpdate((data) => {
            if (data.orderId === orderId) {
                callback(data);
            }
        });
    };

    return {
        onStatusUpdate,
        onLocationUpdate
    };
}
