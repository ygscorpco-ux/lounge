const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";

export function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("res.cloudinary.com") && url.includes(CLOUDINARY_UPLOAD_SEGMENT);
}

function clampDimension(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.round(parsed);
}

export function buildCloudinaryOptimizedUrl(url, options = {}) {
  if (!isCloudinaryUrl(url)) return url;

  const width = clampDimension(options.width, 240);
  const height = clampDimension(options.height, 240);
  const quality = options.quality || "auto";
  const format = options.format || "auto";
  const crop = options.crop || "fill";

  const transform = `f_${format},q_${quality},c_${crop},w_${width},h_${height}`;
  return url.replace(CLOUDINARY_UPLOAD_SEGMENT, `${CLOUDINARY_UPLOAD_SEGMENT}${transform}/`);
}

export function buildThumbnailUrl(url, width = 240, height = 240) {
  return buildCloudinaryOptimizedUrl(url, {
    width,
    height,
    quality: "auto",
    format: "auto",
    crop: "fill",
  });
}
