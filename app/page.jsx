"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header.jsx";
import PostCard from "../components/PostCard.jsx";
import WriteButton from "../components/WriteButton.jsx";

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

const FEED_CACHE_KEY = "lounge-home-feed-cache-v1";
const FEED_RETURN_KEY = "lounge-home-feed-return-v1";
const FEED_SCROLL_KEY = "lounge-home-feed-scroll-v1";
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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const loadMoreTriggerRef = useRef(null);
  const freeBoardListRef = useRef(null);
  const feedHydratedRef = useRef(false);
  const shouldRestoreScrollRef = useRef(false);
  const expectedSectionsRef = useRef({ notice: 0, best: 0 });
  const pageRef = useRef(1);
  const loadingNextPageRef = useRef(false);
  const [virtualRange, setVirtualRange] = useState({ start: 0, end: 20 });

  const quickMenus = [
    {
      label: "\uC5FC\uAD11\uC0AC \uD648",
      url: "https://www.\uC5FC\uAD11\uC0AC.com",
      external: true,
      icon: "/icons/quick/home.webp",
    },
    {
      label: "\uB9C8\uC9C4\uACC4\uC0B0\uAE30",
      url: "/tools/delivery-margin",
      external: false,
      icon: "/icons/quick/scooter.webp",
    },
    {
      label: "\uC778\uAC74\uBE44\uACC4\uC0B0",
      url: "/tools/labor-cost",
      external: false,
      icon: "/icons/quick/briefcase.webp",
    },
    {
      label: "\uC9C0\uC6D0\uAE08\uC77C\uC815",
      url: "/tools/subsidy-calendar",
      external: false,
      icon: "/icons/quick/calendar.webp",
    },
    {
      label: "\uC54C\uBC14\uAD00\uB9AC",
      url: "/tools/worker-scheduler",
      external: false,
      icon: "/icons/quick/clipboard.webp",
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
            page,
            hasMore,
            sort,
            savedAt: Date.now(),
          }),
        );
      } catch (error) {
        console.error(error);
      }
    }
    router.push("/post/" + postId + "?from=home", { scroll: false });
  }, [router, posts, noticePosts, bestPosts, page, hasMore, sort]);

  const fetchPosts = useCallback(async (p, s, reset) => {
    setLoading(true);
    try {
      const url =
        "/api/posts?page=" +
        p +
        "&sort=" +
        s +
        "&excludeNotice=1&t=" +
        Date.now();
      const res = await fetch(url);
      const data = await res.json();
      if (reset) {
        setPosts(data.posts || []);
      } else {
        setPosts((prev) => {
          const incoming = data.posts || [];
          const merged = [...prev, ...incoming];
          const deduped = [];
          const seen = new Set();
          for (const item of merged) {
            if (!item || seen.has(item.id)) continue;
            seen.add(item.id);
            deduped.push(item);
          }
          return deduped;
        });
      }
      setHasMore((data.posts || []).length >= data.pageSize);
      return data;
    } catch (err) {
      console.error(err);
      return { posts: [], pageSize: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotices = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/posts?noticeOnly=1&sort=latest&page=1&t=" + Date.now(),
      );
      if (!res.ok) return;
      const data = await res.json();
      const notices = (data.posts || []).slice(0, 4);
      setNoticePosts(notices);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchBest = useCallback(async () => {
    try {
      const res = await fetch("/api/posts/best?t=" + Date.now());
      if (res.ok) {
        const data = await res.json();
        setBestPosts(data.posts || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const shouldRestore = sessionStorage.getItem(FEED_RETURN_KEY) === "1";
      const cachedRaw = sessionStorage.getItem(FEED_CACHE_KEY);
      if (!shouldRestore || !cachedRaw) return;

      const cached = JSON.parse(cachedRaw);
      const isFresh = Date.now() - Number(cached.savedAt || 0) <= FEED_CACHE_TTL_MS;
      if (!isFresh || !Array.isArray(cached.posts) || cached.posts.length === 0) return;

      const restoredPage = Math.max(Number(cached.page || 1), 1);
      const restoredSort = typeof cached.sort === "string" ? cached.sort : "latest";
      const restoredHasMore = Boolean(cached.hasMore);
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
      setPage(restoredPage);
      pageRef.current = restoredPage;
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
            page,
            hasMore,
            sort,
            savedAt: Date.now(),
          }),
      );
    } catch (error) {
      console.error(error);
    }
  }, [posts, noticePosts, bestPosts, page, hasMore, sort]);

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

    setPage(1);
    pageRef.current = 1;
    fetchPosts(1, sort, true);
    fetchNotices();
    fetchBest();
  }, [sort, fetchPosts, fetchNotices, fetchBest]);

  const loadMore = useCallback(async () => {
    if (loadingNextPageRef.current || loading || !hasMore) return;
    loadingNextPageRef.current = true;

    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    setPage(nextPage);

    try {
      await fetchPosts(nextPage, sort, false);
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
                    width: "52px",
                    height: "52px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={item.icon}
                    alt=""
                    width={50}
                    height={50}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: "50px",
                      height: "50px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
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
      </div>

      {bestPosts.length > 0 && (
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
              {bestPosts.slice(0, 2).map((post) => (
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
          {topSpacerHeight > 0 && <div style={{ height: topSpacerHeight }} />}
          {renderedPosts.map((post) => (
            <PostCard key={post.id} post={post} onOpen={openPostDetail} />
          ))}
          {bottomSpacerHeight > 0 && <div style={{ height: bottomSpacerHeight }} />}
        </div>
        <div ref={loadMoreTriggerRef} style={{ height: 1 }} />
        {loading && <div className="loading">{"\uBD88\uB7EC\uC624\uB294 \uC911..."}</div>}
        {!loading && posts.length === 0 && (
          <div className="empty">{"\uC544\uC9C1 \uAC8C\uC2DC\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}</div>
        )}
      </div>
      <WriteButton />
    </div>
  );
}
