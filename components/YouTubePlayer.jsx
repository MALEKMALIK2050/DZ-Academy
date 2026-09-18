export function extractYouTubeId(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function YouTubePlayer({
  support,
  videoId: propVideoId,
  supportId: propSupportId,
}) {
  const videoId = propVideoId || support?.videoId || extractYouTubeId(support?.url);
  const supportId = propSupportId || support?.id || "main";

  if (!videoId) {
    return (
      <a
        href={support?.url}
        target="_blank"
        rel="noreferrer"
        style={{
          background: "#f7fafc",
          border: "1px solid #e2e8f0",
          padding: "1rem",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          textDecoration: "none",
          color: "#2d3748",
          marginBottom: "0.75rem",
        }}
      >
        <span
          style={{
            background: "#3182ce",
            color: "white",
            padding: "0.3rem 0.8rem",
            borderRadius: "6px",
            fontSize: "0.8rem",
            fontWeight: "600",
          }}
        >
          VIDÉO
        </span>
        <span style={{ color: "#3182ce", fontWeight: "500" }}>
          {support?.nom || support?.url || "Ouvrir la vidéo"}
        </span>
        <span style={{ marginLeft: "auto", color: "#a0aec0" }}>→</span>
      </a>
    );
  }

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        overflow: "hidden",
        marginBottom: "0.75rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Titre */}
      {support?.nom && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid #e2e8f0",
            fontWeight: "bold",
            color: "#2d3748",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>🎬</span>
          <span>{support.nom}</span>
        </div>
      )}

      {/* Cadre vidéo 16:9 responsive natif — lecture directe garantie sans blocage */}
      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, background: "#000" }}>
        <iframe
          id={`yt-player-${supportId}`}
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
          title={support?.nom || "Vidéo YouTube"}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
