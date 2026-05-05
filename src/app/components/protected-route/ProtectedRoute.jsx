"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const { user, isLoading } = useUserStorage();

  useEffect(() => {
    // Wait for hydration and loading to complete
    if (isLoading) return;

    // If no user after loading is complete, redirect to signin
    if (!user) {
      console.log("🔒 ProtectedRoute: No user found, redirecting to signin");
      router.replace("/auth/signin");
    }
  }, [user, isLoading, router]);

  // While checking auth, show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-500">Verifying authentication...</p>
      </div>
    );
  }

  // If no user, show loading while redirect happens
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-500">Redirecting to signin...</p>
      </div>
    );
  }

  // User is authenticated, render children
  return children;
};

export default ProtectedRoute;
