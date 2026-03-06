import pool from "./db.js";
import { PAGE_SIZE } from "./constants.js";

const ADMIN_DISPLAY_NAME = "\uC5FC\uAD11\uC0AC";
const ANON_DISPLAY_NAME = "\uC775\uBA85";

function safeDateToIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date(0).toISOString();
  }
  return date.toISOString();
}

function encodeCursor(cursor) {
  try {
    return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
  } catch {
    return null;
  }
}

function decodeCursor(token) {
  if (!token) return null;
  try {
    const decoded = Buffer.from(String(token), "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseImageList(images) {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeCursor(sort, cursor) {
  if (!cursor || cursor.sort !== sort) return null;
  const id = Number(cursor.id);
  const createdAt = new Date(cursor.createdAt);
  if (!Number.isFinite(id) || Number.isNaN(createdAt.getTime())) return null;

  if (sort === "likes") {
    const likeCount = Number(cursor.likeCount);
    if (!Number.isFinite(likeCount)) return null;
    return { id, createdAt, likeCount };
  }

  if (sort === "comments") {
    const commentCount = Number(cursor.commentCount);
    if (!Number.isFinite(commentCount)) return null;
    return { id, createdAt, commentCount };
  }

  return { id, createdAt };
}

function buildCursorFromLastRow(sort, row) {
  if (!row) return null;
  const base = {
    sort,
    id: Number(row.id),
    createdAt: safeDateToIso(row.created_at),
  };

  if (sort === "likes") {
    base.likeCount = Number(row.like_count || 0);
  } else if (sort === "comments") {
    base.commentCount = Number(row.comment_count || 0);
  }

  return encodeCursor(base);
}

export function mapPostRow(row) {
  const imageList = parseImageList(row.images);
  const thumbnailUrl = imageList.length > 0 ? imageList[0] : null;

  return {
    id: row.id,
    category: row.category,
    title: row.title,
    content: (row.content || "").substring(0, 120),
    author: row.role === "admin" ? ADMIN_DISPLAY_NAME : ANON_DISPLAY_NAME,
    isNotice: !!row.is_notice,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    noticeVisible: !!row.notice_visible,
    noticeOrder: Number(row.notice_order ?? 1000),
    noticeStartAt: row.notice_start_at,
    noticeEndAt: row.notice_end_at,
    hasImages: imageList.length > 0,
    thumbnailUrl,
    hasPoll: !!row.has_poll,
  };
}

export async function fetchPostsPage({
  page = 1,
  pageSize = PAGE_SIZE,
  category = "",
  sort = "latest",
  noticeOnly = false,
  excludeNotice = false,
  blockedIds = [],
  isAdminUser = false,
  cursorToken = "",
}) {
  const safePage = Number.isFinite(Number(page)) && Number(page) > 0
    ? Math.floor(Number(page))
    : 1;
  const safeSort =
    sort === "likes" || sort === "comments" ? sort : "latest";
  const decodedCursor = decodeCursor(cursorToken);
  const cursor =
    excludeNotice && !noticeOnly
      ? normalizeCursor(safeSort, decodedCursor)
      : null;
  const useCursor = !!cursor;
  const offset = (safePage - 1) * pageSize;

  let query = `
    SELECT
      p.id, p.user_id, p.category, p.title, p.content, p.is_notice,
      p.like_count, p.comment_count, p.created_at, p.images, p.has_poll,
      p.notice_visible, p.notice_order, p.notice_start_at, p.notice_end_at, u.role
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.is_hidden = FALSE
  `;
  const params = [];

  if (blockedIds.length > 0) {
    query += ` AND p.user_id NOT IN (${blockedIds.map(() => "?").join(",")})`;
    params.push(...blockedIds);
  }

  if (!isAdminUser && !noticeOnly && !excludeNotice) {
    query +=
      " AND (p.is_notice = FALSE OR (p.notice_visible = TRUE AND (p.notice_start_at IS NULL OR p.notice_start_at <= NOW()) AND (p.notice_end_at IS NULL OR p.notice_end_at >= NOW())))";
  }

  if (category) {
    query += " AND p.category = ?";
    params.push(category);
  }

  if (noticeOnly) {
    if (isAdminUser) {
      query += " AND p.is_notice = TRUE";
    } else {
      query +=
        " AND p.is_notice = TRUE AND p.notice_visible = TRUE AND (p.notice_start_at IS NULL OR p.notice_start_at <= NOW()) AND (p.notice_end_at IS NULL OR p.notice_end_at >= NOW())";
    }
  } else if (excludeNotice) {
    query += " AND p.is_notice = FALSE";
  }

  if (useCursor) {
    if (safeSort === "likes") {
      query += `
        AND (
          p.like_count < ?
          OR (p.like_count = ? AND p.created_at < ?)
          OR (p.like_count = ? AND p.created_at = ? AND p.id < ?)
        )
      `;
      params.push(
        cursor.likeCount,
        cursor.likeCount,
        cursor.createdAt,
        cursor.likeCount,
        cursor.createdAt,
        cursor.id,
      );
    } else if (safeSort === "comments") {
      query += `
        AND (
          p.comment_count < ?
          OR (p.comment_count = ? AND p.created_at < ?)
          OR (p.comment_count = ? AND p.created_at = ? AND p.id < ?)
        )
      `;
      params.push(
        cursor.commentCount,
        cursor.commentCount,
        cursor.createdAt,
        cursor.commentCount,
        cursor.createdAt,
        cursor.id,
      );
    } else {
      query += `
        AND (
          p.created_at < ?
          OR (p.created_at = ? AND p.id < ?)
        )
      `;
      params.push(cursor.createdAt, cursor.createdAt, cursor.id);
    }
  }

  if (noticeOnly) {
    query += " ORDER BY p.notice_order ASC, p.created_at DESC, p.id DESC";
  } else if (excludeNotice) {
    if (safeSort === "likes") {
      query += " ORDER BY p.like_count DESC, p.created_at DESC, p.id DESC";
    } else if (safeSort === "comments") {
      query += " ORDER BY p.comment_count DESC, p.created_at DESC, p.id DESC";
    } else {
      query += " ORDER BY p.created_at DESC, p.id DESC";
    }
  } else if (safeSort === "likes") {
    query +=
      " ORDER BY p.is_notice DESC, p.like_count DESC, p.created_at DESC, p.id DESC";
  } else if (safeSort === "comments") {
    query +=
      " ORDER BY p.is_notice DESC, p.comment_count DESC, p.created_at DESC, p.id DESC";
  } else {
    query += " ORDER BY p.is_notice DESC, p.created_at DESC, p.id DESC";
  }

  query += " LIMIT ?";
  params.push(pageSize);
  if (!useCursor) {
    query += " OFFSET ?";
    params.push(offset);
  }

  const [rows] = await pool.query(query, params);
  const posts = rows.map(mapPostRow);
  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
  const nextCursor =
    rows.length >= pageSize && excludeNotice && !noticeOnly
      ? buildCursorFromLastRow(safeSort, lastRow)
      : null;

  return {
    posts,
    page: safePage,
    pageSize,
    nextCursor,
    usingCursor: useCursor,
  };
}
