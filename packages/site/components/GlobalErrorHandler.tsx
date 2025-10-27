"use client";

import { useEffect } from "react";

/**
 * Global error handler to catch unhandled promise rejections
 * and prevent "[object Object]" errors from showing to users
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // IMMEDIATELY suppress [object Object] errors before React hydration
    const immediateHandler = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Aggressively suppress common noise
      if (
        !error ||
        error === "[object Object]" ||
        (typeof error === "object" && Object.keys(error).length === 0) ||
        error?.code === "ACTION_REJECTED" ||
        error?.code === 4001 ||
        error?.message?.includes("user rejected") ||
        error?.message?.includes("User denied")
      ) {
        event.preventDefault();
        return;
      }
    };
    
    // Add immediate handler first
    window.addEventListener("unhandledrejection", immediateHandler);
    
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Extract meaningful error message
      let errorMessage = "Unknown error";
      let errorCode = null;
      
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.code) {
        errorCode = error.code;
        errorMessage = error.message || `Error code: ${error.code}`;
        
        // Check if this is a user rejection (ACTION_REJECTED or 4001)
        if (error.code === "ACTION_REJECTED" || error.code === 4001) {
          console.log("[GlobalErrorHandler] User rejected transaction (normal)");
          event.preventDefault(); // Suppress overlay for user rejection
          return;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.reason) {
        errorMessage = error.reason;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.info?.error?.message) {
        errorMessage = error.info.error.message;
      } else if (error && typeof error === "object") {
        // Try to extract any useful info from object
        const keys = Object.keys(error);
        if (keys.length === 0) {
          errorMessage = "Empty error object";
        } else {
          try {
            errorMessage = JSON.stringify(error);
          } catch {
            errorMessage = `Error object with keys: ${keys.join(", ")}`;
          }
        }
      }
      
      // Check if this is a known issue to suppress
      const shouldSuppress = 
        errorMessage.includes("missing revert data") ||
        errorMessage.includes("CALL_EXCEPTION") ||
        errorMessage.includes("ACL permission") ||
        errorMessage.includes("Internal JSON-RPC error") ||
        errorMessage.includes("user rejected") ||
        errorMessage.includes("User denied") ||
        errorMessage === "Empty error object" ||
        errorCode === "ACTION_REJECTED" ||
        errorCode === 4001;
      
      if (shouldSuppress) {
        console.log("[GlobalErrorHandler] Suppressing known issue:", errorMessage);
        event.preventDefault();
      } else {
        // Log meaningful errors
        console.error("[GlobalErrorHandler] Unhandled promise rejection:", errorMessage);
      }
    };

    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      // Prevent "[object Object]" from showing
      if (event.message === "[object Object]") {
        console.warn("[GlobalErrorHandler] Suppressing [object Object] error");
        event.preventDefault();
        return;
      }
      
      // Check if this is a user rejection error
      const error = event.error;
      if (error?.code === "ACTION_REJECTED" || error?.code === 4001) {
        console.log("[GlobalErrorHandler] Suppressing user rejection in global error");
        event.preventDefault();
        return;
      }
      
      console.error("[GlobalErrorHandler] Global error:", event.error);
    };

    // Add event listeners (note: immediateHandler already added above)
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    // Cleanup
    return () => {
      window.removeEventListener("unhandledrejection", immediateHandler);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null; // This component doesn't render anything
}
