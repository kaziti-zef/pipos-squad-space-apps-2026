"use client";

/**
 * Erreur dans la mise en page racine : remplace tout le document, sans styles globaux ni dictionnaire
 * (guide Next.js « error.js », global-error). Message bilingue et styles en ligne.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: string }).digest ?? "") : "";
  return (
    <html lang="fr">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5EFE6", fontFamily: "system-ui, sans-serif", color: "#17251C" }}>
        <title>AgriRot</title>
        <div role="alert" style={{ maxWidth: 460, margin: 16, padding: 32, background: "#fff", borderRadius: 20, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, margin: "0 0 12px" }}>Un problème est survenu</h1>
          <p lang="en" style={{ margin: "0 0 20px", color: "#3B4A40" }}>Something went wrong.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ minHeight: 48, padding: "0 24px", border: 0, borderRadius: 999, background: "#14532D", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
          >
            Réessayer · Try again
          </button>
          {digest && <p style={{ marginTop: 16, fontSize: 14, color: "#55645A" }}>Code : {digest}</p>}
        </div>
      </body>
    </html>
  );
}
