'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getRiderProfile, toggleRiderAvailability, getRiderNotifications } from '@/app/lib/riderApi';
import { TokenManager } from '@/app/lib/auth-token';
import toast from 'react-hot-toast';
import socketService from '@/app/lib/socketService';
import { useSocket } from './SocketContext';

const RiderContext = createContext(null);

export const useRider = () => useContext(RiderContext);

// Statuses that mean the rider is "active" / should show as ONLINE in the UI.
// ✅ FIX: The original code only checked for 'available', so a rider who was
// 'pending_assignment' or 'on_delivery' appeared OFFLINE after a page refresh.
// That caused them to click the toggle, which called updateRiderStatus('available'),
// which hit the service guard:
//   if (status === "available" && rider.status === "pending_assignment") rider.currentOrderId = null
// ...silently wiping their assigned order from the database.
const ACTIVE_STATUSES = ['available', 'pending_assignment', 'on_delivery'];

function extractRider(data) {
    if (!data) return null;
    if (data?.data?.rider?._id || data?.data?.rider?.id) return data.data.rider;
    if (data?.data?._id || data?.data?.id) return data.data;
    if (data?.rider?._id || data?.rider?.id) return data.rider;
    if (data?._id || data?.id) return data;
    return null;
}

export const RiderProvider = ({ children }) => {
    const [rider, setRider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshProfile = async () => {
        // Do NOT gate on localStorage token.
        // Real auth is the riderToken httpOnly cookie sent automatically
        // by the browser. localStorage is an unreliable secondary signal
        // that gets wiped by browser storage clears, iOS Safari, and private mode.
        // Let the API call happen — if the cookie is invalid, it returns 401
        // and we logout then. If it succeeds, rider loads correctly.
        try {
            const raw = await getRiderProfile();
            const riderData = extractRider(raw);
            const riderId = riderData?._id || riderData?.id;

            if (!riderId) {
                console.error('⚠️ Could not resolve rider ID from API response:', raw);
                setLoading(false);
                return;
            }

            console.log('🛵 Rider loaded, id:', riderId, '| status:', riderData?.status);
            setRider(riderData);

            // ✅ FIX: Check all active statuses, not just 'available'
            setIsOnline(ACTIVE_STATUSES.includes(riderData?.status));

            const notifsRaw = await getRiderNotifications();
            if (notifsRaw?.success && notifsRaw?.notifications) {
                setNotifications(notifsRaw.notifications);
                setUnreadCount(notifsRaw.notifications.filter(n => !n.read).length);
            }

        } catch (error) {
            console.error('Failed to fetch rider profile:', error);
            if (error?.response?.status === 401) {
                // Cookie is genuinely invalid or expired — real logout
                TokenManager.clearToken('rider');
                setRider(null);
                setIsOnline(false);
                window.location.href = '/auth/rider/login';
            }
            // Any other error (network, 500) — don't logout, just fail silently
            // The rider might just have a flaky connection
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshProfile();

        const updateNotifs = (e) => {
            setNotifications(prev => [e.detail, ...prev]);
            setUnreadCount(prev => prev + 1);
        };
        window.addEventListener('notifications:updated', updateNotifs);
        return () => window.removeEventListener('notifications:updated', updateNotifs);
    }, []);

    useEffect(() => {
        const handleUnauthorized = () => {
            console.log('🛑 Rider unauthorized — triggering logout');
            logout();
        };
        window.addEventListener('rider:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('rider:unauthorized', handleUnauthorized);
    }, []);

    const { isConnected: wsConnected, socket } = useSocket();
    const riderId = rider?._id || rider?.id;

    useEffect(() => {
        if (!socket || !rider?._id || !isOnline) return;
        console.log('🛵 Emitting rider_connect for:', rider._id);
        socket.emit('rider_connect', { riderId: rider._id });
    }, [socket, rider?._id, isOnline]);

    useEffect(() => {
        if (!riderId || !wsConnected || !socket) return;

        socketService.subscribeToRider(riderId);

        const handleStatusChange = (data) => {
            if (data.riderId === riderId) {
                // ✅ FIX: Same check — all active statuses count as online
                setIsOnline(ACTIVE_STATUSES.includes(data.status));
                setRider(prev => prev ? { ...prev, status: data.status } : prev);
                if (data.status === 'offline') {
                    toast.error('Your status was changed to offline');
                }
            }
        };

        const handleRiderDeactivated = (data) => {
            if (data.riderId === riderId) {
                toast.error('Your account has been deactivated.', { duration: 6000 });
                logout();
            }
        };

        const handleRiderAssigned = (data) => {
            const isForThisRider = !data.riderId || data.riderId === riderId;
            if (isForThisRider) {
                // ✅ FIX: Optimistically update local rider state so isOnline
                // stays true immediately, before the next refreshProfile call.
                // Prevents the OFFLINE flash that would trigger accidental toggle.
                setRider(prev => prev ? {
                    ...prev,
                    status: 'pending_assignment',
                    currentOrderId: data.orderId
                } : prev);
                setIsOnline(true);
                window.dispatchEvent(new CustomEvent('rider:new_assignment', { detail: data }));
            }
        };

        socket.on('rider_status_changed', handleStatusChange);
        socket.on('rider_deactivated', handleRiderDeactivated);
        socket.on('order_assigned', handleRiderAssigned);
        socket.on('ORDER_ASSIGNED_TO_RIDER', handleRiderAssigned);

        return () => {
            socket.off('rider_status_changed', handleStatusChange);
            socket.off('rider_deactivated', handleRiderDeactivated);
            socket.off('order_assigned', handleRiderAssigned);
            socket.off('ORDER_ASSIGNED_TO_RIDER', handleRiderAssigned);
        };
    }, [riderId, wsConnected, socket]);

    const logout = async () => {
        try {
            console.log('🛵 Logging out rider form backend...')
            const { baseUrl } = await import('@/app/lib/api').then(m => m.default || m);
            const apiUrl = typeof baseUrl === 'string' ? baseUrl : (process.env.NEXT_PUBLIC_API_URL || '');
            await fetch(`${apiUrl}/rider/auth/logout`, {
                method: "POST",
                credentials: "include"
            });
        } catch (error) {
            console.error('Failed to call backend logout:', error);
        } finally {
            TokenManager.clearToken('rider');
            setRider(null);
            setIsOnline(false);
            if (typeof window !== 'undefined') {
                window.location.href = '/auth/rider/login';
            }
        }
    };

    const toggleAvailability = async () => {
        const currentRiderId = rider?._id || rider?.id;

        if (!currentRiderId) {
            toast.error('Rider profile not loaded yet. Please wait.');
            return;
        }

        // ✅ FIX: Block going offline if assigned OR on delivery.
        // The original only checked currentOrderId, but during pending_assignment
        // the local state may not have currentOrderId set yet (it comes from the
        // server). Checking the status string is the reliable guard.
        const isAssignedOrDelivering =
            rider?.currentOrderId ||
            rider?.status === 'pending_assignment' ||
            rider?.status === 'on_delivery';

        if (isOnline && isAssignedOrDelivering) {
            toast.error('You cannot go offline while on an active delivery!');
            return;
        }

        const newStatus = isOnline ? 'offline' : 'available';
        setIsToggling(true);
        try {
            await toggleRiderAvailability(currentRiderId, newStatus);
            setIsOnline(!isOnline);
            setRider(prev => prev ? { ...prev, status: newStatus } : prev);
            toast.success(`You are now ${newStatus}`);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update status');
        } finally {
            setIsToggling(false);
        }
    };

    const updateProfile = async (updateData) => {
        const currentRiderId = rider?._id || rider?.id;
        if (!currentRiderId) return;

        try {
            const { updateRiderProfile } = await import('@/app/lib/riderApi');
            const response = await updateRiderProfile(currentRiderId, updateData);
            if (response.success) {
                setRider(prev => ({ ...prev, ...response.data }));
                toast.success('Profile updated successfully');
                return true;
            }
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error(error?.response?.data?.message || 'Failed to update profile');
            return false;
        }
    };

    return (
        <RiderContext.Provider value={{
            rider,
            loading,
            isOnline,
            isToggling,
            toggleAvailability,
            logout,
            refreshProfile,
            updateProfile,
            notifications,
            setNotifications,
            unreadCount,
            setUnreadCount
        }}>
            {children}
        </RiderContext.Provider>
    );
};
