'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import socketService from '@/app/lib/socketService';
import { TokenManager } from '@/app/lib/auth-token';
import toast from 'react-hot-toast';

const SocketContext = createContext({
    isConnected: false,
    socket: null,
    unreadCount: 0,
    latestNotification: null
});

export const useSocket = () => useContext(SocketContext);

import { usePathname } from 'next/navigation';

export const SocketProvider = ({ children }) => {
    const pathname = usePathname();
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState(null);

    // Rider assignment alert for admin — platform-managed order ready
    const [riderAssignmentAlert, setRiderAssignmentAlert] = useState(null);

    // Guard: ensures socket event listeners are registered only once per
    // socket instance, not on every reconnection attempt from the interval
    const listenersRegistered = useRef(false);
    const authFailed = useRef(false);

    // Determine role based on path
    const getRoleFromPath = (path) => {
        if (path?.startsWith('/vendors')) return 'vendor';
        if (path?.startsWith('/admin')) return 'admin';
        if (path?.startsWith('/rider')) return 'rider';
        return 'user';
    };

    const role = getRoleFromPath(pathname);

    const fetchUnreadCount = async () => {
        const apiBase = role === 'vendor' ? '/api/vendors/notifications' :
            role === 'admin' ? '/api/admin/notifications' :
                role === 'rider' ? '/api/riders/notifications' :
                    '/api/notifications';

        try {
            // Refined fetching based on role-specific endpoints
            const fetchUrl = role === 'vendor' ? `${apiBase}/history` : `${apiBase}/unread-count`;

            const response = await fetch(fetchUrl, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                let count = 0;

                if (role === 'vendor' || role === 'rider') {
                    count = data.unreadCount ?? data.count ?? data.data?.unreadCount ?? data.data?.count ?? 0;
                } else {
                    count = data.count ?? data.data?.count ?? 0;
                }

                setUnreadCount(count);
                return count;
            }
        } catch (error) {
            console.error(`Failed to fetch ${role} unread count:`, error);
        }
        return 0;
    };

    useEffect(() => {
        const connect = async () => {
            // Token is optional — socket auth now prioritises httpOnly cookie.
            // We still pass localStorage token as fallback for environments
            // where cookies aren't available (e.g. native mobile webview).
            const token = TokenManager.getToken(role);
            if (authFailed.current) return;

            socketService.connect(token);

            // Fetch initial unread count
            await fetchUnreadCount();

            // Only register listeners once — prevent stacking on reconnect attempts
            if (listenersRegistered.current) {
                return;
            }
            listenersRegistered.current = true;

            // Set up basic listeners
            socketService.onNewNotification((notification) => {
                setLatestNotification(notification);
                if (!notification.read) {
                    setUnreadCount(prev => prev + 1);

                    // ✅ FIX: "Silent" Notifications — added global toast alert
                    // Skip if it's a new order (that has its own custom toast below)
                    if (notification.type !== 'vendor_new_order') {
                        const isHighUrgency = ['admin_order_ready', 'rider_assignment_needed', 'urgent_system'].includes(notification.type);

                        if (isHighUrgency && role === 'admin') {
                            // Specialized Logistics Alert Toast for Admins
                            toast.custom((t) => (
                                <div
                                    className={`bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-4 flex items-start gap-4 w-full max-w-sm border-l-4 border-rose-500 cursor-pointer ${t.visible ? 'animate-in slide-in-from-right-full' : 'animate-out fade-out'}`}
                                    onClick={() => {
                                        if (notification.url) window.location.href = notification.url;
                                        toast.dismiss(t.id);
                                    }}
                                >
                                    <div className="flex-shrink-0 w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-rose-200">
                                        🚨
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-sm text-rose-600 uppercase italic tracking-tight">Mission Critical</p>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{notification.title}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{notification.body}</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
                                        className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 text-xs"
                                    >✕</button>
                                </div>
                            ), { duration: 20000, position: 'top-right', id: `logistics-${notification._id}` });

                            // Urgent sound
                            try { const audio = new Audio('/sounds/urgency.mp3'); audio.play().catch(() => { }); } catch (e) { }

                        } else {
                            // Regular Notification Toast
                            toast.success(notification.body || notification.title, {
                                icon: '🔔',
                                duration: 6000,
                                position: 'top-right',
                                id: notification._id
                            });
                        }
                    }
                }
                // Dispatch custom event for notifications list update
                window.dispatchEvent(new CustomEvent('notifications:updated', { detail: notification }));
            });

            socketService.onNotificationCountUpdate((data) => {
                setUnreadCount(data.count);
            });

            // Handle connection state changes
            socketService.socket?.on('connect', () => {
                console.log('✅ Socket.IO status: Connected');
                setIsConnected(true);
                authFailed.current = false; // Reset on success
            });
            
            socketService.socket?.on('disconnect', (reason) => {
                console.log('🔴 Socket.IO status: Disconnected', reason);
                setIsConnected(false);
            });
            
            socketService.socket?.on('connect_error', (error) => {
                setIsConnected(false);
                if (error.message === 'Authentication failed') {
                    console.error('🛑 Socket.IO Error: Persistent authentication failure. Stopping retries until refresh.');
                    authFailed.current = true;
                }
            });

            socketService.onNewOrder((order) => {
                if (role === 'vendor') {
                    console.log('🆕 New order received via socket:', order);

                    const newOrderNotification = {
                        _id: `order-${order._id || Date.now()}`,
                        title: '🔔 New Order Received!',
                        body: `Order #${order.orderNumber || order._id?.slice(-6)} · ${order.customerName || 'Customer'} · ${order.deliveryAddress?.address || ''}`,
                        type: 'vendor_new_order',
                        orderId: order._id,
                        url: `/vendors/order/${order._id}`,
                        createdAt: new Date().toISOString(),
                        read: false,
                        customerName: order.customerName,
                        location: order.deliveryAddress?.address
                    };

                    setLatestNotification(newOrderNotification);
                    setUnreadCount(prev => prev + 1);
                    window.dispatchEvent(new CustomEvent('notifications:updated', { detail: newOrderNotification }));

                    // Premium vendor new order toast
                    toast.custom((t) => (
                        <div
                            className={`bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-4 flex items-start gap-4 w-full max-w-sm border-l-4 border-orange-500 cursor-pointer ${t.visible ? 'animate-in slide-in-from-right-full' : 'animate-out fade-out'}`}
                            onClick={() => {
                                window.location.href = `/vendors/order/${order._id}`;
                                toast.dismiss(t.id);
                            }}
                        >
                            <div className="flex-shrink-0 w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-200">
                                🔔
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-sm text-slate-900 dark:text-white uppercase italic tracking-tight">
                                    New Order!
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                                    #{order.orderNumber || order._id?.slice(-6)} · {order.customerName || 'Customer'}
                                </p>
                                <button className="mt-2 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                                    View Order →
                                </button>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
                                className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 text-xs"
                            >
                                ✕
                            </button>
                        </div>
                    ), {
                        duration: 15000,
                        position: 'top-right',
                        id: `new-order-${order._id}`
                    });

                    // Play alert sound
                    try {
                        const audio = new Audio('/sounds/notification.mp3');
                        audio.volume = 0.6;
                        audio.play().catch(() => { });
                    } catch (e) { }
                }
            });

            // Missed notifications handler
            socketService.onMissedNotifications(({ notifications: missed, count }) => {
                const isRelevant = role === 'vendor' || role === 'admin' || role === 'rider' || role === 'user';
                
                if (isRelevant && missed?.length > 0) {
                    missed.forEach(notification => {
                        window.dispatchEvent(new CustomEvent('notifications:updated', { detail: notification }));
                    });
                    setUnreadCount(prev => prev + count);
                    
                    const label = role === 'admin' ? 'logistics alerts' :
                                   role === 'vendor' ? 'vendor updates' :
                                   role === 'rider' ? 'delivery updates' : 'order updates';
                                   
                    toast.success(`${count} missed ${label} received while away.`, { id: 'missed-notifications-summary', duration: 8000 });
                }
            });

            // Admin rider assignment alert
            if (role === 'admin') {
                socketService.socket?.on('rider_assignment_needed', (data) => {
                    console.log('🚨 Rider assignment needed:', data);
                    setRiderAssignmentAlert(data);
                    
                    const alertNotification = {
                        _id: `rider-alert-${data.vendorOrderId || Date.now()}`,
                        title: '🚨 Rider Assignment Required',
                        body: `${data.restaurantName || 'A restaurant'} has an order ready for pickup.`,
                        type: 'rider_assignment_needed',
                        url: `/admin/orders/${data.vendorOrderId}`,
                        createdAt: new Date().toISOString(),
                        read: false,
                        ...data
                    };

                    window.dispatchEvent(new CustomEvent('notifications:updated', { detail: alertNotification }));
                    
                    // High-priority logistics toast
                    toast.custom((t) => (
                        <div
                            className={`bg-white shadow-2xl rounded-2xl p-4 flex items-start gap-4 border-l-4 border-rose-600 cursor-pointer ${t.visible ? 'animate-in slide-in-from-right-full' : 'animate-out fade-out'}`}
                            onClick={() => { window.location.href = `/admin/orders/${data.vendorOrderId}`; toast.dismiss(t.id); }}
                        >
                            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white scale-110 shadow-lg shadow-rose-200">🚨</div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none mb-1">Logistics Emergency</p>
                                <p className="text-xs font-bold text-slate-900 leading-tight">Rider Assignment Needed Now</p>
                                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{data.restaurantName || 'Merchant'} is ready for pickup.</p>
                            </div>
                        </div>
                    ), { id: `logistics-alert-${data.vendorOrderId}`, duration: 30000, position: 'top-right' });
                });
            }

            // Rider assignment event
            const handleAssignment = (data) => {
                if (role === 'rider') {
                    console.log('🛵 Order assigned to rider:', data);
                    const assignmentNotification = {
                        _id: `assign-${Date.now()}`,
                        title: 'New Job Assigned!',
                        body: `You have a new pickup at ${data.vendorName || data.restaurantName || 'the restaurant'}`,
                        type: 'order_assigned',
                        orderId: data.orderId,
                        data: data,
                        createdAt: new Date().toISOString(),
                        read: false
                    };
                    setLatestNotification(assignmentNotification);
                    setUnreadCount(prev => prev + 1);
                    toast.success('New Order Assigned! 🛵', { duration: 8000 });
                    window.dispatchEvent(new CustomEvent('notifications:updated', { detail: assignmentNotification }));
                    window.dispatchEvent(new CustomEvent('rider:new_assignment', { detail: data }));
                }
            };

            socketService.onOrderAssigned(handleAssignment);
            socketService.socket?.on('ORDER_ASSIGNED_TO_RIDER', handleAssignment);
        };

        // Reset and connect
        authFailed.current = false;
        connect();

        const interval = setInterval(() => {
            const status = socketService.getConnectionStatus();
            setIsConnected(status.isConnected);

            if (!status.isConnected && !authFailed.current && TokenManager.getToken(role)) {
                connect();
            }
        }, 10000);

        return () => {
            clearInterval(interval);
            listenersRegistered.current = false;
            socketService.removeAllListeners();
            socketService.disconnect();
        };
    }, [role]);

    const value = {
        isConnected,
        socket: socketService.socket,
        unreadCount,
        latestNotification,
        setUnreadCount,
        refreshUnreadCount: fetchUnreadCount,
        riderAssignmentAlert,
        clearRiderAssignmentAlert: () => setRiderAssignmentAlert(null)
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
