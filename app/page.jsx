"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Header from "../components/Header.jsx";
import PostCard from "../components/PostCard.jsx";
import WriteButton from "../components/WriteButton.jsx";

function QuickIcon({ type, accent, fill }) {
  const stroke = accent || "#1b4797";
  const tone = fill || "#93c5fd";

  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (type === "home") {
    return (
      <svg {...common}>
        <path d="M3 10.5L12 3L21 10.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" fill={tone} stroke={stroke} strokeWidth="1.6" />
        <path d="M9 21v-6h6v6" stroke={stroke} strokeWidth="1.6" />
      </svg>
    );
  }

  if (type === "scooter") {
    return (
      <svg {...common}>
        <circle cx="7" cy="18" r="2.2" fill={tone} stroke={stroke} strokeWidth="1.6" />
        <circle cx="17" cy="18" r="2.2" fill={tone} stroke={stroke} strokeWidth="1.6" />
        <path d="M8.8 18h5.3l2.1-5h-5l-1.8-3H7" stroke={stroke} strokeWidth="1.8" />
        <path d="M16.6 13h1.9a1.5 1.5 0 0 1 1.5 1.5V16" stroke={stroke} strokeWidth="1.8" />
      </svg>
    );
  }

  if (type === "briefcase") {
    return (
      <svg {...common}>
        <rect x="3" y="7" width="18" height="12" rx="2" fill={tone} stroke={stroke} strokeWidth="1.6" />
        <path d="M9 7V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke={stroke} strokeWidth="1.6" />
        <path d="M3 12h18" stroke={stroke} strokeWidth="1.6" />
      </svg>
    );
  }

  if (type === "calendar") {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" fill={tone} stroke={stroke} strokeWidth="1.6" />
        <path d="M8 3v4M16 3v4M4 9h16" stroke={stroke} strokeWidth="1.6" />
        <rect x="8" y="12" width="3" height="3" rx="0.5" fill={stroke} />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="5" y="4" width="14" height="17" rx="2" fill={tone} stroke={stroke} strokeWidth="1.6" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke={stroke} strokeWidth="1.6" />
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
      bg: "#eaf2ff",
      fill: "#fca5a5",
    },
    {
      label: "\uB9C8\uC9C4\uACC4\uC0B0\uAE30",
      url: "/tools/delivery-margin",
      external: false,
      type: "scooter",
      bg: "#fff2e8",
      fill: "#fdba74",
    },
    {
      label: "\uC778\uAC74\uBE44\uACC4\uC0B0",
      url: "/tools/labor-cost",
      external: false,
      type: "briefcase",
      bg: "#eefbf4",
      fill: "#86efac",
    },
    {
      label: "\uC9C0\uC6D0\uAE08\uC77C\uC815",
      url: "/tools/subsidy-calendar",
      external: false,
      type: "calendar",
      bg: "#fff9eb",
      fill: "#fcd34d",
    },
    {
      label: "\uC54C\uBC14\uAD00\uB9AC",
      url: "/tools/worker-scheduler",
      external: false,
      type: "clipboard",
      bg: "#f4f1ff",
      fill: "#c4b5fd",
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
                    width: "54px",
                    height: "54px",
                    borderRadius: "50%",
                    background: item.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                    border: "1px solid #d9e1f1",
                  }}
                >
                  <QuickIcon type={item.type} accent="#1b4797" fill={item.fill} />
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
