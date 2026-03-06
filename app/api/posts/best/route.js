import { withApiMonitoring } from "../../../../lib/monitoring.js";
import { getHomeMetaCached } from "../../../../lib/home-feed-cache.js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return withApiMonitoring("posts.best.GET", async () => {
    try {
      const { bestPosts } = await getHomeMetaCached({
        noticeLimit: 0,
        bestLimit: 5,
      });

      return NextResponse.json(
        { posts: bestPosts },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        },
      );
    } catch (error) {
      console.error("best error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}
