import pool from "../../../../lib/db.js";
import { withApiMonitoring } from "../../../../lib/monitoring.js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ADMIN_DISPLAY_NAME = "\uC5FC\uAD11\uC0AC";
const ANON_DISPLAY_NAME = "\uC775\uBA85";

export async function GET() {
  return withApiMonitoring("posts.best.GET", async () => {
    try {
      const [rows] = await pool.query(
        `SELECT p.id, p.user_id, p.category, p.title, p.content, p.like_count, p.comment_count, p.created_at, u.role
         FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE p.is_hidden = FALSE
           AND p.is_notice = FALSE
           AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         ORDER BY p.like_count DESC, p.comment_count DESC
         LIMIT 5`,
      );

      const posts = rows.map((row) => ({
        id: row.id,
        category: row.category,
        title: row.title,
        content: (row.content || "").substring(0, 60),
        author: row.role === "admin" ? ADMIN_DISPLAY_NAME : ANON_DISPLAY_NAME,
        likeCount: row.like_count,
        commentCount: row.comment_count,
        createdAt: row.created_at,
      }));

      return NextResponse.json(
        { posts },
        {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        },
      );
    } catch (error) {
      console.error("best error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}
