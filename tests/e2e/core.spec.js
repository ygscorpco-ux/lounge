import { test, expect } from "@playwright/test";

const USERNAME = process.env.E2E_USERNAME || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "";

function makeUniqueText(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function login(page, username, password) {
  const response = await page.request.post("/api/auth/login", {
    data: { username, password },
  });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Login failed (${response.status()}): ${body}`);
  }
}

async function registerAndLogin(page) {
  const username = `e2e${Math.random().toString(36).slice(2, 8)}`;
  const password = "pass1234!";

  const registerResponse = await page.request.post("/api/auth/register", {
    data: { username, password },
  });
  if (!registerResponse.ok() && registerResponse.status() !== 409) {
    const body = await registerResponse.text();
    throw new Error(`Register failed (${registerResponse.status()}): ${body}`);
  }
  await login(page, username, password);
}

async function ensureUserSession(page) {
  if (USERNAME && PASSWORD) {
    await login(page, USERNAME, PASSWORD);
    return;
  }
  await registerAndLogin(page);
}

async function createPostByApi(page, options = {}) {
  const title = options.title || makeUniqueText("e2e-post");
  const content = options.content || `${title} content`;
  const idempotencyKey = makeUniqueText("post-key");
  const response = await page.request.post("/api/posts", {
    headers: { "x-idempotency-key": idempotencyKey },
    data: {
      category: "\uC790\uC720",
      title,
      content,
      isNotice: !!options.isNotice,
      noticeStartAt: options.noticeStartAt || null,
      noticeEndAt: options.noticeEndAt || null,
      images: [],
      poll: null,
    },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return { postId: data.postId, title, content };
}

test.describe("core lounge flows", () => {
  test("scroll position restores after opening a post and going back", async ({ page }) => {
    await ensureUserSession(page);

    for (let index = 0; index < 24; index += 1) {
      await createPostByApi(page, {
        title: makeUniqueText(`e2e-scroll-${index}`),
      });
    }

    await page.goto("/");
    const cards = page.locator("[data-testid='feed-post-card']");
    await expect(cards.first()).toBeVisible();

    const scrollContainer = page.locator("[data-app-scroll-container='1']");
    await scrollContainer.evaluate((element) => {
      element.scrollTop = 1200;
      element.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(250);

    const beforeScrollTop = await scrollContainer.evaluate((element) => element.scrollTop);
    await cards.nth(5).click();
    await expect(page).toHaveURL(/\/post\/\d+/);

    await page.getByTestId("post-detail-back").click();
    await expect(page).toHaveURL("/");

    const afterScrollTop = await scrollContainer.evaluate((element) => element.scrollTop);
    expect(afterScrollTop).toBeGreaterThan(beforeScrollTop - 260);
  });

  test("create post from write page", async ({ page }) => {
    await ensureUserSession(page);

    const title = makeUniqueText("e2e-write-title");
    const content = makeUniqueText("e2e-write-content");

    await page.goto("/post/write");
    await page.getByTestId("write-title-input").fill(title);
    await page.getByTestId("write-content-input").fill(content);
    await page.getByTestId("write-submit").click();

    await expect(page).toHaveURL("/");
    await expect(page.locator("[data-testid='feed-post-card']", { hasText: title }).first()).toBeVisible();
  });

  test("create comment in post detail", async ({ page }) => {
    await ensureUserSession(page);

    const created = await createPostByApi(page, {
      title: makeUniqueText("e2e-comment-post"),
      content: makeUniqueText("e2e-comment-body"),
    });
    const commentText = makeUniqueText("e2e-comment");

    await page.goto(`/post/${created.postId}`);
    await page.getByTestId("comment-input").fill(commentText);
    await page.getByTestId("comment-submit").click();

    await expect(page.getByText(commentText)).toBeVisible();
  });

  test("notice appears for normal users when visible schedule is active", async ({ page }) => {
    test.skip(!ADMIN_USERNAME || !ADMIN_PASSWORD, "Admin credentials are required for notice e2e");

    await login(page, ADMIN_USERNAME, ADMIN_PASSWORD);

    const startAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const endAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const noticeTitle = makeUniqueText("e2e-notice");

    await createPostByApi(page, {
      title: noticeTitle,
      content: makeUniqueText("e2e-notice-body"),
      isNotice: true,
      noticeStartAt: startAt,
      noticeEndAt: endAt,
    });

    await page.request.post("/api/auth/logout");
    await ensureUserSession(page);

    const response = await page.request.get(
      `/api/posts?noticeOnly=1&sort=latest&page=1&t=${Date.now()}`,
    );
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect((data.posts || []).some((post) => post.title === noticeTitle)).toBeTruthy();
  });
});
