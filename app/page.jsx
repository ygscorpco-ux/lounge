"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Header from "../components/Header.jsx";

import PostCard from "../components/PostCard.jsx";
import WriteButton from "../components/WriteButton.jsx";

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

  const fetchPosts = useCallback(async (p, cat, s, reset) => {
    setLoading(true);
    try {
      let url = "/api/posts?page=" + p + "&sort=" + s + "&t=" + Date.now();

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
    } catch (e) {}
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
      )
        loadMore();
    };
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, [loading, hasMore, page, sort]);

  return (
    <div>
      <Header />

      {/* 배너 */}
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
          <div
            style={{
              fontSize: "12px",
              opacity: 0.8,
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            공지사항
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>
            라운지에 오신 것을
            <br />
            환영합니다!
          </div>
          <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "10px" }}>
            사장님들의 솔직한 이야기 공간
          </div>
        </div>
        <div
          style={{
            minWidth: "220px",
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            borderRadius: "14px",
            padding: "18px",
            color: "white",
            flex: "0 0 auto",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              opacity: 0.8,
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            이벤트
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>
            베스트 글 커피
            <br />
            기프티콘!
          </div>
          <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "10px" }}>
            매주 추천 1등에게 드려요
          </div>
        </div>
      </div>

      {/* 바로가기 퀵메뉴 — 5개, 한 줄 균등 배치 */}
      <div style={{
        display: "flex", justifyContent: "space-around",
        padding: "4px 8px 16px",
      }}>
        {/* 염광사 홈 1개 + 사장님 도구 4개 = 총 5개 */}
        {[
          {
            label: "염광사 홈", url: "http://www.염광사.com", external: true,
            svg: <svg viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="#1b4797" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13L14 5l10 8"/><path d="M6 11.5V23h5v-5h6v5h5V11.5"/></svg>
          },
          {
            label: "마진계산기", url: "/tools/delivery-margin", external: false,
            svg: <svg viewBox="0 0 28 28" width="26" height="26" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="21" r="2.5" stroke="#1b4797" strokeWidth="1.8"/><circle cx="21" cy="21" r="2.5" stroke="#1b4797" strokeWidth="1.8"/><path d="M9.5 21h9M14 21l-3-8h5l3 5" stroke="#1b4797" strokeWidth="1.8"/><text x="14" y="10" fontSize="8" fontWeight="700" fill="#4f80e1" stroke="none">₩</text></svg>
          },
          {
            label: "인건비계산", url: "/tools/labor-cost", external: false,
            svg: <svg viewBox="0 0 28 28" width="26" height="26" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="9" r="4" stroke="#1b4797" strokeWidth="1.8"/><path d="M4 24c0-4 3-7 7-7" stroke="#1b4797" strokeWidth="1.8"/><text x="15" y="22" fontSize="10" fontWeight="700" fill="#4f80e1" stroke="none">₩</text></svg>
          },
          {
            label: "지원금일정", url: "/tools/subsidy-calendar", external: false,
            svg: <svg viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="#1b4797" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="22" height="19" rx="3"/><path d="M8 5V3M20 5V3M3 11h22"/><text x="7" y="22" fontSize="9" fontWeight="700" fill="#4f80e1" stroke="none">₩</text></svg>
          },
          {
            label: "알바관리", url: "/tools/worker-scheduler", external: false,
            svg: <svg viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="#1b4797" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="16" height="22" rx="2"/><path d="M10 2v3h8V2"/><path d="M10 14h5M10 18h3"/><circle cx="20" cy="20" r="5" fill="#eef2fb" stroke="#4f80e1" strokeWidth="1.6"/><path d="M20 17.5V20l1.5 1.5" stroke="#4f80e1" strokeWidth="1.5"/></svg>
          },
        ].map((item, i) => (
          <a
            key={i}
            href={item.url}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}
          >
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "#eef2fb", display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: "0 2px 8px rgba(27,71,151,0.10)",
            }}>
              {item.svg}
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#495057", textAlign: "center", whiteSpace: "nowrap" }}>
              {item.label}
            </span>
          </a>
        ))}
      </div>

      {/* 베스트 */}
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
              🔥 실시간 인기 글
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
                    <span>♥ {post.likeCount}</span>
                    <span>💬 {post.commentCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="section-divider" />

      {/* 정렬 */}
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
          게시판
        </span>
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="latest">최신순</option>
          <option value="likes">추천순</option>
          <option value="comments">댓글순</option>
        </select>
      </div>

      {/* 글 목록 */}
      <div>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {loading && <div className="loading">로딩 중...</div>}
        {!loading && posts.length === 0 && (
          <div className="empty">아직 글이 없습니다</div>
        )}
      </div>
      <WriteButton />
    </div>
  );
}
