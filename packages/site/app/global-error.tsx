"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Check if this is a known error to suppress
  const errorMessage = error?.message || String(error);
  const shouldSuppress =
    errorMessage === "[object Object]" ||
    errorMessage.includes("user rejected") ||
    errorMessage.includes("User denied") ||
    errorMessage.includes("ACTION_REJECTED") ||
    !errorMessage ||
    errorMessage === "undefined";

  // Don't show error UI for suppressed errors
  if (shouldSuppress) {
    console.log("[Global Error Boundary] Suppressing known error:", errorMessage);
    return (
      <html>
        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `window.location.reload()`,
            }}
          />
        </body>
      </html>
    );
  }

  return (
    <html>
      <body>
        <div style={{ 
          display: "flex", 
          minHeight: "100vh", 
          alignItems: "center", 
          justifyContent: "center",
          background: "linear-gradient(to bottom right, #faf5ff, #ffffff, #eff6ff)"
        }}>
          <div style={{
            maxWidth: "28rem",
            padding: "2rem",
            background: "white",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            border: "1px solid #fecaca"
          }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#dc2626", marginBottom: "1rem" }}>
              Something went wrong!
            </h2>
            <p style={{ color: "#374151", marginBottom: "1rem" }}>
              {errorMessage !== "[object Object]" ? errorMessage : "An unexpected error occurred"}
            </p>
            <button
              onClick={reset}
              style={{
                width: "100%",
                padding: "0.5rem 1rem",
                background: "#9333ea",
                color: "white",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer"
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
