import pool from "../../../../lib/db.js";
import { getCurrentUser } from "../../../../lib/auth.js";
import { ensureNoticeSettingsColumns } from "../../../../lib/notice-settings.js";
import { withApiMonitoring } from "../../../../lib/monitoring.js";
import { NextResponse } from "next/server";

const ADMIN_DISPLAY_NAME = "\uC5FC\uAD11\uC0AC";
const ANON_DISPLAY_NAME = "\uC775\uBA85";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}

export async function GET() {
  return withApiMonitoring("admin.notices.GET", async () => {
    try {
      const admin = await requireAdmin();
      if (!admin) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }

      await ensureNoticeSettingsColumns();

      const [rows] = await pool.query(
        `SELECT
           p.id, p.title, p.content, p.created_at, p.like_count, p.comment_count,
           p.notice_visible, p.notice_order, p.notice_start_at, p.notice_end_at, u.role
         FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE p.is_hidden = FALSE
           AND p.is_notice = TRUE
         ORDER BY p.notice_order ASC, p.created_at DESC`,
      );

      const nowMs = Date.now();
      const posts = rows.map((row) => {
        const startMs = row.notice_start_at ? new Date(row.notice_start_at).getTime() : null;
        const endMs = row.notice_end_at ? new Date(row.notice_end_at).getTime() : null;
        const started = !Number.isFinite(startMs) || startMs <= nowMs;
        const notEnded = !Number.isFinite(endMs) || endMs >= nowMs;

        return {
          id: row.id,
          title: row.title,
          content: (row.content || "").substring(0, 140),
          author: row.role === "admin" ? ADMIN_DISPLAY_NAME : ANON_DISPLAY_NAME,
          createdAt: row.created_at,
          likeCount: row.like_count,
          commentCount: row.comment_count,
          noticeVisible: !!row.notice_visible,
          noticeOrder: Number(row.notice_order ?? 1000),
          noticeStartAt: row.notice_start_at,
          noticeEndAt: row.notice_end_at,
          noticeActiveNow: !!row.notice_visible && started && notEnded,
        };
      });

      return NextResponse.json({ posts });
    } catch (error) {
      console.error("admin notices list error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}

export async function PATCH(request) {
  return withApiMonitoring("admin.notices.PATCH", async () => {
    try {
      const admin = await requireAdmin();
      if (!admin) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }

      await ensureNoticeSettingsColumns();

      const body = await request.json();
      const postId = Number(body.postId);
      const hasVisible = typeof body.noticeVisible === "boolean";
      const hasStartAt = Object.prototype.hasOwnProperty.call(body, "noticeStartAt");
      const hasEndAt = Object.prototype.hasOwnProperty.call(body, "noticeEndAt");

      if (!Number.isInteger(postId) || postId <= 0) {
        return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
      }
      if (!hasVisible && !hasStartAt && !hasEndAt) {
        return NextResponse.json(
          { error: "At least one field is required" },
          { status: 400 },
        );
      }

      const parsedNoticeStartAt =
        hasStartAt && body.noticeStartAt
          ? new Date(body.noticeStartAt)
          : null;
      const parsedNoticeEndAt =
        hasEndAt && body.noticeEndAt
          ? new Date(body.noticeEndAt)
          : null;

      if (
        hasStartAt &&
        body.noticeStartAt &&
        Number.isNaN(parsedNoticeStartAt?.getTime?.())
      ) {
        return NextResponse.json(
          { error: "noticeStartAt must be valid datetime" },
          { status: 400 },
        );
      }
      if (
        hasEndAt &&
        body.noticeEndAt &&
        Number.isNaN(parsedNoticeEndAt?.getTime?.())
      ) {
        return NextResponse.json(
          { error: "noticeEndAt must be valid datetime" },
          { status: 400 },
        );
      }

      const startMs = parsedNoticeStartAt ? parsedNoticeStartAt.getTime() : null;
      const endMs = parsedNoticeEndAt ? parsedNoticeEndAt.getTime() : null;
      if (Number.isFinite(startMs) && Number.isFinite(endMs) && startMs > endMs) {
        return NextResponse.json(
          { error: "Notice start must be earlier than end time" },
          { status: 400 },
        );
      }

      const [rows] = await pool.query(
        `SELECT id
         FROM posts
         WHERE id = ?
           AND is_hidden = FALSE
           AND is_notice = TRUE
         LIMIT 1`,
        [postId],
      );
      if (rows.length === 0) {
        return NextResponse.json({ error: "Notice not found" }, { status: 404 });
      }

      const updates = [];
      const params = [];
      if (hasVisible) {
        updates.push("notice_visible = ?");
        params.push(body.noticeVisible);
      }
      if (hasStartAt) {
        updates.push("notice_start_at = ?");
        if (body.noticeStartAt && parsedNoticeStartAt) {
          params.push(parsedNoticeStartAt);
        } else {
          params.push(null);
        }
      }
      if (hasEndAt) {
        updates.push("notice_end_at = ?");
        if (body.noticeEndAt && parsedNoticeEndAt) {
          params.push(parsedNoticeEndAt);
        } else {
          params.push(null);
        }
      }

      params.push(postId);
      await pool.query(`UPDATE posts SET ${updates.join(", ")} WHERE id = ?`, params);

      return NextResponse.json({ message: "Updated" });
    } catch (error) {
      console.error("admin notice visibility/schedule update error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}

export async function POST(request) {
  return withApiMonitoring("admin.notices.POST", async () => {
    try {
      const admin = await requireAdmin();
      if (!admin) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }

      await ensureNoticeSettingsColumns();

      const body = await request.json();
      const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds : null;
      if (!orderedIds || orderedIds.length === 0) {
        return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
      }

      const normalizedIds = orderedIds.map((id) => Number(id));
      if (normalizedIds.some((id) => !Number.isInteger(id) || id <= 0)) {
        return NextResponse.json({ error: "Invalid notice ids" }, { status: 400 });
      }

      const uniqueIds = new Set(normalizedIds);
      if (uniqueIds.size !== normalizedIds.length) {
        return NextResponse.json(
          { error: "orderedIds must be unique" },
          { status: 400 },
        );
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const placeholders = normalizedIds.map(() => "?").join(",");
        const [targetRows] = await conn.query(
          `SELECT id
           FROM posts
           WHERE is_hidden = FALSE
             AND is_notice = TRUE
             AND id IN (${placeholders})`,
          normalizedIds,
        );
        if (targetRows.length !== normalizedIds.length) {
          await conn.rollback();
          return NextResponse.json(
            { error: "Some notice ids are invalid" },
            { status: 400 },
          );
        }

        for (let index = 0; index < normalizedIds.length; index += 1) {
          await conn.query("UPDATE posts SET notice_order = ? WHERE id = ?", [
            index + 1,
            normalizedIds[index],
          ]);
        }

        await conn.commit();
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }

      return NextResponse.json({ message: "Reordered" });
    } catch (error) {
      console.error("admin notice reorder error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}
