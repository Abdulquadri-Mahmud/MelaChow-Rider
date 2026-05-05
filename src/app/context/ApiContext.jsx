"use client";
import React, { createContext, useContext } from "react";

const ApiContext = createContext({ baseUrl: "" });

export const ApiProvider = ({ children }) => {
  // Use relative path to leverage Next.js rewrites (Proxy)
  // This ensures cookies are treated as First-Party (fixes iOS Safari issues)
  const baseUrl = "/api";
  // const baseUrl = "https://grubdash-api.onrender.com/api";
  // const baseUrl = "http://localhost:3001/api";

  // ✅ Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[ApiContext] Initialized with baseUrl:', baseUrl);
    console.log('[ApiContext] All API requests will proxy through:', baseUrl);
    console.log('[ApiContext] Route namespacing: /user/*, /vendors/*, /admin/*');
  }

  return (
    <ApiContext.Provider value={{ baseUrl }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};

