"use client";

import { useEffect } from "react";
import { isChunkLoadError, recoverFromChunkLoadError } from "@/app/lib/chunkRecovery";

export default function ChunkLoadRecovery() {
  useEffect(() => {
    const handleError = (event) => {
      if (isChunkLoadError(event.error || event.message)) recoverFromChunkLoadError();
    };

    const handleUnhandledRejection = (event) => {
      if (isChunkLoadError(event.reason)) recoverFromChunkLoadError();
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
