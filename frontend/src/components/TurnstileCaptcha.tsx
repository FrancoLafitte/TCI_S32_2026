import { useEffect, useRef, useState } from "react";

type TurnstileOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  appearance: "always";
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => window.turnstile ? resolve() : reject(new Error("Turnstile no está disponible"));
      script.onerror = () => reject(new Error("No se pudo cargar Turnstile"));
      document.head.appendChild(script);
    }).catch((error: unknown) => {
      scriptPromise = null;
      throw error;
    });
  }
  return scriptPromise;
}

export default function TurnstileCaptcha({
  resetKey,
  onToken,
}: {
  resetKey: number;
  onToken: (token: string | null) => void;
}) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let cancelled = false;
    let widgetId: string | undefined;

    if (!siteKey) {
      setError("Falta configurar VITE_TURNSTILE_SITE_KEY para mostrar la verificación.");
      return;
    }

    setError(null);
    void loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          appearance: "always",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => {
            onTokenRef.current(null);
            setError("No se pudo completar la verificación. Intenta nuevamente.");
          },
        });
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la verificación CAPTCHA.");
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [resetKey, siteKey]);

  return (
    <div>
      <div ref={containerRef} />
      {error && <p className="aviso aviso-error" role="alert">{error}</p>}
    </div>
  );
}
