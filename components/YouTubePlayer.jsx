import { useEffect, useRef, useState } from "react";

function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

const YouTubePlayer = ({ videoId: propVideoId, supportId: propSupportId, onProgressUpdate, support, onProgress }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const lastPositionRef = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);
  const reportedEventsRef = useRef([]);

  const supportId = propSupportId || support?.id;
  const videoId = propVideoId || support?.videoId || extractYouTubeId(support?.url);
  const progressCallback = onProgressUpdate || onProgress;

  // ✅ Charger YouTube API au montage
  useEffect(() => {
    if (!videoId) {
      setError("URL ou ID de vidéo invalide");
      return;
    }

    // Si API déjà chargée, initialiser directement
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    // Charger YouTube API seulement si pas encore chargée
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      console.log("✅ YouTube API chargée");
      initializePlayer();
    };

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Détruire le player proprement
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  const initializePlayer = () => {
    if (!containerRef.current || playerRef.current) return;

    console.log("🎬 Initialisation player pour:", videoId);

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: "500",
      width: "100%",
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    });
  };

  const onPlayerReady = (event) => {
    console.log("🎬 Player prêt");
    setIsReady(true);

    // ✅ Récupérer et restaurer la position
    fetchLastPosition();
  };

  const fetchLastPosition = async () => {
    try {
      const res = await fetch(`/api/video/progress?supportId=${supportId}`);
      const data = await res.json();

      if (data.lastPosition && data.lastPosition > 0) {
        console.log(`📍 Restauration position: ${data.lastPosition}s`);
        lastPositionRef.current = data.lastPosition;
        
        // Seek et pause
        playerRef.current.seekTo(lastPositionRef.current);
        setTimeout(() => {
          playerRef.current.pauseVideo();
        }, 500);
      }
    } catch (err) {
      console.error("Erreur lecture position:", err);
    }
  };

  const onPlayerStateChange = (event) => {
    const { PLAYING, PAUSED, ENDED } = window.YT.PlayerState;

    if (event.data === PLAYING) {
      console.log("▶️ Lecture...");
      startTracking();
    } else if (event.data === PAUSED) {
      console.log("⏸ Pause");
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else if (event.data === ENDED) {
      console.log("✅ Fin vidéo");
      trackProgress(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const onPlayerError = (event) => {
    console.error("❌ Erreur vidéo:", event.data);
    setError(`Erreur vidéo (code ${event.data})`);
  };

  const startTracking = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      trackProgress(false);
    }, 10000); // Toutes les 10 secondes
  };

  const trackProgress = async (isFinal = false) => {
    if (!playerRef.current || !isReady) return;

    try {
      const currentTime = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      lastPositionRef.current = currentTime;

      const progression = duration > 0 ? (currentTime / duration) * 100 : 0;

      // Déterminer les événements de progression (25, 50, 75, 100)
      let event = null;
      if (progression >= 100) event = 100;
      else if (progression >= 75 && !reportedEventsRef.current.includes(75))
        event = 75;
      else if (progression >= 50 && !reportedEventsRef.current.includes(50))
        event = 50;
      else if (progression >= 25 && !reportedEventsRef.current.includes(25))
        event = 25;

      if (event && !reportedEventsRef.current.includes(event)) {
        reportedEventsRef.current.push(event);
      }

      console.log(
        `📊 Progression: ${progression.toFixed(0)}% | Position: ${currentTime.toFixed(0)}s`
      );

      // Envoyer au serveur
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

      if (res.ok) {
        const data = await res.json();
        if (progressCallback) {
          progressCallback({
            supportId,
            progression: data.progression,
            completed: data.completed,
            events: data.events,
          });
        }
      }
    } catch (err) {
      console.error("Erreur tracking:", err);
    }
  };

  // ✅ Sauvegarder position avant de quitter
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lastPositionRef.current > 0) {
        navigator.sendBeacon(
          "/api/video/progress",
          JSON.stringify({
            supportId,
            lastPosition: lastPositionRef.current,
          })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [supportId]);

  return (
    <div style={{ background: "#000", borderRadius: "12px", overflow: "hidden" }}>
      {error && (
        <div style={{ color: "#ff6b6b", padding: "1rem", textAlign: "center" }}>
          ❌ {error}
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
};

export default YouTubePlayer;
