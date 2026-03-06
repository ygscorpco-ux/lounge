"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Header from "../components/Header.jsx";
import PostCard from "../components/PostCard.jsx";
import WriteButton from "../components/WriteButton.jsx";

function QuickIcon({ type, accent }) {
  const stroke = accent || "#1b4797";

  const common = {
    width: 30,
    height: 30,
    viewBox: "0 0 28 28",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (type === "home") {
    return (
      <svg {...common}>
        <path d="M4 12.5L14 5L24 12.5V22a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 4 22v-9.5Z" fill="#ffc8c8" stroke={stroke} strokeWidth="1.9" />
        <path d="M10.5 23.5V16.5h7V23.5" stroke={stroke} strokeWidth="1.9" />
        <rect x="16.1" y="7.6" width="2.7" height="5.1" rx="0.8" fill="#ff4545" stroke={stroke} strokeWidth="1.4" />
        <circle cx="17.4" cy="6.2" r="0.95" fill="#dbeafe" stroke={stroke} strokeWidth="1.1" />
      </svg>
    );
  }

  if (type === "scooter") {
    return (
      <svg {...common}>
        <circle cx="8.1" cy="21.2" r="2.7" fill="#8be9ff" stroke={stroke} strokeWidth="1.8" />
        <circle cx="20" cy="21.2" r="2.7" fill="#8be9ff" stroke={stroke} strokeWidth="1.8" />
        <path d="M9.9 21.2h6.2l2.7-6.4h-6.7l-2-3.3H7.3" stroke={stroke} strokeWidth="1.9" />
        <rect x="15.9" y="11.4" width="4.7" height="2.9" rx="1.1" fill="#ff6b6b" stroke={stroke} strokeWidth="1.4" />
        <path d="M20.6 14.3h1.6a1.5 1.5 0 0 1 1.5 1.5v2" stroke={stroke} strokeWidth="1.8" />
      </svg>
    );
  }

  if (type === "briefcase") {
    return (
      <svg {...common}>
        <rect x="4.2" y="9" width="19.6" height="13.6" rx="2.3" fill="#67e39a" stroke={stroke} strokeWidth="1.9" />
        <path d="M10.8 9V7.4a1.3 1.3 0 0 1 1.3-1.3h3.8a1.3 1.3 0 0 1 1.3 1.3V9" stroke={stroke} strokeWidth="1.8" />
        <path d="M4.2 14.2H23.8" stroke={stroke} strokeWidth="1.7" />
        <rect x="11.9" y="13.1" width="4.2" height="2.4" rx="0.9" fill="#1b4797" />
      </svg>
    );
  }

  if (type === "calendar") {
    return (
      <svg {...common}>
        <rect x="5.2" y="6.5" width="17.6" height="16.8" rx="2.2" fill="#ffd95a" stroke={stroke} strokeWidth="1.9" />
        <path d="M9.2 4.6V8M18.8 4.6V8M5.2 10.4h17.6" stroke={stroke} strokeWidth="1.7" />
        <rect x="9.2" y="13" width="3.3" height="3.3" rx="0.8" fill="#ff5f5f" stroke={stroke} strokeWidth="1.2" />
        <rect x="14.6" y="13" width="3.3" height="3.3" rx="0.8" fill="#fff3bf" stroke={stroke} strokeWidth="1.2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="6.1" y="4.7" width="15.8" height="18.6" rx="2.4" fill="#b0a8ff" stroke={stroke} strokeWidth="1.9" />
      <rect x="9.1" y="8.5" width="9.8" height="2" rx="0.9" fill="#1b4797" />
      <path d="M9.3 13.2h9.4M9.3 16.8h6.6" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [bestPosts, setBestPosts] = useState([]);
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const quickMenus = [
    {
      label: "\uC5FC\uAD11\uC0AC \uD648",
      url: "https://www.\uC5FC\uAD11\uC0AC.com",
      external: true,
      type: "home",
      bubble:
        "radial-gradient(circle at 30% 25%, #ffffff 0%, #e8f0ff 45%, #dbe7ff 100%)",
    },
    {
      label: "\uB9C8\uC9C4\uACC4\uC0B0\uAE30",
      url: "/tools/delivery-margin",
      external: false,
      type: "scooter",
      bubble:
        "radial-gradient(circle at 30% 25%, #ffffff 0%, #fff1e6 45%, #ffe5d1 100%)",
    },
    {
      label: "\uC778\uAC74\uBE44\uACC4\uC0B0",
      url: "/tools/labor-cost",
      external: false,
      type: "briefcase",
      bubble:
        "radial-gradient(circle at 30% 25%, #ffffff 0%, #ebfbf3 45%, #d7f4e6 100%)",
    },
    {
      label: "\uC9C0\uC6D0\uAE08\uC77C\uC815",
      url: "/tools/subsidy-calendar",
      external: false,
      type: "calendar",
      bubble:
        "radial-gradient(circle at 30% 25%, #ffffff 0%, #fff9e7 45%, #fff0c9 100%)",
    },
    {
      label: "\uC54C\uBC14\uAD00\uB9AC",
      url: "/tools/worker-scheduler",
      external: false,
      type: "clipboard",
      bubble:
        "radial-gradient(circle at 30% 25%, #ffffff 0%, #f4f2ff 45%, #e4ddff 100%)",
    },
  ];

  const fetchPosts = useCallback(async (p, cat, s, reset) => {
    setLoading(true);
    try {
      const url = "/api/posts?page=" + p + "&sort=" + s + "&t=" + Date.now();
      const res = await fetch(url);
      const data = await res.json();
      if (reset) setPosts(data.posts || []);
      else setPosts((prev) => [...prev, ...(data.posts || [])]);
      setHasMore((data.posts || []).length >= data.pageSize);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
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
    setPage(1);
    fetchPosts(1, null, sort, true);
    fetchBest();
  }, [sort, refreshKey, fetchPosts, fetchBest]);

  useEffect(() => {
    const h = () => setRefreshKey((p) => p + 1);
    window.addEventListener("focus", h);
    window.addEventListener("pageshow", h);
    return () => {
      window.removeEventListener("focus", h);
      window.removeEventListener("pageshow", h);
    };
  }, []);

  useEffect(() => {
    setRefreshKey((p) => p + 1);
  }, [pathname]);

  function loadMore() {
    const n = page + 1;
    setPage(n);
    fetchPosts(n, null, sort, false);
  }

  useEffect(() => {
    const h = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 200 &&
        !loading &&
        hasMore
      ) {
        loadMore();
      }
    };
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, [loading, hasMore, page, sort]);

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
                  gap: "8px",
                  textDecoration: "none",
                  minWidth: "62px",
                }}
              >
                <div
                  style={{
                    width: "58px",
                    height: "58px",
                    borderRadius: "50%",
                    background: item.bubble,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow:
                      "0 8px 14px rgba(15,39,84,0.18), inset 0 2px 4px rgba(255,255,255,0.92), inset 0 -2px 3px rgba(27,71,151,0.12)",
                    border: "1.5px solid rgba(27,71,151,0.22)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "7px",
                      left: "11px",
                      width: "22px",
                      height: "8px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.58)",
                      transform: "rotate(-12deg)",
                    }}
                  />
                  <QuickIcon type={item.type} accent="#1b4797" />
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#495057",
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

      {bestPosts.length > 0 && (
        <>
          <div className="section-divider" />
          <div style={{ padding: "16px 16px 12px" }}>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#1a1a1a",
                marginBottom: "12px",
              }}
            >
              {"\uC774\uBC88 \uC8FC \uC778\uAE30 \uAC8C\uC2DC\uAE00"}
            </div>
            <div
              className="best-scroll"
              style={{
                display: "flex",
                gap: "10px",
                overflowX: "auto",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              {bestPosts.map((post, i) => (
                <div
                  key={post.id}
                  onClick={() => router.push("/post/" + post.id)}
                  style={{
                    minWidth: "180px",
                    background: "#f8f9fa",
                    borderRadius: "12px",
                    padding: "14px",
                    cursor: "pointer",
                    flex: "0 0 auto",
                    border: "1px solid #f0f0f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#1b4797",
                      fontWeight: 700,
                      marginBottom: "6px",
                    }}
                  >
                    #{i + 1}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1a1a1a",
                      marginBottom: "8px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {post.title}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#999",
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <span>{"\uC88B\uC544\uC694 "}{post.likeCount}</span>
                    <span>{"\uB313\uAE00 "}{post.commentCount}</span>
                  </div>
                </div>
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
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {loading && <div className="loading">{"\uBD88\uB7EC\uC624\uB294 \uC911..."}</div>}
        {!loading && posts.length === 0 && (
          <div className="empty">{"\uC544\uC9C1 \uAC8C\uC2DC\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}</div>
        )}
      </div>
      <WriteButton />
    </div>
  );
}
