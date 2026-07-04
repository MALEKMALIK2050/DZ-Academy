import { useRef, useState, useCallback } from "react";
import YouTube from "react-youtube";

function extractYouTubeId(url) {
  if (!url) return null;
  // Gère youtu.be, youtube.com/watch?v=, /embed/, /shorts/
  const regExp =
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

const YouTubePlayer = ({
  videoId: propVideoId,
  supportId: propSupportId,
  onProgressUpdate,
  support,
  onProgress,
  userId,
}) => {
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const lastPositionRef = useRef(0);
  const reportedEventsRef = useRef([]);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);

  const supportId = propSupportId || support?.id;
  const videoId = propVideoId || support?.videoId || extractYouTubeId(support?.url);
  const progressCallback = onProgressUpdate || onProgress;

  // Options du player YouTube
  const opts = {
    height: "500",
    width: "100%",
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      origin:
        typeof window !== "undefined" ? window.location.origin : "",
    },
  };

  // Restaurer la dernière position depuis l'API
  const fetchAndRestorePosition = useCallback(
    async (player) => {
      if (!supportId) return;
      try {
        const res = await fetch(`/api/video/progress?supportId=${supportId}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.lastPosition && data.lastPosition > 5) {
          lastPositionRef.current = data.lastPosition;
          player.seekTo(data.lastPosition, true);
          player.pauseVideo();
        }
      } catch (err) {
        console.error("Erreur restauration position:", err);
      }
    },
    [supportId]
  );

  const trackProgress = useCallback(
    async (isFinal = false) => {
      const player = playerRef.current;
      if (!player || !isReady) return;
      try {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        lastPositionRef.current = currentTime;
        const progression = duration > 0 ? (currentTime / duration) * 100 : 0;

        // Jalons : 25, 50, 75, 100
        let event = null;
        const milestones = [25, 50, 75, 100];
        for (const m of milestones) {
          if (
            progression >= m &&
            !reportedEventsRef.current.includes(m)
          ) {
            reportedEventsRef.current.push(m);
            event = m;
          }
        }

        const res = await fetch("/api/video/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            supportId,
            progression,
            event,
            lastPosition: currentTime,
            duration,
          }),
        });

        if (res.ok && progressCallback) {
          const data = await res.json();
          progressCallback({
            supportId,
            progression: data.progression,
            completed: data.completed,
            events: data.events,
          });
        }
      } catch (err) {
        console.error("Erreur tracking:", err);
      }
    },
    [isReady, supportId, progressCallback]
  );

  // Handlers du player
  const onReady = useCallback(
    (event) => {
      playerRef.current = event.target;
      setIsReady(true);
      fetchAndRestorePosition(event.target);
    },
    [fetchAndRestorePosition]
  );

  const onStateChange = useCallback(
    (event) => {
      const YT = window.YT?.PlayerState;
      if (!YT) return;
      if (event.data === YT.PLAYING) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => trackProgress(false), 10000);
      } else if (event.data === YT.PAUSED) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        trackProgress(false);
      } else if (event.data === YT.ENDED) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        trackProgress(true);
      }
    },
    [trackProgress]
  );

  const onError = useCallback((event) => {
    const codes = {
      2: "URL invalide",
      5: "Erreur lecteur HTML5",
      100: "Vidéo introuvable ou privée",
      101: "Lecture non autorisée en iframe",
      150: "Lecture non autorisée en iframe",
    };
    setError(codes[event.data] || `Erreur YouTube (code ${event.data})`);
  }, []);

  if (!videoId) {
    return (
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: "12px",
          padding: "2rem",
          textAlign: "center",
          color: "#ff6b6b",
        }}
      >
        ❌ URL ou ID de vidéo invalide
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#000",
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {error && (
        <div
          style={{
            background: "#1a1a2e",
            color: "#ff6b6b",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          ❌ {error}
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noreferrer"
            style={{
              marginLeft: "auto",
              color: "#60a5fa",
              fontSize: "0.8rem",
              textDecoration: "underline",
            }}
          >
            Ouvrir sur YouTube ↗
          </a>
        </div>
      )}
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        onError={onError}
        style={{ display: "block" }}
      />
    </div>
  );
};

export default YouTubePlayer;
