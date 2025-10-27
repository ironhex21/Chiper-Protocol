"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error("[Error Boundary]", error);
  }, [error]);

  // Check if this is a known error to suppress
  const errorMessage = error?.message || String(error);
  const shouldSuppress =
    errorMessage === "[object Object]" ||
    errorMessage.includes("user rejected") ||
    errorMessage.includes("User denied") ||
    errorMessage.includes("ACTION_REJECTED");

  // Don't show error UI for suppressed errors
  if (shouldSuppress) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-md p-8 bg-white rounded-lg shadow-lg border border-red-200">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h2>
        <p className="text-gray-700 mb-4">
          {errorMessage !== "[object Object]" ? errorMessage : "An unexpected error occurred"}
        </p>
        <button
          onClick={reset}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
