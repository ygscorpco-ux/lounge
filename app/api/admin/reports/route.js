import pool from "../../../../lib/db.js";
import { getCurrentUser } from "../../../../lib/auth.js";
import { ROLE_ADMIN } from "../../../../lib/constants.js";
import { withApiMonitoring } from "../../../../lib/monitoring.js";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLE_ADMIN) return null;
  return user;
}

function normalizeTargets(items) {
  if (!Array.isArray(items)) return [];
  const normalized = [];
  const seen = new Set();

  for (const raw of items) {
    const targetType = raw?.targetType === "comment" ? "comment" : "post";
    const targetId = Number(raw?.targetId);
    if (!Number.isInteger(targetId) || targetId <= 0) continue;
    const dedupeKey = `${targetType}:${targetId}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    normalized.push({ targetType, targetId });
  }

  return normalized;
}

function buildTargetWhere(targets) {
  const clauses = [];
  const params = [];

  for (const target of targets) {
    clauses.push("(target_type = ? AND target_id = ?)");
    params.push(target.targetType, target.targetId);
  }

  return {
    where: clauses.length > 0 ? clauses.join(" OR ") : "1 = 0",
    params,
  };
}

function splitTargetIds(targets) {
  const postIds = [];
  const commentIds = [];
  for (const target of targets) {
    if (target.targetType === "comment") commentIds.push(target.targetId);
    else postIds.push(target.targetId);
  }
  return { postIds, commentIds };
}

function toPlaceholderList(values) {
  return values.map(() => "?").join(",");
}

export async function GET() {
  return withApiMonitoring("admin.reports.GET", async () => {
    try {
      const admin = await requireAdmin();
      if (!admin) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }

      const [rows] = await pool.query(
        `SELECT
           r.target_type,
           r.target_id,
           COUNT(*) AS report_count,
           MAX(r.created_at) AS last_reported_at,
           MAX(CASE WHEN r.target_type = 'post' THEN p.title ELSE c.content END) AS target_preview,
           MAX(CASE WHEN r.target_type = 'post' THEN p.user_id ELSE c.user_id END) AS target_user_id,
           MAX(CASE WHEN r.target_type = 'post' THEN p.is_hidden ELSE c.is_hidden END) AS target_hidden,
           GROUP_CONCAT(NULLIF(TRIM(r.reason), '') ORDER BY r.created_at DESC SEPARATOR ' || ') AS reason_preview
         FROM reports r
         LEFT JOIN posts p
           ON r.target_type = 'post'
          AND r.target_id = p.id
         LEFT JOIN comments c
           ON r.target_type = 'comment'
          AND r.target_id = c.id
         GROUP BY r.target_type, r.target_id
         ORDER BY last_reported_at DESC
         LIMIT 200`,
      );

      const items = rows.map((row) => {
        const preview = String(row.target_preview || "").trim();
        const reasons = String(row.reason_preview || "")
          .split(" || ")
          .map((reason) => reason.trim())
          .filter(Boolean)
          .slice(0, 3);

        return {
          targetType: row.target_type === "comment" ? "comment" : "post",
          targetId: Number(row.target_id),
          reportCount: Number(row.report_count || 0),
          targetPreview: preview.substring(0, 140),
          targetUserId: Number(row.target_user_id || 0),
          targetHidden: !!row.target_hidden,
          reasons,
          lastReportedAt: row.last_reported_at,
        };
      });

      return NextResponse.json({ items });
    } catch (error) {
      console.error("admin reports list error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}

export async function POST(request) {
  return withApiMonitoring("admin.reports.POST", async () => {
    try {
      const admin = await requireAdmin();
      if (!admin) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }

      const body = await request.json();
      const action = String(body?.action || "").toLowerCase();
      const targets = normalizeTargets(body?.items);

      if (!["hide", "block", "hide_and_block", "dismiss"].includes(action)) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
      if (targets.length === 0) {
        return NextResponse.json({ error: "No targets selected" }, { status: 400 });
      }

      const { postIds, commentIds } = splitTargetIds(targets);
      const conn = await pool.getConnection();
      let hiddenTargets = 0;
      let bannedUsers = 0;
      let deletedReports = 0;

      try {
        await conn.beginTransaction();

        if (action === "hide" || action === "hide_and_block") {
          if (postIds.length > 0) {
            const [result] = await conn.query(
              `UPDATE posts SET is_hidden = TRUE WHERE id IN (${toPlaceholderList(postIds)})`,
              postIds,
            );
            hiddenTargets += Number(result.affectedRows || 0);
          }
          if (commentIds.length > 0) {
            const [result] = await conn.query(
              `UPDATE comments SET is_hidden = TRUE WHERE id IN (${toPlaceholderList(commentIds)})`,
              commentIds,
            );
            hiddenTargets += Number(result.affectedRows || 0);
          }
        }

        if (action === "block" || action === "hide_and_block") {
          const userIds = new Set();
          if (postIds.length > 0) {
            const [postRows] = await conn.query(
              `SELECT user_id FROM posts WHERE id IN (${toPlaceholderList(postIds)})`,
              postIds,
            );
            for (const row of postRows) {
              if (Number.isInteger(Number(row.user_id))) {
                userIds.add(Number(row.user_id));
              }
            }
          }
          if (commentIds.length > 0) {
            const [commentRows] = await conn.query(
              `SELECT user_id FROM comments WHERE id IN (${toPlaceholderList(commentIds)})`,
              commentIds,
            );
            for (const row of commentRows) {
              if (Number.isInteger(Number(row.user_id))) {
                userIds.add(Number(row.user_id));
              }
            }
          }

          const normalizedUserIds = [...userIds].filter((id) => id > 0);
          if (normalizedUserIds.length > 0) {
            const [result] = await conn.query(
              `UPDATE users SET is_banned = TRUE WHERE id IN (${toPlaceholderList(normalizedUserIds)})`,
              normalizedUserIds,
            );
            bannedUsers = Number(result.affectedRows || 0);
          }
        }

        const where = buildTargetWhere(targets);
        const [deleteResult] = await conn.query(
          `DELETE FROM reports WHERE ${where.where}`,
          where.params,
        );
        deletedReports = Number(deleteResult.affectedRows || 0);

        await conn.commit();
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }

      return NextResponse.json({
        message: "Processed",
        processedTargets: targets.length,
        hiddenTargets,
        bannedUsers,
        deletedReports,
      });
    } catch (error) {
      console.error("admin reports action error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}
