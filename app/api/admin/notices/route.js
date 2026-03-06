import pool from "../../../../lib/db.js";
import { getCurrentUser } from "../../../../lib/auth.js";
import { ensureNoticeSettingsColumns } from "../../../../lib/notice-settings.js";
import { NextResponse } from "next/server";

const ADMIN_DISPLAY_NAME = "\uC5FC\uAD11\uC0AC";
const ANON_DISPLAY_NAME = "\uC775\uBA85";

function normalizeOrder(value) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return undefined;
  if (parsed < 1 || parsed > 4) return undefined;
  return parsed;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    await ensureNoticeSettingsColumns();

    const [rows] = await pool.query(
      `SELECT
         p.id, p.title, p.content, p.created_at, p.like_count, p.comment_count,
         p.notice_visible, p.notice_order, u.role
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.is_hidden = FALSE
         AND p.is_notice = TRUE
       ORDER BY
         p.notice_order ASC,
         p.created_at DESC`,
    );

    const posts = rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: (row.content || "").substring(0, 140),
      author: row.role === "admin" ? ADMIN_DISPLAY_NAME : ANON_DISPLAY_NAME,
      createdAt: row.created_at,
      likeCount: row.like_count,
      commentCount: row.comment_count,
      noticeVisible: row.notice_visible === 1,
      noticeOrder: row.notice_order ?? 4,
    }));

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("admin notices list error:", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    await ensureNoticeSettingsColumns();

    const body = await request.json();
    const postId = Number(body.postId);
    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
    }

    const hasVisible = typeof body.noticeVisible === "boolean";
    const normalizedOrder = normalizeOrder(body.noticeOrder);
    const hasOrder = body.noticeOrder !== undefined;

    if (hasOrder && normalizedOrder === undefined) {
      return NextResponse.json(
        { error: "noticeOrder must be integer 1~4" },
        { status: 400 },
      );
    }
    if (!hasVisible && !hasOrder) {
      return NextResponse.json(
        { error: "No update fields provided" },
        { status: 400 },
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [targetRows] = await conn.query(
        `SELECT id
         FROM posts
         WHERE id = ?
           AND is_hidden = FALSE
           AND is_notice = TRUE
         LIMIT 1`,
        [postId],
      );
      if (targetRows.length === 0) {
        await conn.rollback();
        return NextResponse.json({ error: "Notice not found" }, { status: 404 });
      }

      const fields = [];
      const params = [];

      if (hasVisible) {
        fields.push("notice_visible = ?");
        params.push(body.noticeVisible);
      }
      if (hasOrder) {
        fields.push("notice_order = ?");
        params.push(normalizedOrder);
      }

      await conn.query(
        `UPDATE posts
         SET ${fields.join(", ")}
         WHERE id = ?`,
        [...params, postId],
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    return NextResponse.json({ message: "Updated" });
  } catch (error) {
    console.error("admin notice update error:", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
