import pool from "../../../../lib/db.js";
import { getCurrentUser } from "../../../../lib/auth.js";
import { ROLE_ADMIN } from "../../../../lib/constants.js";
import { withApiMonitoring } from "../../../../lib/monitoring.js";
import { NextResponse } from "next/server";

const ADMIN_DISPLAY_NAME = "\uC5FC\uAD11\uC0AC";
const ANON_DISPLAY_NAME = "\uC775\uBA85";

export async function GET(request, { params }) {
  return withApiMonitoring("posts.detail.GET", async () => {
    try {
      const { id } = params;

    const [rows] = await pool.query(
      `SELECT
         p.id, p.user_id, p.category, p.title, p.content, p.is_notice,
         p.like_count, p.comment_count, p.created_at, p.images, p.has_poll,
         u.role
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.is_hidden = FALSE`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = rows[0];
    const postWriterIsAdmin = row.role === "admin";

    const user = await getCurrentUser();
    const isAuthor = !!(user && user.id === row.user_id);
    const isUserAdmin = !!(user && user.role === ROLE_ADMIN);

    let alreadyLiked = false;
    if (user) {
      const [likeRows] = await pool.query(
        "SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?",
        [id, user.id],
      );
      alreadyLiked = likeRows.length > 0;
    }

    let images = [];
    try {
      if (row.images) images = JSON.parse(row.images);
    } catch (error) {
      console.error("image parse error:", error);
    }

    let pollData = null;
    if (row.has_poll) {
      const [pollRows] = await pool.query(
        "SELECT id, question FROM polls WHERE post_id = ?",
        [id],
      );

      if (pollRows.length > 0) {
        const poll = pollRows[0];
        const [options] = await pool.query(
          "SELECT id, text, vote_count FROM poll_options WHERE poll_id = ? ORDER BY id",
          [poll.id],
        );
        const totalVotes = options.reduce((sum, option) => sum + option.vote_count, 0);

        let votedOptionId = null;
        if (user) {
          const [voteRows] = await pool.query(
            "SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_id = ?",
            [poll.id, user.id],
          );
          if (voteRows.length > 0) votedOptionId = voteRows[0].option_id;
        }

        pollData = {
          id: poll.id,
          question: poll.question,
          totalVotes,
          votedOptionId,
          options: options.map((option) => ({
            id: option.id,
            text: option.text,
            voteCount: option.vote_count,
            percent:
              totalVotes > 0
                ? Math.round((option.vote_count / totalVotes) * 100)
                : 0,
          })),
        };
      }
    }

    const post = {
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content,
      author: postWriterIsAdmin ? ADMIN_DISPLAY_NAME : ANON_DISPLAY_NAME,
      isNotice: row.is_notice === 1,
      likeCount: row.like_count,
      commentCount: row.comment_count,
      createdAt: row.created_at,
      isAuthor,
      isAdmin: isUserAdmin,
      alreadyLiked,
      userId: row.user_id,
      images,
      poll: pollData,
    };

      return NextResponse.json({ post });
    } catch (error) {
      console.error("post detail error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}

export async function DELETE(request, { params }) {
  return withApiMonitoring("posts.detail.DELETE", async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Login required" }, { status: 401 });
      }

    const { id } = params;
    const [rows] = await pool.query("SELECT user_id FROM posts WHERE id = ?", [id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isAuthor = user.id === rows[0].user_id;
    const isAdmin = user.role === ROLE_ADMIN;
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "No permission" }, { status: 403 });
    }

    await pool.query("DELETE FROM post_likes WHERE post_id = ?", [id]);
    await pool.query("DELETE FROM reports WHERE target_type = ? AND target_id = ?", ["post", id]);
    await pool.query(
      "DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE post_id = ?)",
      [id],
    );
    await pool.query(
      "DELETE FROM reports WHERE target_type = ? AND target_id IN (SELECT id FROM comments WHERE post_id = ?)",
      ["comment", id],
    );
    await pool.query("DELETE FROM comments WHERE post_id = ?", [id]);
      await pool.query("DELETE FROM posts WHERE id = ?", [id]);

      return NextResponse.json({ message: "Deleted" });
    } catch (error) {
      console.error("delete post error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}
