import { useEffect, useRef, useState, useCallback } from "react";

export default function YouTubePlayer({ support, userId, onProgress }) {
  const containerRef   = useRef(null);
  const playerObj      = useRef(null);
  const intervalRef    = useRef(null);
  const reportedEvents = useRef([]);
  const lastPositionRef = useRef(0);
  const progressionRef  = useRef(0);
  const isInitialized   = useRef(false);

  const [progression, setProgression] = useState(0);
  const [completed,   setCompleted]   = useState(false);

  const videoId = support.videoId;

  // ✅ Charger progression UNE SEULE FOIS
  useEffect(() => {
    if (!support.id) return;
    fetch(`/api/video/progress?supportId=${support.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        lastPositionRef.current  = data.lastPosition || 0;
        progressionRef.current   = data.progression  || 0;
        reportedEvents.current   = data.events       || [];
        setProgression(data.progression || 0);
        setCompleted(data.completed     || false);
      })
      .catch(() => {});
  }, [support.id]); // ✅ dépend uniquement de support.id

  // ✅ Initialiser le player UNE SEULE FOIS
  useEffect(() => {
    if (!videoId || isInitialized.current) return;
    isInitialized.current = true;

    const loadAPI = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        // Éviter de charger le script deux fois
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement("script");
          tag.src   = "https://www.youtube.com/iframe_api";
          document.head.appendChild(tag);
        }
        window.onYouTubeIframeAPIReady = initPlayer;
      }
    };

    loadAPI();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // ✅ Ne pas détruire le player pour éviter les coupures
    };
  }, [videoId]); // ✅ dépend uniquement de videoId

  const initPlayer = useCallback(() => {
    if (!containerRef.current || playerObj.current) return;

    playerObj.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        start:          Math.floor(lastPositionRef.current),
        rel:            0,
        modestbranding: 1,
        playsinline:    1,
      },
      events: {
        onReady:       onPlayerReady,
        onStateChange: onStateChange,
      },
    });
  }, [videoId]);

  const onPlayerReady = (event) => {
    if (lastPositionRef.current > 5) {
      event.target.seekTo(lastPositionRef.current, true);
      event.target.pauseVideo(); // ✅ pause après seek
    }
  };

  const onStateChange = (event) => {
    const YT = window.YT.PlayerState;

    if (event.data === YT.PLAYING) {
      // ✅ Tracking toutes les 10 secondes (moins fréquent = moins de coupures)
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => trackProgress(false), 10000);
    }

    if (event.data === YT.PAUSED) {
      clearInterval(intervalRef.current);
      trackProgress(false);
    }

    if (event.data === YT.ENDED) {
      clearInterval(intervalRef.current);
      trackProgress(true);
    }
  };

  const trackProgress = async (ended = false) => {
    if (!playerObj.current?.getCurrentTime) return;

    const duration    = playerObj.current.getDuration();
    const currentTime = playerObj.current.getCurrentTime();
    if (!duration || duration === 0) return;

    const pct = ended ? 100 : Math.round((currentTime / duration) * 100);

    // ✅ Mettre à jour refs sans provoquer re-render
    lastPositionRef.current = currentTime;
    progressionRef.current  = Math.max(progressionRef.current, pct);

    // Détecter events
    let event = null;
    const events = [25, 50, 75, 100];
    for (const e of events) {
      if (pct >= e && !reportedEvents.current.includes(e)) {
        event = e;
        reportedEvents.current = [...reportedEvents.current, e];
        break;
      }
    }

    // ✅ Mettre à jour UI seulement si changement significatif (±5%)
    if (Math.abs(pct - progression) >= 5 || ended) {
      setProgression(progressionRef.current);
    }

    try {
      const res = await fetch("/api/video/progress", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          supportId:    support.id,
          progression:  progressionRef.current,
          event,
          lastPosition: currentTime,
        }),
      });
      const data = await res.json();

      if (data.completed && !completed) {
        setCompleted(true);
        onProgress?.({ supportId: support.id, completed: true, progression: 100 });
      }
    } catch {}
  };

  if (!videoId) {
    return (
      <a href={support.url} target="_blank" rel="noreferrer"
        style={{ background: "#f7fafc", border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "10px", display: "flex", alignItems: "center", gap: "1rem", textDecoration: "none", color: "#2d3748" }}>
        <span style={{ background: "#3182ce", color: "white", padding: "0.3rem 0.8rem", borderRadius: "6px", fontSize: "0.8rem" }}>VIDEO</span>
        <span style={{ color: "#3182ce" }}>{support.nom || support.url}</span>
        <span style={{ marginLeft: "auto" }}>→</span>
      </a>
    );
  }

  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", marginBottom: "0.75rem" }}>

      {/* Titre */}
      {support.nom && (
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", fontWeight: "bold", color: "#2d3748", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>🎬 {support.nom}</span>
          {completed && (
            <span style={{ background: "#38a169", color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem" }}>
              ✅ Complété
            </span>
          )}
        </div>
      )}

      {/* ✅ Container fixe — ne change jamais */}
      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, background: "#000" }}>
        <div
          ref={containerRef}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        />
      </div>

      {/* Barre progression */}
      <div style={{ padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#718096", marginBottom: "0.3rem" }}>
          <span>Progression vidéo</span>
          <span style={{ fontWeight: "bold", color: completed ? "#38a169" : "#3182ce" }}>{progression}%</span>
        </div>
        <div style={{ background: "#e2e8f0", borderRadius: "10px", height: "6px", overflow: "hidden" }}>
          <div style={{
            background: completed ? "#38a169" : progression > 50 ? "#3182ce" : "#dd6b20",
            width: `${progression}%`, height: "100%", transition: "width 1s ease"
          }} />
        </div>

        {/* Milestones */}
        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
          {[25, 50, 75, 100].map((e) => (
            <span key={e} style={{
              padding: "0.1rem 0.5rem", borderRadius: "10px", fontSize: "0.7rem",
              background: reportedEvents.current.includes(e) ? "#38a169" : "#e2e8f0",
              color:      reportedEvents.current.includes(e) ? "white"    : "#718096",
              transition: "all 0.3s",
            }}>
              {e}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}