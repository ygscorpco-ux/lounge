export const dynamic = "force-dynamic";
export const revalidate = 0;

import pool from "../../../../lib/db.js";
import { getCurrentUser } from "../../../../lib/auth.js";
import { PAGE_SIZE } from "../../../../lib/constants.js";
import { ensureNoticeSettingsColumns } from "../../../../lib/notice-settings.js";
import { fetchPostsPage } from "../../../../lib/posts-query.js";
import { getHomeMetaCached } from "../../../../lib/home-feed-cache.js";
import { withApiMonitoring } from "../../../../lib/monitoring.js";
import { NextResponse } from "next/server";

export async function GET(request) {
  return withApiMonitoring("home.feed.GET", async () => {
    try {
      const { searchParams } = new URL(request.url);
      const sort = searchParams.get("sort") || "latest";

      const user = await getCurrentUser();
      const isAdminUser = !!(user && user.role === "admin");
      let blockedIds = [];

      if (user) {
        const [blocks] = await pool.query(
          "SELECT blocked_user_id FROM user_blocks WHERE user_id = ?",
          [user.id],
        );
        blockedIds = blocks.map((row) => row.blocked_user_id);
      }

      const runQuery = () =>
        fetchPostsPage({
          page: 1,
          pageSize: PAGE_SIZE,
          sort,
          noticeOnly: false,
          excludeNotice: true,
          blockedIds,
          isAdminUser,
        });

      const [feed, meta] = await Promise.all([
        runQuery().catch(async (error) => {
          if (error?.code !== "ER_BAD_FIELD_ERROR") throw error;
          await ensureNoticeSettingsColumns();
          return runQuery();
        }),
        getHomeMetaCached({ noticeLimit: 4, bestLimit: 2 }),
      ]);

      return NextResponse.json(
        {
          posts: feed.posts,
          pageSize: feed.pageSize,
          nextCursor: feed.nextCursor,
          noticePosts: meta.noticePosts,
          bestPosts: meta.bestPosts,
        },
        {
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    } catch (error) {
      console.error("home feed error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}
