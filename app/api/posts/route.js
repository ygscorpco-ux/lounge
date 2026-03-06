export const dynamic = "force-dynamic";
export const revalidate = 0;

import pool from "../../../lib/db.js";
import { getCurrentUser } from "../../../lib/auth.js";
import { containsBannedWord } from "../../../lib/utils.js";
import { PAGE_SIZE } from "../../../lib/constants.js";
import { ensureNoticeSettingsColumns } from "../../../lib/notice-settings.js";
import { fetchPostsPage } from "../../../lib/posts-query.js";
import {
  clearIdempotencyKey,
  completeIdempotencyKey,
  hashIdempotencyPayload,
  reserveIdempotencyKey,
} from "../../../lib/idempotency.js";
import { withApiMonitoring } from "../../../lib/monitoring.js";
import { NextResponse } from "next/server";

const ADMIN_DISPLAY_NAME = "\uC5FC\uAD11\uC0AC";

export async function GET(request) {
  return withApiMonitoring("posts.GET", async () => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page"), 10) || 1;
      const category = searchParams.get("category");
      const sort = searchParams.get("sort") || "latest";
      const noticeOnly = searchParams.get("noticeOnly") === "1";
      const excludeNotice = searchParams.get("excludeNotice") === "1";
      const cursorToken = searchParams.get("cursor") || "";

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
          page,
          pageSize: PAGE_SIZE,
          category,
          sort,
          noticeOnly,
          excludeNotice,
          blockedIds,
          isAdminUser,
          cursorToken,
        });

      let result;
      try {
        result = await runQuery();
      } catch (queryError) {
        if (queryError?.code !== "ER_BAD_FIELD_ERROR") {
          throw queryError;
        }
        // Run one-time migration only when legacy schema is detected.
        await ensureNoticeSettingsColumns();
        result = await runQuery();
      }

      return NextResponse.json({
        posts: result.posts,
        page: result.page,
        pageSize: result.pageSize,
        nextCursor: result.nextCursor,
      });
    } catch (error) {
      console.error("posts list error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}

export async function POST(request) {
  return withApiMonitoring("posts.POST", async () => {
    let user = null;
    let idempotencyKey = "";
    let idempotencyReserved = false;

    try {
      user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Login required" }, { status: 401 });
      }

      await ensureNoticeSettingsColumns();

      const [bannedRows] = await pool.query(
        "SELECT is_banned FROM users WHERE id = ?",
        [user.id],
      );
      if (bannedRows.length > 0 && bannedRows[0].is_banned) {
        return NextResponse.json(
          { error: "Account restricted" },
          { status: 403 },
        );
      }

      const {
        category,
        title,
        content,
        isNotice,
        images,
        poll,
        noticeStartAt,
        noticeEndAt,
      } = await request.json();
      idempotencyKey =
        (request.headers.get("x-idempotency-key") || "").trim().slice(0, 128);

      if (!category || !title || !content) {
        return NextResponse.json(
          { error: "All fields required" },
          { status: 400 },
        );
      }

      const hasBanned = await containsBannedWord(`${title} ${content}`);
      if (hasBanned) {
        return NextResponse.json(
          { error: "Inappropriate content detected" },
          { status: 400 },
        );
      }

      if (category === ADMIN_DISPLAY_NAME && user.role !== "admin") {
        return NextResponse.json(
          { error: "Admin only category" },
          { status: 403 },
        );
      }

      const notice = isNotice && user.role === "admin";
      const imagesJson =
        Array.isArray(images) && images.length > 0
          ? JSON.stringify(images.slice(0, 4))
          : null;
      const parsedNoticeStart = noticeStartAt ? new Date(noticeStartAt) : null;
      const parsedNoticeEnd = noticeEndAt ? new Date(noticeEndAt) : null;

      if (
        notice &&
        parsedNoticeStart &&
        parsedNoticeEnd &&
        !Number.isNaN(parsedNoticeStart.getTime()) &&
        !Number.isNaN(parsedNoticeEnd.getTime()) &&
        parsedNoticeStart.getTime() > parsedNoticeEnd.getTime()
      ) {
        return NextResponse.json(
          { error: "Notice start must be earlier than end time" },
          { status: 400 },
        );
      }

      const validPoll =
        poll &&
        poll.question &&
        poll.question.trim() &&
        Array.isArray(poll.options) &&
        poll.options.filter((option) => option && option.trim()).length >= 2;

      const requestHash = hashIdempotencyPayload({
        category,
        title,
        content,
        isNotice: notice,
        images: Array.isArray(images) ? images.slice(0, 4) : [],
        poll: validPoll
          ? {
              question: poll.question.trim(),
              options: poll.options
                .filter((option) => option && option.trim())
                .map((option) => option.trim()),
            }
          : null,
        noticeStartAt: noticeStartAt || null,
        noticeEndAt: noticeEndAt || null,
      });
      const idempotency = await reserveIdempotencyKey({
        userId: user.id,
        scope: "posts.create",
        idempotencyKey,
        requestHash,
      });
      if (idempotency.mode === "conflict") {
        return NextResponse.json(
          { error: "Idempotency key reused with different payload" },
          { status: 409 },
        );
      }
      if (idempotency.mode === "processing") {
        return NextResponse.json(
          { error: "Same request is already being processed" },
          { status: 409 },
        );
      }
      if (idempotency.mode === "replay") {
        return NextResponse.json(idempotency.body, {
          status: idempotency.status,
        });
      }
      idempotencyReserved = idempotency.mode === "new";

      // Guard against accidental double-submit (double tap / network retry).
      const [dupRows] = await pool.query(
        `SELECT id
         FROM posts
         WHERE user_id = ?
           AND title = ?
           AND content = ?
           AND created_at >= (NOW() - INTERVAL 15 SECOND)
         ORDER BY id DESC
         LIMIT 1`,
        [user.id, title, content],
      );
      if (dupRows.length > 0) {
        const responseBody = { error: "Duplicate submission detected" };
        if (idempotencyReserved) {
          await completeIdempotencyKey({
            userId: user.id,
            scope: "posts.create",
            idempotencyKey,
            status: 409,
            body: responseBody,
          });
        }
        return NextResponse.json(responseBody, { status: 409 });
      }

      const [result] = await pool.query(
        `INSERT INTO posts
         (user_id, category, title, content, is_notice, images, has_poll, notice_start_at, notice_end_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          category,
          title,
          content,
          notice,
          imagesJson,
          validPoll ? true : false,
          notice && parsedNoticeStart && !Number.isNaN(parsedNoticeStart.getTime())
            ? parsedNoticeStart
            : null,
          notice && parsedNoticeEnd && !Number.isNaN(parsedNoticeEnd.getTime())
            ? parsedNoticeEnd
            : null,
        ],
      );

      const postId = result.insertId;

      if (validPoll) {
        const [pollResult] = await pool.query(
          "INSERT INTO polls (post_id, question) VALUES (?, ?)",
          [postId, poll.question.trim()],
        );
        const pollId = pollResult.insertId;
        const options = poll.options.filter((option) => option && option.trim());

        for (const optionText of options) {
          await pool.query(
            "INSERT INTO poll_options (poll_id, text) VALUES (?, ?)",
            [pollId, optionText.trim()],
          );
        }
      }

      const responseBody = { message: "Posted", postId };
      if (idempotencyReserved) {
        await completeIdempotencyKey({
          userId: user.id,
          scope: "posts.create",
          idempotencyKey,
          status: 201,
          body: responseBody,
        });
      }

      return NextResponse.json(responseBody, { status: 201 });
    } catch (error) {
      if (idempotencyReserved && user) {
        try {
          await clearIdempotencyKey({
            userId: user.id,
            scope: "posts.create",
            idempotencyKey,
          });
        } catch (cleanupError) {
          console.error("idempotency cleanup error:", cleanupError);
        }
      }
      console.error("create post error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}
