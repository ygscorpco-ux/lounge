"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function WritePage() {
  const router = useRouter();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isNotice, setIsNotice] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [poll, setPoll] = useState(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return undefined;

    let startY = 0;
    const onTouchStart = (event) => {
      startY = event.touches[0].clientY;
    };
    const onTouchMove = (event) => {
      if (element.scrollTop === 0 && event.touches[0].clientY > startY) {
        event.preventDefault();
      }
    };

    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => {
        if (!response.ok) {
          router.replace("/login");
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (data?.user?.role === "admin") setIsAdmin(true);
      });
  }, [router]);

  function handleContentChange(event) {
    setContent(event.target.value);
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  async function compressImage(file) {
    return new Promise((resolve) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        const MAX_SIZE = 1200;
        let { width, height } = image;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height / width) * MAX_SIZE);
            width = MAX_SIZE;
          } else {
            width = Math.round((width / height) * MAX_SIZE);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(image, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);

        canvas.toBlob(
          (blob) => resolve(new File([blob], "image.jpg", { type: "image/jpeg" })),
          "image/jpeg",
          0.82,
        );
      };

      image.src = objectUrl;
    });
  }

  async function handleImageSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (images.length >= 4) {
      setError("\uC774\uBBF8\uC9C0\uB294 \uCD5C\uB300 4\uC7A5\uAE4C\uC9C0 \uCCA8\uBD80\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setError("");

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressed);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "\uC774\uBBF8\uC9C0 \uC5C5\uB85C\uB4DC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
      } else {
        setImages((prev) => [...prev, data.url]);
      }
    } catch (uploadError) {
      console.error(uploadError);
      setError("\uC774\uBBF8\uC9C0 \uC5C5\uB85C\uB4DC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }

    setUploading(false);
    event.target.value = "";
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePollOption(index, value) {
    setPoll((prev) => {
      const options = [...prev.options];
      options[index] = value;
      return { ...prev, options };
    });
  }

  function addPollOption() {
    if (!poll || poll.options.length >= 4) return;
    setPoll((prev) => ({ ...prev, options: [...prev.options, ""] }));
  }

  function removePollOption(index) {
    if (!poll || poll.options.length <= 2) return;
    setPoll((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit() {
    if (submitting) return;
    setError("");

    if (!title.trim()) {
      setError("\uC81C\uBAA9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
      return;
    }
    if (!content.trim()) {
      setError("\uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
      return;
    }

    if (poll) {
      if (!poll.question.trim()) {
        setError("\uD22C\uD45C \uC9C8\uBB38\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
        return;
      }
      const validOptions = poll.options.filter((option) => option.trim());
      if (validOptions.length < 2) {
        setError("\uD22C\uD45C \uD56D\uBAA9\uC740 2\uAC1C \uC774\uC0C1 \uD544\uC694\uD569\uB2C8\uB2E4.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "\uC790\uC720",
          title,
          content,
          isNotice: isAdmin ? isNotice : false,
          images,
          poll: poll
            ? {
                question: poll.question,
                options: poll.options.filter((option) => option.trim()),
              }
            : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "\uC791\uC131 \uC2E4\uD328");
      } else {
        router.push("/");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = title.trim() && content.trim() && !uploading && !submitting;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "480px",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        zIndex: 200,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        <button onClick={() => router.back()} style={{ background: "none", border: "none", padding: 4 }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <span style={{ fontSize: 17, fontWeight: 700, color: "#333" }}>
          {"\uAE00 \uC4F0\uAE30"}
        </span>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            background: "none",
            border: "none",
            fontSize: 15,
            color: canSubmit ? "#1b4797" : "#ccc",
            fontWeight: 700,
          }}
        >
          {submitting ? "\uB4F1\uB85D \uC911..." : "\uC644\uB8CC"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "10px 16px", background: "#fff5f5", color: "#e53e3e", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {isAdmin && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
            <input
              type="checkbox"
              checked={isNotice}
              onChange={(event) => setIsNotice(event.target.checked)}
              style={{ width: 18, height: 18, accentColor: "#1b4797" }}
            />
            <span style={{ fontSize: 14, color: "#333" }}>
              {"\uACF5\uC9C0\uB85C \uB4F1\uB85D"}
            </span>
          </label>
        )}

        <input
          type="text"
          placeholder={"\uC81C\uBAA9\uC744 \uC785\uB825\uD558\uC138\uC694."}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          style={{
            width: "100%",
            padding: "18px 16px 14px",
            border: "none",
            borderBottom: "1px solid #f0f0f0",
            fontSize: 18,
            fontWeight: 700,
            color: "#1a1a1a",
            outline: "none",
          }}
        />

        <textarea
          ref={textareaRef}
          placeholder={"\uB0B4\uC6A9\uC744 \uC785\uB825\uD558\uC138\uC694.\n#\uB9E4\uCD9C #\uC9C1\uC6D0\uAD00\uB9AC #\uC6B4\uC601"}
          value={content}
          onChange={handleContentChange}
          style={{
            width: "100%",
            padding: 16,
            border: "none",
            fontSize: 15,
            lineHeight: 1.7,
            color: "#333",
            outline: "none",
            resize: "none",
            overflow: "hidden",
            minHeight: 200,
          }}
        />

        {images.length > 0 && (
          <div style={{ padding: "0 16px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {images.map((url, index) => (
              <div key={index} style={{ position: "relative", width: 100, height: 100 }}>
                <img
                  src={url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, border: "1px solid #f0f0f0" }}
                />
                <button
                  onClick={() => removeImage(index)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    fontSize: 12,
                  }}
                >
                  {"\u2715"}
                </button>
              </div>
            ))}
          </div>
        )}

        {poll && (
          <div style={{ margin: "0 16px 16px", border: "1px solid #e8edf5", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#f0f4ff", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#1b4797", fontSize: 14, fontWeight: 700 }}>
                {"\uD22C\uD45C"}
              </span>
              <button onClick={() => setPoll(null)} style={{ border: "none", background: "none", color: "#999" }}>
                {"\uC0AD\uC81C"}
              </button>
            </div>

            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="text"
                placeholder={"\uD22C\uD45C \uC9C8\uBB38"}
                value={poll.question}
                onChange={(event) => setPoll((prev) => ({ ...prev, question: event.target.value }))}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 14, outline: "none" }}
              />

              {poll.options.map((option, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 20, fontSize: 13, color: "#999" }}>{index + 1}</span>
                  <input
                    type="text"
                    placeholder={`\uD56D\uBAA9 ${index + 1}`}
                    value={option}
                    onChange={(event) => updatePollOption(index, event.target.value)}
                    style={{ flex: 1, padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 14, outline: "none" }}
                  />
                  {poll.options.length > 2 && (
                    <button onClick={() => removePollOption(index)} style={{ border: "none", background: "none", color: "#bbb" }}>
                      {"\u2715"}
                    </button>
                  )}
                </div>
              ))}

              {poll.options.length < 4 && (
                <button
                  onClick={addPollOption}
                  style={{ border: "1px dashed #c0cde0", background: "none", borderRadius: 8, padding: 9, color: "#1b4797", fontSize: 13 }}
                >
                  {"+ \uD56D\uBAA9 \uCD94\uAC00"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid #f0f0f0",
          padding: "10px 16px",
          paddingBottom: "max(10px, env(safe-area-inset-bottom))",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "#fff",
        }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />

        <button
          onClick={() => {
            if (!uploading && images.length < 4) fileInputRef.current?.click();
          }}
          style={{ border: "none", background: "none", color: images.length >= 4 ? "#ccc" : "#555", display: "flex", alignItems: "center", gap: 4 }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          {images.length > 0 && <span style={{ color: "#1b4797", fontSize: 12, fontWeight: 700 }}>{`${images.length}/4`}</span>}
        </button>

        <button
          onClick={() => !poll && setPoll({ question: "", options: ["", ""] })}
          style={{ border: "none", background: "none", color: poll ? "#1b4797" : "#555", display: "flex", alignItems: "center", gap: 4 }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          {poll && <span style={{ color: "#1b4797", fontSize: 12, fontWeight: 700 }}>{"\uD22C\uD45C"}</span>}
        </button>

        {uploading && <span style={{ fontSize: 12, color: "#999" }}>{"\uC5C5\uB85C\uB4DC \uC911..."}</span>}
      </div>
    </div>
  );
}
