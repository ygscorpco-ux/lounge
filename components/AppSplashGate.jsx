"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  HOME_BOOTSTRAP_KEY,
  NOTIFICATIONS_BOOTSTRAP_KEY,
  setBootstrapPromise,
  writeBootstrapCache,
} from "../lib/app-bootstrap.js";

const MIN_SPLASH_MS = 420;
const MAX_SPLASH_MS = 1800;
const EXIT_ANIMATION_MS = 220;

async function warmJson(url, signal) {
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      signal,
    });
    if (!response.ok) return null;
    return await response.json().catch(() => null);
  } catch (error) {
    return null;
  }
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

    const preload = (async () => {
      const [auth, homeFeed, notifications] = await Promise.allSettled([
        warmJson("/api/auth/me", abortController.signal),
        warmJson("/api/home/feed?sort=latest", abortController.signal),
        warmJson("/api/notifications", abortController.signal),
      ]);

      const snapshot = {
        auth: auth.status === "fulfilled" ? auth.value : null,
        homeFeed: homeFeed.status === "fulfilled" ? homeFeed.value : null,
        notifications:
          notifications.status === "fulfilled" ? notifications.value : null,
      };

      if (snapshot.homeFeed) {
        writeBootstrapCache(HOME_BOOTSTRAP_KEY, snapshot.homeFeed);
      }

      if (snapshot.notifications) {
        writeBootstrapCache(
          NOTIFICATIONS_BOOTSTRAP_KEY,
          snapshot.notifications,
        );
      }

      return snapshot;
    })();

    setBootstrapPromise(preload);

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
