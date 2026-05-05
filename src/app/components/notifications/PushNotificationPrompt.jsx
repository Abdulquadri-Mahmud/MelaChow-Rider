'use client';

import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { Bell, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const PushNotificationPrompt = () => {
    // Determine role from pathname
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const role = pathname.startsWith('/admin') ? 'admin' :
        (pathname.startsWith('/vendors') && !pathname.includes('/auth')) ? 'vendor' :
            (pathname.startsWith('/rider') && !pathname.includes('/auth')) ? 'rider' : 'user';

    const {
        isSupported,
        subscribe,
        shouldShowPrompt,
        dismissPrompt,
        loading,
        error
    } = usePushNotifications(role);

    const [visible, setVisible] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, success, error

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkContext = () => {
            const pathname = window.location.pathname;
            const isOrderRelated = pathname.includes('track-orders') || pathname.includes('verify-payment');
            const isVendorDashboard = pathname.startsWith('/vendors') && !pathname.includes('/auth');
            const isRiderDashboard = pathname.startsWith('/rider') && !pathname.includes('/auth');
            const isAdminDashboard = pathname.startsWith('/admin') && !pathname.includes('/login');
            
            const hasOrdered = localStorage.getItem('has_placed_order') === 'true';
            const isVendor = localStorage.getItem('melachow_vendor_token_v1') !== null || localStorage.getItem('melachow_vendor_cache') !== null;
            const isRider = localStorage.getItem('melachow_rider_token_v1') !== null || localStorage.getItem('melachow_rider_cache') !== null;
            const isAdmin = localStorage.getItem('melachow_admin_token_v1') !== null;

            if (shouldShowPrompt()) {
                // Show immediately (shorter delay) on critical pages
                const delay = (isOrderRelated || isVendorDashboard || isAdminDashboard) ? 1000 : 5000;

                // Show for customers who ordered, any vendor or rider on their dashboard
                if (isOrderRelated || hasOrdered || (isVendorDashboard && isVendor) || (isRiderDashboard && isRider) || (isAdminDashboard && isAdmin)) {
                    const timer = setTimeout(() => setVisible(true), delay);
                    return () => clearTimeout(timer);
                }
            }
        };

        checkContext();
    }, [shouldShowPrompt]);

    const handleSubscribe = async () => {
        setStatus('idle');
        const success = await subscribe();
        if (success) {
            setStatus('success');
            setTimeout(() => setVisible(false), 3000);
        } else {
            setStatus('error');
        }
    };

    const handleDismiss = () => {
        setVisible(false);
        dismissPrompt();
    };

    if (!visible || !isSupported) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-orange-100 dark:border-gray-800 p-5 overflow-hidden relative">
                {/* Background Decoration */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-50 dark:bg-orange-900/10 rounded-full blur-2xl" />

                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                    aria-label="Dismiss"
                >
                    <X size={18} />
                </button>

                <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200 dark:shadow-none">
                        <Bell size={24} className={loading ? "animate-pulse" : ""} />
                    </div>

                    <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        {window.location.pathname.startsWith('/vendors') ? 'Never miss an order!' :
                            window.location.pathname.startsWith('/rider') ? 'Get new delivery jobs!' :
                            window.location.pathname.startsWith('/admin') ? 'System & Logistics Alerts' : 'Stay Updated!'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 leading-relaxed">
                        {window.location.pathname.startsWith('/vendors')
                            ? 'Get instant alerts for new orders and customer updates directly on your device.'
                            : window.location.pathname.startsWith('/rider')
                                ? 'Get real-time push notifications the moment a new delivery job is assigned to you.'
                                : window.location.pathname.startsWith('/admin')
                                    ? 'Monitor deliveries and platform status with real-time mission control alerts.'
                                    : 'Get real-time updates on your order status, delivery, and exclusive offers.'}
                    </p>
                    </div>
                </div>

                <div className="mt-5 flex items-center gap-3">
                    <button
                        onClick={handleSubscribe}
                        disabled={loading || status === 'success'}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${status === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'
                            } disabled:opacity-70`}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Subscribing...
                            </>
                        ) : status === 'success' ? (
                            <>
                                <CheckCircle2 size={16} />
                                Subscribed!
                            </>
                        ) : (
                            'Enable Notifications'
                        )}
                    </button>

                    <button
                        onClick={handleDismiss}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        Later
                    </button>
                </div>

                {error && status === 'error' && (
                    <div className="mt-3 flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PushNotificationPrompt;

