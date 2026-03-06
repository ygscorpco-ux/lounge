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

      {/* ????썹땟戮녹?????椰?*/}
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
            ?????怨룹??????
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>
            ???μ떜媛?걫?筌뚮툙彛???몃룛????????????살퓢????棺堉?뤃????
            <br />
            ????癰궽블뀪???굿???꿔꺂??????
          </div>
          <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "10px" }}>
            ??????汝뷴젆?????????嫄??????????깅짆?????????
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
            ?癲??壤굿熬곥굥?????????留? ??鶯ㅺ동???????
            <br />
            ???????癲????????
          </div>
          <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "10px" }}>
            ?饔낅떽?????????????댄뱼???1??關?쒎첎?嫄?????レ맄?????꿔꺂??틝?????          </div>
        </div>
      </div>

      {/* ??ш끽維뽳쭩??嚥싳쉶瑗??밸윾癲???????????????ш끽維쀩????β뼯爰????????밸븶??뫢??*/}
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
            {[
              {
                label: "\uC5FC\uAD11\uC0AC \uD648",
                url: "http://www.?쇨킅??com",
                external: true,
                emoji: "\uD83C\uDFE0",
                bg: "#eef3ff",
                icon: "#ef4444",
              },
              {
                label: "\uB9C8\uC9C4\uACC4\uC0B0\uAE30",
                url: "/tools/delivery-margin",
                external: false,
                emoji: "\uD83D\uDEF5",
                bg: "#fff3ea",
                icon: "#f97316",
              },
              {
                label: "\uC778\uAC74\uBE44\uACC4\uC0B0",
                url: "/tools/labor-cost",
                external: false,
                emoji: "\uD83D\uDCBC",
                bg: "#eefbf2",
                icon: "#10b981",
              },
              {
                label: "\uC9C0\uC6D0\uAE08\uC77C\uC815",
                url: "/tools/subsidy-calendar",
                external: false,
                emoji: "\uD83D\uDCC5",
                bg: "#fff8e8",
                icon: "#eab308",
              },
              {
                label: "\uC54C\uBC14\uAD00\uB9AC",
                url: "/tools/worker-scheduler",
                external: false,
                emoji: "\uD83D\uDCCB",
                bg: "#f3f0ff",
                icon: "#8b5cf6",
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
                    borderRadius: "50%",
                    background: item.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                    border: "1px solid #d9e1f1",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      fontSize: "24px",
                      lineHeight: 1,
                      filter: "saturate(1.15)",
                    }}
                  >
                    {item.emoji}
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      right: "1px",
                      bottom: "1px",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: item.icon,
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

      {/* ?癲??壤굿熬곥굥????*/}
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
              ?????????살퓢?????轅붽틓???????????留?
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

      {/* ??轅붽틓???壤굿??*/}
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
          野껊슣?녷묾?
        </span>
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="latest">Latest</option>
          <option value="likes">Most Liked</option>
          <option value="comments">Most Commented</option>
        </select>
      </div>

      {/* ?????留? ?饔낅떽????ш낄?뉔뇡?꾩땡沃섏쥓???*/}
      <div>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {loading && <div className="loading">?癲??嶺??獒뺛뀙????..</div>}
        {!loading && posts.length === 0 && (
          <div className="empty">?????諛몃마??蹂㏓룾??????留?????????깅즽????????놁졄</div>
        )}
      </div>
      <WriteButton />
    </div>
  );
}

