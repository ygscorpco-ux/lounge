import pool from "./db.js";

const ADMIN_DISPLAY_NAME = "\uC5FC\uAD11\uC0AC";
const ANON_DISPLAY_NAME = "\uC775\uBA85";
const HOME_META_TTL_MS = Math.max(
  parseInt(process.env.HOME_META_CACHE_MS || "60000", 10) || 60000,
  10000,
);

let noticeCache = { expiresAt: 0, data: [] };
let bestCache = { expiresAt: 0, data: [] };
let noticeInflight = null;
let bestInflight = null;

function mapRoleToAuthor(role) {
  return role === "admin" ? ADMIN_DISPLAY_NAME : ANON_DISPLAY_NAME;
}

async function queryNoticePosts(limit) {
  const [rows] = await pool.query(
    `SELECT p.id, p.title, p.created_at
     FROM posts p
     WHERE p.is_hidden = FALSE
       AND p.is_notice = TRUE
       AND p.notice_visible = TRUE
       AND (p.notice_start_at IS NULL OR p.notice_start_at <= NOW())
       AND (p.notice_end_at IS NULL OR p.notice_end_at >= NOW())
     ORDER BY p.notice_order ASC, p.created_at DESC, p.id DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    isNotice: true,
  }));
}

async function queryBestPosts(limit) {
  const [rows] = await pool.query(
    `SELECT
       p.id, p.title, p.content, p.like_count, p.comment_count, p.created_at, u.role
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.is_hidden = FALSE
       AND p.is_notice = FALSE
       AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     ORDER BY p.like_count DESC, p.comment_count DESC, p.created_at DESC, p.id DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: (row.content || "").substring(0, 60),
    author: mapRoleToAuthor(row.role),
    likeCount: row.like_count,
    commentCount: row.comment_count,
    createdAt: row.created_at,
  }));
}

async function getNoticePostsCached(limit) {
  if (limit <= 0) return [];
  const now = Date.now();
  if (noticeCache.expiresAt > now) {
    return noticeCache.data.slice(0, limit);
  }

  if (!noticeInflight) {
    noticeInflight = (async () => {
      const data = await queryNoticePosts(Math.max(limit, 4));
      noticeCache = { data, expiresAt: Date.now() + HOME_META_TTL_MS };
      return data;
    })().finally(() => {
      noticeInflight = null;
    });
  }

  const data = await noticeInflight;
  return data.slice(0, limit);
}

async function getBestPostsCached(limit) {
  if (limit <= 0) return [];
  const now = Date.now();
  if (bestCache.expiresAt > now) {
    return bestCache.data.slice(0, limit);
  }

  if (!bestInflight) {
    bestInflight = (async () => {
      const data = await queryBestPosts(Math.max(limit, 5));
      bestCache = { data, expiresAt: Date.now() + HOME_META_TTL_MS };
      return data;
    })().finally(() => {
      bestInflight = null;
    });
  }

  const data = await bestInflight;
  return data.slice(0, limit);
}

export async function getHomeMetaCached({ noticeLimit = 4, bestLimit = 2 } = {}) {
  const safeNoticeLimit = Number.isFinite(Number(noticeLimit))
    ? Math.max(Math.floor(Number(noticeLimit)), 0)
    : 4;
  const safeBestLimit = Number.isFinite(Number(bestLimit))
    ? Math.max(Math.floor(Number(bestLimit)), 0)
    : 2;

  const [noticePosts, bestPosts] = await Promise.all([
    getNoticePostsCached(safeNoticeLimit),
    getBestPostsCached(safeBestLimit),
  ]);

  return { noticePosts, bestPosts };
}
