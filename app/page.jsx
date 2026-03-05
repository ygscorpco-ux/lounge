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

      {/* ??ш끽維뽳쭩????嫄?*/}
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
            ?????곷쿀?????
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>
            ??嚥싲갭큔?琉븐쭍??노돗???????????ㅻ쿋????β뼯援????
            <br />
            ????蹂κ텠??㉱??癲ル슢?????
          </div>
          <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "10px" }}>
            ??????棺堉?댆???????거?????????욱룕?????????
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
            ??????          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>
            ?嶺??影袁る젺????????맜? ??壤굿??딇???
            <br />
            ???????濾????????
          </div>
          <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "10px" }}>
            ?轅붽틓???????????살퓢癲??1??μ떜媛?걫????ル쐞????癲ル슢캉?????          </div>
        </div>
      </div>

      {/* ?熬곣뫖利??濚욌꼬?녹럶嶺??????????????熬곣뫗逾???嚥▲꺂???????썹땟?㈑??*/}
      <div style={{ padding: "6px 12px 16px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            border: "1px solid #e9ecef",
            padding: "14px 10px 12px",
            boxShadow: "0 4px 14px rgba(27,71,151,0.10)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              gap: "6px",
            }}
          >
            {[
              {
                label: "YG Home",
                url: "http://www.염광사.com",
                external: true,
                emoji: "\uD83C\uDFE0",
                bg: "linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%)",
              },
              {
                label: "Margin",
                url: "/tools/delivery-margin",
                external: false,
                emoji: "\uD83D\uDEF5",
                bg: "linear-gradient(135deg,#fee2e2 0%,#fecaca 100%)",
              },
              {
                label: "Labor",
                url: "/tools/labor-cost",
                external: false,
                emoji: "\uD83D\uDCBC",
                bg: "linear-gradient(135deg,#dcfce7 0%,#bbf7d0 100%)",
              },
              {
                label: "Subsidy",
                url: "/tools/subsidy-calendar",
                external: false,
                emoji: "\uD83D\uDCC5",
                bg: "linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)",
              },
              {
                label: "Scheduler",
                url: "/tools/worker-scheduler",
                external: false,
                emoji: "\uD83D\uDCCB",
                bg: "linear-gradient(135deg,#ede9fe 0%,#ddd6fe 100%)",
              },
            ].map((item, i) => (
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
                    borderRadius: "16px",
                    background: item.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.22)",
                    border: "2px solid rgba(27,71,151,0.65)",
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: "24px", lineHeight: 1 }}>
                    {item.emoji}
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      right: "-2px",
                      bottom: "-2px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "#1b4797",
                      border: "2px solid #fff",
                    }}
                  />
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

      {/* ?嶺??影袁る젺???*/}
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
              ????????ㅻ쿋?????꿔꺂??恝????????맜?
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
                    <span>??{post.likeCount}</span>
                    <span>???{post.commentCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="section-divider" />

      {/* ??꿔꺂???影??*/}
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
          寃뚯떆湲
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

      {/* ?????맜? ?轅붽틓??熬곥끇釉띄춯誘좊???*/}
      <div>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {loading && <div className="loading">?黎??筌??裕ㅒ???..</div>}
        {!loading && posts.length === 0 && (
          <div className="empty">?????밸븶??볧돯??????맜????????욱룏???????낆젵</div>
        )}
      </div>
      <WriteButton />
    </div>
  );
}
