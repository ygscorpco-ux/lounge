"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MIN_SPLASH_MS = 320;
const MAX_SPLASH_MS = 1200;
const EXIT_ANIMATION_MS = 220;

function warmGet(url, signal) {
  return fetch(url, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    signal,
  }).catch(() => null);
}

export default function AppSplashGate() {
  const pathname = usePathname();
  const initialPathRef = useRef(pathname);
  const startedRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (initialPathRef.current !== "/") return;

    let cancelled = false;
    const abortController = new AbortController();
    setVisible(true);

    const preload = Promise.allSettled([
      warmGet("/api/auth/me", abortController.signal),
      warmGet("/api/notifications", abortController.signal),
      warmGet("/api/posts?noticeOnly=1&sort=latest&page=1", abortController.signal),
      warmGet("/api/posts/best", abortController.signal),
      warmGet("/api/posts?page=1&sort=latest&excludeNotice=1", abortController.signal),
    ]);

    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS));
    const maxDelay = new Promise((resolve) => setTimeout(resolve, MAX_SPLASH_MS));

    Promise.race([Promise.all([preload, minDelay]), maxDelay]).then(() => {
      if (cancelled) return;
      setLeaving(true);
      window.setTimeout(() => {
        if (cancelled) return;
        setVisible(false);
      }, EXIT_ANIMATION_MS);
    });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`app-splash ${leaving ? "is-leaving" : ""}`} aria-hidden="true">
      <div className="app-splash-inner">
        <img
          src="/branding/splash-logo.png"
          alt="라운지"
          width="220"
          height="220"
          className="app-splash-logo"
          loading="eager"
          decoding="async"
        />
        <div className="app-splash-loading" role="presentation">
          <span className="app-splash-dot" />
          <span className="app-splash-dot" />
          <span className="app-splash-dot" />
        </div>
      </div>
    </div>
  );
}

