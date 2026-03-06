const POST_SEED_KEY = "lounge-post-detail-seed-v1";
const POST_SEED_TTL_MS = 1000 * 60 * 15;

function hasSessionStorage() {
  return typeof window !== "undefined" && !!window.sessionStorage;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizePostSeed(rawPost) {
  if (!rawPost || typeof rawPost !== "object") return null;
  const id = toNumber(rawPost.id, 0);
  if (id <= 0) return null;

  const images = Array.isArray(rawPost.images)
    ? rawPost.images.filter((item) => typeof item === "string" && item.length > 0)
    : [];

  const createdAt = rawPost.createdAt
    ? String(rawPost.createdAt)
    : new Date().toISOString();

  return {
    id,
    category: rawPost.category ? String(rawPost.category) : "",
    title: rawPost.title ? String(rawPost.title) : "",
    content: rawPost.content ? String(rawPost.content) : "",
    author: rawPost.author ? String(rawPost.author) : "",
    isNotice: !!rawPost.isNotice,
    likeCount: toNumber(rawPost.likeCount, 0),
    commentCount: toNumber(rawPost.commentCount, 0),
    createdAt,
    isAuthor: !!rawPost.isAuthor,
    isAdmin: !!rawPost.isAdmin,
    alreadyLiked: !!rawPost.alreadyLiked,
    userId: rawPost.userId == null ? null : toNumber(rawPost.userId, null),
    images,
    poll:
      rawPost.poll && typeof rawPost.poll === "object"
        ? rawPost.poll
        : null,
  };
}

export function savePostSeed(rawPost) {
  if (!hasSessionStorage()) return;
  const post = normalizePostSeed(rawPost);
  if (!post) return;

  try {
    window.sessionStorage.setItem(
      POST_SEED_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        post,
      }),
    );
  } catch {
    // ignore storage write failures
  }
}

export function readPostSeed(postId) {
  if (!hasSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(POST_SEED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const savedAt = toNumber(parsed?.savedAt, 0);
    if (!savedAt || Date.now() - savedAt > POST_SEED_TTL_MS) return null;

    const post = normalizePostSeed(parsed?.post);
    if (!post) return null;

    const targetId = toNumber(postId, 0);
    if (targetId > 0 && post.id !== targetId) return null;
    return post;
  } catch {
    return null;
  }
}
