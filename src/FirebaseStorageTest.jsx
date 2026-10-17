
import { useState } from "react";
import { uploadMedia } from "./services/storage";

export default function FirebaseStorageTest() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) {
      setMessage("Please select an image first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await uploadMedia(file);
      setImageUrl(result);
      setMessage("Upload successful!");
    } catch (error) {
      setMessage(`Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#111827",
      color: "#ffffff",
      fontFamily: "Arial, sans-serif",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "24px"
    }}>
      <section style={{
        background: "#1f2937",
        padding: "32px",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "420px",
        boxSizing: "border-box"
      }}>
        <h1 style={{ color: "#a78bfa" }}>Vibely</h1>
        <h2>Firebase Storage Upload Test</h2>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ margin: "20px 0", maxWidth: "100%" }}
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            background: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "wait" : "pointer"
          }}
        >
          {loading ? "Uploading..." : "Test Upload"}
        </button>

        <p style={{ color: "#e5e7eb", overflowWrap: "anywhere" }}>
          {message}
        </p>

        {imageUrl && (
          <img
            src={imageUrl}
            alt="Uploaded image"
            style={{
              width: "100%",
              marginTop: "16px",
              borderRadius: "12px"
            }}
          />
        )}
      </section>
    </main>
  );
}
