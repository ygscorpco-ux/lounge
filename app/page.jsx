"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header.jsx";
import PostCard from "../components/PostCard.jsx";
import WriteButton from "../components/WriteButton.jsx";
import {
  HOME_BOOTSTRAP_KEY,
  consumeBootstrapCache,
  getBootstrapPromise,
} from "../lib/app-bootstrap.js";
import { savePostSeed } from "../lib/post-seed.js";

function QuickIcon({ type, accent }) {
  const stroke = accent || "#1b4797";

  const common = {
    width: 42,
    height: 42,
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: "block",
      filter: "drop-shadow(0 2px 2px rgba(16,24,40,0.22))",
    },
  };

  if (type === "home") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="q-home-roof" x1="9" y1="11" x2="39" y2="11" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff7676" />
            <stop offset="1" stopColor="#ff3f3f" />
          </linearGradient>
          <linearGradient id="q-home-body" x1="11" y1="19" x2="35" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f7fbff" />
            <stop offset="1" stopColor="#cbe4ff" />
          </linearGradient>
        </defs>
        <path d="M8 22L24 9L40 22V40H8V22Z" fill="url(#q-home-body)" stroke={stroke} strokeWidth="2.1" />
        <path d="M5.5 22L24 7L42.5 22H5.5Z" fill="url(#q-home-roof)" stroke={stroke} strokeWidth="2.1" />
        <rect x="19.5" y="28" width="9" height="12" rx="1.8" fill="#1b4797" />
        <rect x="12" y="27" width="5.8" height="5.8" rx="1.2" fill="#8be9ff" stroke={stroke} strokeWidth="1.4" />
        <rect x="30.2" y="14.5" width="3.5" height="6.6" rx="1" fill="#ff5656" stroke={stroke} strokeWidth="1.4" />
        <path d="M13 20.8H35.8" stroke="#ffffff" strokeWidth="1.3" opacity="0.8" />
      </svg>
    );
  }

  if (type === "scooter") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="q-scooter-body" x1="14" y1="23" x2="35" y2="23" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff8d4d" />
            <stop offset="1" stopColor="#ff4c4c" />
          </linearGradient>
          <linearGradient id="q-scooter-wheel" x1="11" y1="31" x2="18" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c8f6ff" />
            <stop offset="1" stopColor="#78dff7" />
          </linearGradient>
        </defs>
        <circle cx="14" cy="35" r="5.1" fill="url(#q-scooter-wheel)" stroke={stroke} strokeWidth="2" />
        <circle cx="33.6" cy="35" r="5.1" fill="url(#q-scooter-wheel)" stroke={stroke} strokeWidth="2" />
        <path d="M18 35h9l4.8-10.3H20.9L17.6 19H12" stroke={stroke} strokeWidth="2.3" />
        <path d="M27.5 24.7H35v5.2h-9.5Z" fill="url(#q-scooter-body)" stroke={stroke} strokeWidth="1.8" />
        <rect x="31.4" y="21.5" width="5.8" height="2.5" rx="1.2" fill="#1b4797" />
        <path d="M36.8 24h2.4a2 2 0 0 1 2 2v2.7" stroke={stroke} strokeWidth="2" />
        <circle cx="36.5" cy="27.5" r="1.1" fill="#fff4b0" stroke={stroke} strokeWidth="1.2" />
      </svg>
    );
  }

  if (type === "briefcase") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="q-brief-main" x1="8" y1="18" x2="40" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#87efb1" />
            <stop offset="1" stopColor="#35d985" />
          </linearGradient>
        </defs>
        <rect x="7" y="16" width="34" height="23" rx="4" fill="url(#q-brief-main)" stroke={stroke} strokeWidth="2.1" />
        <path d="M19 16V12.6A2.2 2.2 0 0 1 21.2 10.4h5.6A2.2 2.2 0 0 1 29 12.6V16" stroke={stroke} strokeWidth="2" />
        <path d="M7 25H41" stroke={stroke} strokeWidth="2" />
        <rect x="21.5" y="23.7" width="5" height="3.5" rx="1.2" fill="#1b4797" />
        <path d="M12.2 20.6H19" stroke="#ffffff" strokeWidth="1.3" opacity="0.8" />
      </svg>
    );
  }

  if (type === "calendar") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="q-cal-body" x1="10" y1="13" x2="38" y2="39" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffe995" />
            <stop offset="1" stopColor="#ffc83e" />
          </linearGradient>
        </defs>
        <rect x="9" y="10" width="30" height="29" rx="4" fill="url(#q-cal-body)" stroke={stroke} strokeWidth="2.1" />
        <rect x="9" y="10" width="30" height="8.2" rx="4" fill="#1b4797" />
        <path d="M16.5 7.5V13M31.5 7.5V13" stroke={stroke} strokeWidth="2" />
        <rect x="14" y="22.5" width="6" height="6" rx="1.1" fill="#ff6e6e" stroke={stroke} strokeWidth="1.3" />
        <rect x="23.5" y="22.5" width="6" height="6" rx="1.1" fill="#fff1b6" stroke={stroke} strokeWidth="1.3" />
        <rect x="14" y="31" width="6" height="4.8" rx="1" fill="#fff8db" stroke={stroke} strokeWidth="1.1" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <defs>
        <linearGradient id="q-clip-body" x1="12" y1="11" x2="36" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d2ccff" />
          <stop offset="1" stopColor="#9b8fff" />
        </linearGradient>
      </defs>
      <rect x="12" y="7.5" width="24" height="32" rx="3.5" fill="url(#q-clip-body)" stroke={stroke} strokeWidth="2.1" />
      <rect x="17.5" y="10.3" width="13" height="4.2" rx="1.8" fill="#1b4797" />
      <path d="M17.6 20.4H30.4M17.6 25.5H30.4M17.6 30.6H26.8" stroke="#ffffff" strokeWidth="1.7" />
      <path d="M17.6 18.4H28.2" stroke="#8faeff" strokeWidth="1.2" />
    </svg>
  );
}

function formatBestDate(dateString) {
  const date = new Date(dateString);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

const BestUserAvatar = () => (
  <div
    style={{
      width: 34,
      height: 34,
      borderRadius: 10,
      background: "#f2f4f7",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#b6bec7">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  </div>
);

const BestLikeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#e5483b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-1 5-3 4v9h11.1a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3H14z" />
    <path d="M7 21H3a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h4" />
  </svg>
);

const BestCommentIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#4bb8be" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

function NoticeSectionSkeleton() {
  return (
    <div style={{ border: "1px solid #eceff4", borderRadius: "14px", overflow: "hidden", background: "#fff" }}>
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          style={{
            padding: "12px 14px",
            borderBottom: index === 1 ? "none" : "1px solid #f1f3f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="app-skeleton" style={{ width: 36, height: 20, borderRadius: 999 }} />
            <div className="app-skeleton" style={{ flex: 1, height: 14, borderRadius: 8 }} />
            <div className="app-skeleton" style={{ width: 38, height: 12, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function BestPostSkeleton() {
  return (
    <div
      className="app-skeleton"
      style={{
        borderRadius: "20px",
        height: 148,
        border: "1px solid #e6eaf0",
      }}
    />
  );
}

function FeedPostSkeleton() {
  return (
    <div
      style={{
        borderBottom: "1px solid #ececec",
        background: "#fff",
        padding: "14px 16px",
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="app-skeleton" style={{ width: "74%", height: 18, borderRadius: 8, marginBottom: "10px" }} />
          <div className="app-skeleton" style={{ width: "100%", height: 13, borderRadius: 8, marginBottom: "7px" }} />
          <div className="app-skeleton" style={{ width: "88%", height: 13, borderRadius: 8, marginBottom: "10px" }} />
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div className="app-skeleton" style={{ width: 34, height: 12, borderRadius: 999 }} />
            <div className="app-skeleton" style={{ width: 38, height: 12, borderRadius: 999 }} />
            <div className="app-skeleton" style={{ width: 46, height: 12, borderRadius: 999 }} />
          </div>
        </div>
        <div className="app-skeleton" style={{ width: 84, height: 84, borderRadius: 12, flexShrink: 0 }} />
      </div>
    </div>
  );
}

const FEED_CACHE_KEY = "lounge-home-feed-cache-v3";
const FEED_RETURN_KEY = "lounge-home-feed-return-v2";
const FEED_SCROLL_KEY = "lounge-home-feed-scroll-v2";
const FEED_CACHE_TTL_MS = 1000 * 60 * 30;
const APP_SCROLL_CONTAINER_SELECTOR = '[data-app-scroll-container="1"]';
const POST_ROW_ESTIMATE_PX = 144;
const POST_WINDOW_OVERSCAN = 7;
const VIRTUALIZATION_THRESHOLD = 28;

function getAppScrollContainer() {
  if (typeof document === "undefined") return null;
  return document.querySelector(APP_SCROLL_CONTAINER_SELECTOR);
}

function getAppScrollTop() {
  const container = getAppScrollContainer();
  return container ? container.scrollTop : window.scrollY || 0;
}

function setAppScrollTop(top) {
  const container = getAppScrollContainer();
  if (container) {
    container.scrollTo({ top, behavior: "auto" });
    return;
  }
  window.scrollTo({ top, behavior: "auto" });
}

function getAppMaxScrollTop() {
  const container = getAppScrollContainer();
  if (container) {
    return Math.max(container.scrollHeight - container.clientHeight, 0);
  }
  return Math.max(document.body.scrollHeight - window.innerHeight, 0);
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [noticePosts, setNoticePosts] = useState([]);
  const [bestPosts, setBestPosts] = useState([]);
  const [sort, setSort] = useState("latest");
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const loadMoreTriggerRef = useRef(null);
  const freeBoardListRef = useRef(null);
  const feedHydratedRef = useRef(false);
  const shouldRestoreScrollRef = useRef(false);
  const expectedSectionsRef = useRef({ notice: 0, best: 0 });
  const nextCursorRef = useRef(null);
  const loadingNextPageRef = useRef(false);
  const [virtualRange, setVirtualRange] = useState({ start: 0, end: 20 });

  const quickMenus = [
    {
      label: "\uC5FC\uAD11\uC0AC \uD648",
      url: "https://www.\uC5FC\uAD11\uC0AC.com",
      external: true,
      type: "home",
    },
    {
      label: "\uB9C8\uC9C4\uACC4\uC0B0\uAE30",
      url: "/tools/delivery-margin",
      external: false,
      type: "scooter",
    },
    {
      label: "\uC778\uAC74\uBE44\uACC4\uC0B0",
      url: "/tools/labor-cost",
      external: false,
      type: "briefcase",
    },
    {
      label: "\uC9C0\uC6D0\uAE08\uC77C\uC815",
      url: "/tools/subsidy-calendar",
      external: false,
      type: "calendar",
    },
    {
      label: "\uC54C\uBC14\uAD00\uB9AC",
      url: "/tools/worker-scheduler",
      external: false,
      type: "clipboard",
    },
  ];

  const openPostDetail = useCallback((postId) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(FEED_RETURN_KEY, "1");
      sessionStorage.setItem(FEED_SCROLL_KEY, String(getAppScrollTop()));
      try {
        sessionStorage.setItem(
          FEED_CACHE_KEY,
          JSON.stringify({
            posts,
            noticePosts,
            bestPosts,
            nextCursor,
            hasMore,
            sort,
            savedAt: Date.now(),
          }),
        );
      } catch (error) {
        console.error(error);
      }
    }

    const sourcePost =
      posts.find((item) => Number(item?.id) === Number(postId))
      || noticePosts.find((item) => Number(item?.id) === Number(postId))
      || bestPosts.find((item) => Number(item?.id) === Number(postId));
    if (sourcePost) {
      savePostSeed(sourcePost);
    }

    router.push("/post/" + postId + "?from=home", { scroll: false });
  }, [router, posts, noticePosts, bestPosts, nextCursor, hasMore, sort]);

  const mergeUniquePosts = useCallback((prev, incoming) => {
    const merged = [...prev, ...incoming];
    const deduped = [];
    const seen = new Set();
    for (const item of merged) {
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      deduped.push(item);
    }
    return deduped;
  }, []);

  const applyHomeFeedData = useCallback((data) => {
    const incomingPosts = Array.isArray(data?.posts) ? data.posts : [];
    const incomingNotices = Array.isArray(data?.noticePosts) ? data.noticePosts : [];
    const incomingBest = Array.isArray(data?.bestPosts) ? data.bestPosts : [];
    const incomingCursor = typeof data?.nextCursor === "string" ? data.nextCursor : null;

    setPosts(incomingPosts);
    setNoticePosts(incomingNotices);
    setBestPosts(incomingBest);
    setNextCursor(incomingCursor);
    nextCursorRef.current = incomingCursor;
    setHasMore(Boolean(incomingCursor));
    setLoading(false);
    return data;
  }, []);

  const fetchHomeFeed = useCallback(async (s) => {
    setLoading(true);
    try {
      const url = "/api/home/feed?sort=" + encodeURIComponent(s || "latest");
      const res = await fetch(url);
      if (!res.ok) {
        return {
          posts: [],
          noticePosts: [],
          bestPosts: [],
          pageSize: 0,
          nextCursor: null,
        };
      }
      const data = await res.json();
      return applyHomeFeedData(data);
    } catch (err) {
      console.error(err);
      return {
        posts: [],
        noticePosts: [],
        bestPosts: [],
        pageSize: 0,
        nextCursor: null,
      };
    } finally {
      setLoading(false);
    }
  }, [applyHomeFeedData]);

  const hydrateFromBootstrap = useCallback(async (s) => {
    if (s !== "latest" || typeof window === "undefined") return false;

    const cached = consumeBootstrapCache(HOME_BOOTSTRAP_KEY);
    if (cached && Array.isArray(cached.posts)) {
      applyHomeFeedData(cached);
      return true;
    }

    const bootstrapPromise = getBootstrapPromise();
    if (!bootstrapPromise) return false;

    try {
      const snapshot = await bootstrapPromise;
      const nextCached =
        snapshot?.homeFeed && Array.isArray(snapshot.homeFeed.posts)
          ? snapshot.homeFeed
          : consumeBootstrapCache(HOME_BOOTSTRAP_KEY);

      if (!nextCached || !Array.isArray(nextCached.posts)) {
        return false;
      }

      applyHomeFeedData(nextCached);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }, [applyHomeFeedData]);

  const fetchPosts = useCallback(async (cursor, s) => {
    if (!cursor) return { posts: [], nextCursor: null, pageSize: 0 };
    setLoading(true);
    try {
      const url =
        "/api/posts?sort=" +
        encodeURIComponent(s || "latest") +
        "&excludeNotice=1&cursor=" +
        encodeURIComponent(cursor);
      const res = await fetch(url);
      if (!res.ok) {
        return { posts: [], nextCursor: null, pageSize: 0 };
      }
      const data = await res.json();
      const incomingPosts = Array.isArray(data.posts) ? data.posts : [];
      const incomingCursor = typeof data.nextCursor === "string" ? data.nextCursor : null;
      setPosts((prev) => mergeUniquePosts(prev, incomingPosts));
      setNextCursor(incomingCursor);
      nextCursorRef.current = incomingCursor;
      setHasMore(Boolean(incomingCursor));
      return data;
    } catch (e) {
      console.error(e);
      return { posts: [], nextCursor: null, pageSize: 0 };
    } finally {
      setLoading(false);
    }
  }, [mergeUniquePosts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const shouldRestore = sessionStorage.getItem(FEED_RETURN_KEY) === "1";
      const cachedRaw = sessionStorage.getItem(FEED_CACHE_KEY);
      if (!shouldRestore || !cachedRaw) return;

      const cached = JSON.parse(cachedRaw);
      const isFresh = Date.now() - Number(cached.savedAt || 0) <= FEED_CACHE_TTL_MS;
      if (!isFresh || !Array.isArray(cached.posts) || cached.posts.length === 0) return;

      const restoredSort = typeof cached.sort === "string" ? cached.sort : "latest";
      const restoredHasMore = Boolean(cached.hasMore);
      const restoredCursor =
        typeof cached.nextCursor === "string" ? cached.nextCursor : null;
      const restoredNoticePosts = Array.isArray(cached.noticePosts) ? cached.noticePosts : [];
      const restoredBestPosts = Array.isArray(cached.bestPosts) ? cached.bestPosts : [];

      feedHydratedRef.current = true;
      shouldRestoreScrollRef.current = true;
      expectedSectionsRef.current = {
        notice: restoredNoticePosts.length,
        best: restoredBestPosts.length,
      };
      setPosts(cached.posts);
      setNoticePosts(restoredNoticePosts);
      setBestPosts(restoredBestPosts);
      setNextCursor(restoredCursor);
      nextCursorRef.current = restoredCursor;
      setSort(restoredSort);
      setHasMore(restoredHasMore);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (!shouldRestoreScrollRef.current || posts.length === 0) return;
    if (typeof window === "undefined") return;
    const expected = expectedSectionsRef.current;
    if (noticePosts.length < expected.notice || bestPosts.length < expected.best) return;

    const targetY = Number(sessionStorage.getItem(FEED_SCROLL_KEY) || "0");
    const safeY = Number.isFinite(targetY) ? targetY : 0;
    let tries = 0;

    const restore = () => {
      setAppScrollTop(safeY);
      const maxY = getAppMaxScrollTop();
      const nearTarget = Math.abs(getAppScrollTop() - safeY) < 2;
      const cannotReachMore = maxY <= safeY;

      if (nearTarget || cannotReachMore || tries >= 6) {
        shouldRestoreScrollRef.current = false;
        sessionStorage.removeItem(FEED_RETURN_KEY);
        return;
      }

      tries += 1;
      window.setTimeout(restore, 50);
    };

    window.requestAnimationFrame(restore);
  }, [posts, noticePosts, bestPosts]);

  useEffect(() => {
    if (typeof window === "undefined" || posts.length === 0) return;
    try {
      sessionStorage.setItem(
          FEED_CACHE_KEY,
          JSON.stringify({
            posts,
            noticePosts,
            bestPosts,
            nextCursor,
            hasMore,
            sort,
            savedAt: Date.now(),
          }),
      );
    } catch (error) {
      console.error(error);
    }
  }, [posts, noticePosts, bestPosts, nextCursor, hasMore, sort]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!loading) {
      sessionStorage.removeItem(FEED_RETURN_KEY);
    }
  }, [loading]);

  useEffect(() => {
    if (feedHydratedRef.current) {
      feedHydratedRef.current = false;
      return;
    }

    let cancelled = false;

    async function hydrateFeed() {
      const usedBootstrap = await hydrateFromBootstrap(sort);
      if (cancelled || usedBootstrap) return;
      fetchHomeFeed(sort);
    }

    hydrateFeed();
    return () => {
      cancelled = true;
    };
  }, [sort, fetchHomeFeed, hydrateFromBootstrap]);

  const loadMore = useCallback(async () => {
    if (loadingNextPageRef.current || loading || !hasMore) return;
    const cursor = nextCursorRef.current;
    if (!cursor) {
      setHasMore(false);
      return;
    }
    loadingNextPageRef.current = true;

    try {
      await fetchPosts(cursor, sort);
    } finally {
      loadingNextPageRef.current = false;
    }
  }, [loading, hasMore, sort, fetchPosts]);

  const refreshVirtualRange = useCallback(() => {
    const total = posts.length;
    if (total === 0) {
      setVirtualRange((prev) => (prev.start === 0 && prev.end === 0 ? prev : { start: 0, end: 0 }));
      return;
    }

    if (total <= VIRTUALIZATION_THRESHOLD) {
      setVirtualRange((prev) =>
        prev.start === 0 && prev.end === total ? prev : { start: 0, end: total },
      );
      return;
    }

    const container = getAppScrollContainer();
    const viewportHeight = container ? container.clientHeight : window.innerHeight;
    const scrollTop = container ? container.scrollTop : window.scrollY || 0;
    const listTop = freeBoardListRef.current?.offsetTop || 0;
    const localTop = Math.max(scrollTop - listTop, 0);
    const start = Math.max(
      Math.floor(localTop / POST_ROW_ESTIMATE_PX) - POST_WINDOW_OVERSCAN,
      0,
    );
    const visibleCount =
      Math.ceil(viewportHeight / POST_ROW_ESTIMATE_PX) + POST_WINDOW_OVERSCAN * 2;
    const end = Math.min(total, start + Math.max(visibleCount, 1));

    setVirtualRange((prev) => {
      if (prev.start === start && prev.end === end) return prev;
      return { start, end };
    });
  }, [posts.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    refreshVirtualRange();

    const container = getAppScrollContainer();
    const target = container || window;
    const onScrollOrResize = () => {
      refreshVirtualRange();
    };

    target.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      target.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [refreshVirtualRange]);

  useEffect(() => {
    if (!loadMoreTriggerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { root: getAppScrollContainer(), rootMargin: "260px 0px", threshold: 0 },
    );

    observer.observe(loadMoreTriggerRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const shouldVirtualize = posts.length > VIRTUALIZATION_THRESHOLD;
  const safeStart = shouldVirtualize
    ? Math.max(0, Math.min(virtualRange.start, posts.length))
    : 0;
  const safeEnd = shouldVirtualize
    ? Math.max(safeStart, Math.min(virtualRange.end, posts.length))
    : posts.length;
  const renderedPosts = shouldVirtualize ? posts.slice(safeStart, safeEnd) : posts;
  const topSpacerHeight = shouldVirtualize ? safeStart * POST_ROW_ESTIMATE_PX : 0;
  const bottomSpacerHeight = shouldVirtualize
    ? Math.max((posts.length - safeEnd) * POST_ROW_ESTIMATE_PX, 0)
    : 0;
  const initialLoading =
    loading
    && posts.length === 0
    && noticePosts.length === 0
    && bestPosts.length === 0;

  return (
    <div>
      <Header />

      <div
        className="banner-scroll"
        style={{
          padding: "12px 16px",
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <div
          onClick={() => router.push("/notice")}
          style={{
            minWidth: "220px",
            background: "linear-gradient(135deg, #1b4797 0%, #3d7bd8 100%)",
            borderRadius: "14px",
            padding: "18px",
            color: "white",
            flex: "0 0 auto",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "12px", opacity: 0.85, marginBottom: "8px", fontWeight: 600 }}>
            {"\uACF5\uC9C0\uC0AC\uD56D"}
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>
            {"\uB77C\uC6B4\uC9C0 \uC5C5\uB370\uC774\uD2B8 \uBC0F \uC6B4\uC601 \uC18C\uC2DD\uC744"}
            <br />
            {"\uAC00\uC7A5 \uBA3C\uC800 \uD655\uC778\uD574\uBCF4\uC138\uC694"}
          </div>
          <div style={{ fontSize: "11px", opacity: 0.72, marginTop: "10px" }}>
            {"\uC810\uAC80 \uC548\uB0B4\u00B7\uAE30\uB2A5 \uCD94\uAC00\u00B7\uD589\uC0AC \uC18C\uC2DD"}
          </div>
        </div>

        <div
          style={{
            minWidth: "220px",
            background: "linear-gradient(135deg, #ff6f91 0%, #ff9671 100%)",
            borderRadius: "14px",
            padding: "18px",
            color: "white",
            flex: "0 0 auto",
          }}
        >
          <div style={{ fontSize: "12px", opacity: 0.85, marginBottom: "8px", fontWeight: 600 }}>
            {"\uC774\uBCA4\uD2B8"}
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>
            {"\uC0AC\uC7A5\uB2D8 \uB3C4\uAD6C \uD65C\uC6A9 \uD6C4\uAE30 \uACF5\uC720\uD558\uACE0"}
            <br />
            {"\uCD94\uAC00 \uD3EC\uC778\uD2B8\uB97C \uBC1B\uC544\uBCF4\uC138\uC694"}
          </div>
          <div style={{ fontSize: "11px", opacity: 0.72, marginTop: "10px" }}>
            {"\uB9E4\uC8FC 1\uBA85 \uC120\uC815 \u00B7 \uACF5\uC9C0\uC5D0\uC11C \uC138\uBD80 \uC548\uB0B4"}
          </div>
        </div>
      </div>

      <div style={{ padding: "6px 12px 16px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            border: "1px solid #e9ecef",
            padding: "14px 10px 12px",
            boxShadow: "0 4px 14px rgba(27,71,151,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              gap: "6px",
            }}
          >
            {quickMenus.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  textDecoration: "none",
                  minWidth: "66px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "46px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <QuickIcon type={item.type} accent="#1b4797" />
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#2f3f58",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.1px",
                  }}
                >
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="section-divider" />
      <div style={{ padding: "16px 16px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#1a1a1a" }}>
            {"\uACF5\uC9C0\uC0AC\uD56D"}
          </div>
          <button
            onClick={() => router.push("/notice")}
            style={{
              border: "none",
              background: "none",
              color: "#1b4797",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {"\uC804\uCCB4\uBCF4\uAE30"}
          </button>
        </div>

        {initialLoading ? (
          <NoticeSectionSkeleton />
        ) : (
          <div
            style={{
              border: "1px solid #eceff4",
              borderRadius: "14px",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {noticePosts.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  fontSize: "13px",
                  color: "#8b94a1",
                }}
              >
                {"\uB4F1\uB85D\uB41C \uACF5\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
              </div>
            ) : (
              noticePosts.map((post, index) => (
                <button
                  key={post.id}
                  onClick={() => openPostDetail(post.id)}
                  style={{
                    width: "100%",
                    border: "none",
                    borderBottom:
                      index === noticePosts.length - 1 ? "none" : "1px solid #f1f3f6",
                    background: "none",
                    textAlign: "left",
                    padding: "12px 14px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#fff",
                        background: "#ff5f5f",
                        borderRadius: "999px",
                        padding: "2px 6px",
                        flexShrink: 0,
                      }}
                    >
                      {"\uACF5\uC9C0"}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#1f2430",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {post.title}
                    </span>
                    <span style={{ fontSize: "12px", color: "#9aa3af", flexShrink: 0 }}>
                      {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {(initialLoading || bestPosts.length > 0) && (
        <>
          <div className="section-divider" />
          <div
            style={{
              padding: "16px 16px 12px",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                fontSize: "18px",
              fontWeight: 800,
              color: "#1a1a1a",
              marginBottom: "12px",
            }}
          >
            {"\uC2E4\uC2DC\uAC04 \uC778\uAE30 \uAE00"}
          </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {initialLoading
                ? Array.from({ length: 2 }).map((_, index) => <BestPostSkeleton key={index} />)
                : bestPosts.slice(0, 2).map((post) => (
                    <article
                      key={post.id}
                      onClick={() => openPostDetail(post.id)}
                      style={{
                        background: "#ffffff",
                        borderRadius: "20px",
                        padding: "14px 14px 13px",
                        cursor: "pointer",
                        border: "1px solid #e6eaf0",
                        boxShadow: "0 2px 7px rgba(15,23,42,0.06)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                          <BestUserAvatar />
                          <span style={{ fontSize: "16px", fontWeight: 800, color: "#23262d" }}>
                            {post.author || "\uC775\uBA85"}
                          </span>
                        </div>
                        <span style={{ fontSize: "13px", color: "#a6acb4", fontWeight: 500 }}>
                          {formatBestDate(post.createdAt)}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: 800,
                          color: "#1f232a",
                          lineHeight: 1.35,
                          marginBottom: "3px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {post.title}
                      </div>

                      <div
                        style={{
                          fontSize: "16px",
                          color: "#39404a",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.content}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "10px",
                        }}
                      >
                        <span style={{ fontSize: "13px", color: "#8f9aa8" }}>
                          {"\uC790\uC720\uAC8C\uC2DC\uD310"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#e5483b", fontSize: "14px", fontWeight: 700 }}>
                            <BestLikeIcon />
                            {post.likeCount}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#4bb8be", fontSize: "14px", fontWeight: 700 }}>
                            <BestCommentIcon />
                            {post.commentCount}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
            </div>
          </div>
        </>
      )}

      <div className="section-divider" />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>
          {"\uC790\uC720\uAC8C\uC2DC\uD310"}
        </span>
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="latest">{"\uCD5C\uC2E0\uC21C"}</option>
          <option value="likes">{"\uCD94\uCC9C\uC21C"}</option>
          <option value="comments">{"\uB313\uAE00\uC21C"}</option>
        </select>
      </div>

      <div>
        <div ref={freeBoardListRef} data-testid="free-board-list">
          {initialLoading ? (
            Array.from({ length: 4 }).map((_, index) => <FeedPostSkeleton key={index} />)
          ) : (
            <>
              {topSpacerHeight > 0 && <div style={{ height: topSpacerHeight }} />}
              {renderedPosts.map((post) => (
                <PostCard key={post.id} post={post} onOpen={openPostDetail} />
              ))}
              {bottomSpacerHeight > 0 && <div style={{ height: bottomSpacerHeight }} />}
            </>
          )}
        </div>
        <div ref={loadMoreTriggerRef} style={{ height: 1 }} />
        {loading && !initialLoading && <div className="loading">{"\uBD88\uB7EC\uC624\uB294 \uC911..."}</div>}
        {!loading && posts.length === 0 && (
          <div className="empty">{"\uC544\uC9C1 \uAC8C\uC2DC\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}</div>
        )}
      </div>
      <WriteButton />
    </div>
  );
}
