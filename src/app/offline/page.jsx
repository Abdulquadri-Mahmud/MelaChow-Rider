"use client";

import { WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Offline Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 rounded-full mb-6 relative">
                        <div className="absolute inset-0 bg-orange-500/10 rounded-full animate-ping"></div>
                        <WifiOff size={48} className="text-orange-600 relative z-10" />
                    </div>

                    <h1 className="text-3xl font-black text-gray-900 mb-3">
                        You're Offline
                    </h1>
                    <p className="text-gray-600 text-lg">
                        It looks like you've lost your internet connection
                    </p>
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        What you can do:
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-orange-600 font-bold">•</span>
                            <span>Check your WiFi or mobile data connection</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-orange-600 font-bold">•</span>
                            <span>Make sure airplane mode is turned off</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-orange-600 font-bold">•</span>
                            <span>Try moving to an area with better signal</span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-700 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={20} />
                        Try Again
                    </button>

                    <Link
                        href="/"
                        className="w-full bg-white border-2 border-gray-200 text-gray-900 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Home size={20} />
                        Go to Home
                    </Link>
                </div>

                {/* Footer Note */}
                <p className="text-center text-xs text-gray-500 mt-8">
                    Some features may be available offline if you've used them before
                </p>
            </div>
        </div>
    );
}
