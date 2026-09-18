import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "@/context/AuthContext";

export default function Visio() {
  const router = useRouter();
  const { user } = useAuth();
  const [visioData, setVisioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [mediaPermission, setMediaPermission] = useState("unknown");
  const [permissionMsg, setPermissionMsg] = useState("");
  const [useDirectIframe, setUseDirectIframe] = useState(false);

  // États pour l'enregistrement vidéo par l'hôte
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [recordedBlobSize, setRecordedBlobSize] = useState(0);
  const [showRecordingModal, setShowRecordingModal] = useState(false);

  const apiRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const { id, room } = router.query;

  // 1. Récupération des informations
  const fetchVisioDetails = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/visio/${id}?join=true`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setVisioData(data);
      }
    } catch (err) {
      console.error("خطأ تفاصيل الاجتماع:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!router.isReady) return;
    fetchVisioDetails();
    const interval = setInterval(fetchVisioDetails, 7000);
    return () => clearInterval(interval);
  }, [router.isReady, fetchVisioDetails]);

  // 2. Vérification permissions caméra / micro
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "camera" })
        .then((res) => {
          setMediaPermission(res.state === "granted" ? "granted" : res.state === "denied" ? "denied" : "prompt");
        })
        .catch(() => setMediaPermission("prompt"));
    } else {
      setMediaPermission("prompt");
    }
  }, []);

  // 3. Demander l'autorisation
  const requestMediaAccess = async () => {
    try {
      setPermissionMsg("⏳ جارٍ طلب الإذن من المتصفح...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setTimeout(() => {
        stream.getTracks().forEach((track) => track.stop());
      }, 400);
      setMediaPermission("granted");
      setPermissionMsg("✅ تم تفعيل الكاميرا والميكروفون بنجاح!");
    } catch (err) {
      setMediaPermission("denied");
      setPermissionMsg("🚫 الكاميرا/الميكروفون محظوران. انقر على القفل 🔒 في شريط العنوان للسماح.");
    }
  };

  const rawRoom = visioData?.roomName || room || "dz-academy-visio";
  const targetRoom = rawRoom.replace(/[^a-zA-Z0-9_-]/g, "");
  const displayName = user ? `${user.prenom} ${user.nom}` : "مشارك";
  const email = user?.email || "";
  const directJitsiUrl = `https://meet.jit.si/${targetRoom}#userInfo.displayName="${encodeURIComponent(displayName)}"`;

  const isHost = user && (user.role === "ADMIN" || (visioData?.organisateurId && visioData.organisateurId === user.id));

  // 4. Enregistrement vidéo
  const startRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: true,
      });

      let combinedStream = displayStream;

      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const dest = audioCtx.createMediaStreamDestination();

        if (displayStream.getAudioTracks().length > 0) {
          audioCtx.createMediaStreamSource(displayStream).connect(dest);
        }
        if (micStream.getAudioTracks().length > 0) {
          audioCtx.createMediaStreamSource(micStream).connect(dest);
        }

        combinedStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...dest.stream.getAudioTracks(),
        ]);
      } catch (micErr) {
        console.warn("تسجيل بدون مزج الميكروفون:", micErr);
      }

      recordingStreamRef.current = displayStream;
      recordedChunksRef.current = [];

      let mimeType = "video/webm;codecs=vp9,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8,opus";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/webm";
          if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "";
        }
      }

      const recorder = new MediaRecorder(combinedStream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType || "video/webm" });
        setRecordedBlobUrl(URL.createObjectURL(blob));
        setRecordedBlobSize((blob.size / (1024 * 1024)).toFixed(2));
        setShowRecordingModal(true);
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      displayStream.getVideoTracks()[0].onended = () => stopRecording();

      recorder.start(1000);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error("خطأ بدء التسجيل:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const downloadRecording = () => {
    if (!recordedBlobUrl) return;
    const a = document.createElement("a");
    a.href = recordedBlobUrl;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `تسجيل-${visioData?.titre || "اجتماع"}-${dateStr}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? String(h).padStart(2, "0") + ":" : ""}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // 5. Initialisation Jitsi (même config que Academy LMS)
  useEffect(() => {
    if (loading || typeof window === "undefined" || hasInitializedRef.current || useDirectIframe) return;

    const initJitsi = () => {
      const container = document.getElementById("jitsi-container");
      if (!container) return;

      container.innerHTML = "";
      hasInitializedRef.current = true;

      const domain = "meet.jit.si";
      const options = {
        roomName: targetRoom,
        width: "100%",
        height: "100%",
        parentNode: container,
        userInfo: { displayName, email },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinConfig: {
            enabled: false,
          },
          enableWelcomePage: false,
          disableDeepLinking: true,
          p2p: {
            enabled: true,
          },
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "desktop",
            "fullscreen",
            "fodeviceselection",
            "hangup",
            "chat",
            "raisehand",
            "videoquality",
            "filmstrip",
            "tileview",
            "participants-pane",
            "settings",
          ],
        },
      };

      try {
        // MutationObserver pour appliquer les permissions iframe dès l'injection
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (node.tagName === "IFRAME") {
                node.setAttribute(
                  "allow",
                  "camera *; microphone *; display-capture *; autoplay *; clipboard-write *; fullscreen *"
                );
              }
            }
          }
        });
        observer.observe(container, { childList: true });

        const api = new window.JitsiMeetExternalAPI(domain, options);
        apiRef.current = api;

        // Forcer les permissions iframe après 300ms au cas où
        setTimeout(() => {
          const iframe = container.querySelector("iframe");
          if (iframe) {
            iframe.setAttribute(
              "allow",
              "camera *; microphone *; display-capture *; autoplay *; clipboard-write *; fullscreen *"
            );
          }
        }, 300);

        api.addEventListener("audioMuteStatusChanged", ({ muted }) => setIsAudioMuted(muted));
        api.addEventListener("videoMuteStatusChanged", ({ muted }) => setIsVideoMuted(muted));
        api.addEventListener("screenSharingStatusChanged", ({ on }) => setIsScreenSharing(on));
        api.addEventListener("videoConferenceLeft", () => handleBackToDashboard());
      } catch (err) {
        console.error("خطأ Jitsi API:", err);
        setUseDirectIframe(true);
      }
    };

    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => setUseDirectIframe(true);
      document.body.appendChild(script);
    } else {
      initJitsi();
    }

    return () => {
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch (_) {}
        apiRef.current = null;
        hasInitializedRef.current = false;
      }
    };
  }, [loading, targetRoom, useDirectIframe, displayName, email]);

  const handleBackToDashboard = () => {
    if (isRecording) stopRecording();
    if (apiRef.current) {
      try { apiRef.current.dispose(); } catch (_) {}
      apiRef.current = null;
    }
    const targetUrl = user?.role ? `/dashboard/${user.role.toLowerCase()}` : "/dashboard";
    router.push(targetUrl);
  };

  // Contrôles
  const toggleAudio = () => { if (apiRef.current) apiRef.current.executeCommand("toggleAudio"); };
  const toggleVideo = () => { if (apiRef.current) apiRef.current.executeCommand("toggleVideo"); };
  const toggleScreen = () => { if (apiRef.current) apiRef.current.executeCommand("toggleShareScreen"); };
  const hangUp = () => { handleBackToDashboard(); };

  const copyLink = () => {
    const url = `${window.location.origin}/visio?id=${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Participants
  const participantsJoined = visioData?.participants?.filter((p) => p.statut === "REJOINT") || [];
  const participantsInvited = visioData?.participants?.filter((p) => p.statut !== "REJOINT") || [];

  // Timer
  const [sessionSeconds, setSessionSeconds] = useState(0);
  useEffect(() => {
    if (!visioData) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(visioData.dateDebut).getTime()) / 1000);
      setSessionSeconds(Math.max(0, elapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [visioData]);

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem", animation: "pulse 1.5s infinite" }}>📹</div>
          <p style={{ fontSize: "1.1rem", color: "#94a3b8" }}>جارٍ تحميل غرفة الاجتماع...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="visio-room-page">
      <Head>
        <title>{visioData?.titre || "اجتماع فيديو"} — دزأكاديمي</title>
      </Head>

      {/* Top Bar */}
      <header className="visio-top-bar">
        <div className="top-bar-right">
          <button className="btn-back" onClick={handleBackToDashboard}>
            → رجوع
          </button>
          <div className="session-info">
            <h2 className="session-title">{visioData?.titre || "اجتماع فيديو"}</h2>
            <span className="session-timer">⏱️ {formatDuration(sessionSeconds)}</span>
          </div>
        </div>

        <div className="top-bar-left">
          {/* Permission Warning */}
          {mediaPermission !== "granted" && (
            <button className="btn-permission" onClick={requestMediaAccess}>
              📷 تفعيل الكاميرا والميكروفون
            </button>
          )}

          {permissionMsg && (
            <span className="permission-msg">{permissionMsg}</span>
          )}

          <button className="btn-tool" onClick={copyLink} title="نسخ الرابط">
            {copied ? "✅ تم" : "🔗 نسخ الرابط"}
          </button>

          <button
            className={`btn-tool ${showParticipants ? "active" : ""}`}
            onClick={() => setShowParticipants(!showParticipants)}
          >
            👥 المشاركون ({visioData?._count?.participants || 0})
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="visio-main">
        {/* Video Container */}
        <div className="video-area">
          {useDirectIframe ? (
            <iframe
              src={directJitsiUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="camera *; microphone *; display-capture *; autoplay *; clipboard-write *; fullscreen *"
              allowFullScreen
            />
          ) : (
            <div id="jitsi-container" style={{ width: "100%", height: "100%" }} />
          )}
        </div>

        {/* Participants Drawer */}
        {showParticipants && (
          <aside className="participants-drawer">
            <div className="drawer-header">
              <h3>👥 المشاركون</h3>
              <span className="drawer-count">{visioData?._count?.participants || 0}</span>
              <button className="btn-close-drawer" onClick={() => setShowParticipants(false)}>✕</button>
            </div>

            <div className="drawer-stats">
              <div className="stat-box">
                <span className="stat-num">{participantsJoined.length}</span>
                <span className="stat-label">حاضر</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">{participantsInvited.length}</span>
                <span className="stat-label">مدعو</span>
              </div>
            </div>

            <div className="participants-list">
              {participantsJoined.length > 0 && (
                <>
                  <div className="list-subtitle">🟢 حاضرون الآن</div>
                  {participantsJoined.map((p) => (
                    <div key={p.id} className="participant-card is-present">
                      <div className="p-avatar" style={{ background: "#10b981" }}>
                        {p.user?.prenom?.[0] || "?"}
                        <span className="status-indicator online"></span>
                      </div>
                      <div className="p-details">
                        <div className="p-name">
                          {p.user?.prenom} {p.user?.nom}
                          {p.userId === visioData?.organisateurId && <span className="host-badge">المنظم</span>}
                        </div>
                        <div className="p-sub">
                          <span className="role-tag">{p.user?.role}</span>
                          <span className="status-tag tag-live">● متصل</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {participantsInvited.length > 0 && (
                <>
                  <div className="list-subtitle" style={{ marginTop: "0.8rem" }}>📩 مدعوون</div>
                  {participantsInvited.map((p) => (
                    <div key={p.id} className="participant-card">
                      <div className="p-avatar">
                        {p.user?.prenom?.[0] || "?"}
                        <span className="status-indicator offline"></span>
                      </div>
                      <div className="p-details">
                        <div className="p-name">{p.user?.prenom} {p.user?.nom}</div>
                        <div className="p-sub">
                          <span className="role-tag">{p.user?.role}</span>
                          <span className="status-tag tag-invited">مدعو</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="drawer-footer">
              <button className="btn-refresh-presence" onClick={fetchVisioDetails}>
                🔄 تحديث الحضور
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Controls */}
      {!useDirectIframe && (
        <footer className="media-controls-bar">
          <div className="controls-group">
            <button className={`ctrl-btn ${isAudioMuted ? "muted" : ""}`} onClick={toggleAudio} title={isAudioMuted ? "تشغيل الميكروفون" : "كتم الميكروفون"}>
              {isAudioMuted ? "🔇" : "🎤"}
              <span>{isAudioMuted ? "مكتوم" : "الميكروفون"}</span>
            </button>

            <button className={`ctrl-btn ${isVideoMuted ? "muted" : ""}`} onClick={toggleVideo} title={isVideoMuted ? "تشغيل الكاميرا" : "إيقاف الكاميرا"}>
              {isVideoMuted ? "📷" : "🎥"}
              <span>{isVideoMuted ? "معطلة" : "الكاميرا"}</span>
            </button>

            <button className={`ctrl-btn ${isScreenSharing ? "active-share" : ""}`} onClick={toggleScreen} title="مشاركة الشاشة">
              🖥️
              <span>{isScreenSharing ? "إيقاف المشاركة" : "مشاركة الشاشة"}</span>
            </button>

            {/* Enregistrement (hôte uniquement) */}
            {isHost && (
              <button
                className={`ctrl-btn ${isRecording ? "recording" : ""}`}
                onClick={isRecording ? stopRecording : startRecording}
                title={isRecording ? "إيقاف التسجيل" : "بدء التسجيل"}
              >
                {isRecording ? "⏹️" : "⏺️"}
                <span>
                  {isRecording ? `تسجيل ${formatDuration(recordingSeconds)}` : "تسجيل"}
                </span>
              </button>
            )}
          </div>

          <button className="ctrl-btn hangup-btn" onClick={hangUp} title="مغادرة">
            📞
            <span>مغادرة</span>
          </button>
        </footer>
      )}

      {/* Recording Modal */}
      {showRecordingModal && recordedBlobUrl && (
        <div className="recording-modal-overlay">
          <div className="recording-modal-card">
            <div className="recording-modal-header">
              <div className="modal-title-group">
                <span className="modal-icon">🎬</span>
                <div>
                  <h3>التسجيل جاهز!</h3>
                  <p className="modal-subtitle">الحجم: {recordedBlobSize} ميغا</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowRecordingModal(false)}>✕</button>
            </div>
            <div className="recording-modal-body">
              <div className="video-preview-wrapper">
                <video src={recordedBlobUrl} controls className="recording-preview-video" />
              </div>
              <div className="recording-tips">
                💡 يمكنك تحميل الفيديو لمشاركته مع الطلاب الغائبين أو الاحتفاظ به كمرجع.
              </div>
            </div>
            <div className="recording-modal-footer">
              <button className="btn-dismiss-modal" onClick={() => setShowRecordingModal(false)}>
                إغلاق
              </button>
              <button className="btn-download-video" onClick={downloadRecording}>
                ⬇️ تحميل الفيديو
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .visio-room-page {
          min-height: 100vh;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          direction: rtl;
        }

        /* TOP BAR */
        .visio-top-bar {
          background: #1e293b;
          border-bottom: 1px solid #334155;
          padding: 0.6rem 1.2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .top-bar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .top-bar-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-back {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: #94a3b8;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-size: 0.82rem;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-back:hover {
          background: rgba(255,255,255,0.15);
          color: #f8fafc;
        }

        .session-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .session-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 800;
          color: #f8fafc;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .session-timer {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
          padding: 3px 10px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }

        .btn-permission {
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: white;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .permission-msg {
          font-size: 0.75rem;
          color: #94a3b8;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-tool {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: #cbd5e1;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-tool:hover, .btn-tool.active {
          background: rgba(245, 158, 11, 0.2);
          border-color: rgba(245, 158, 11, 0.4);
          color: #fbbf24;
        }

        /* MAIN */
        .visio-main {
          flex: 1;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        .video-area {
          flex: 1;
          background: #000;
          position: relative;
        }

        /* PARTICIPANTS DRAWER */
        .participants-drawer {
          width: 320px;
          background: #0f172a;
          border-right: 1px solid #334155;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .drawer-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.85rem 1.25rem;
          background: #1e293b;
          border-bottom: 1px solid #334155;
        }

        .drawer-header h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 800;
          color: #f8fafc;
          flex: 1;
        }

        .drawer-count {
          background: #f59e0b;
          color: white;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.15rem 0.45rem;
          border-radius: 12px;
        }

        .btn-close-drawer {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.2rem;
          cursor: pointer;
        }

        .drawer-stats {
          display: flex;
          gap: 10px;
          padding: 0.85rem 1.25rem;
          background: #1e293b;
          border-bottom: 1px solid #334155;
        }

        .stat-box {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.5rem;
          border-radius: 8px;
          text-align: center;
        }

        .stat-num {
          display: block;
          font-size: 1.25rem;
          font-weight: 800;
          color: #fbbf24;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .participants-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .list-subtitle {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .participant-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #1e293b;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          border: 1px solid #334155;
        }

        .participant-card.is-present {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }

        .p-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-size: 0.95rem;
        }

        .status-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          border: 2px solid #0f172a;
        }

        .status-indicator.online { background: #10b981; }
        .status-indicator.offline { background: #94a3b8; }

        .p-details { flex: 1; overflow: hidden; }

        .p-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #f1f5f9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .host-badge {
          font-size: 0.72rem;
          background: #f59e0b;
          color: white;
          padding: 1px 5px;
          border-radius: 6px;
          margin-right: 4px;
        }

        .p-sub { display: flex; align-items: center; gap: 6px; margin-top: 3px; }

        .role-tag {
          font-size: 0.68rem;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.08);
          padding: 1px 5px;
          border-radius: 4px;
        }

        .status-tag { font-size: 0.7rem; font-weight: 700; }
        .tag-live { color: #34d399; }
        .tag-invited { color: #94a3b8; }

        .drawer-footer {
          padding: 0.85rem 1.25rem;
          border-top: 1px solid #334155;
        }

        .btn-refresh-presence {
          width: 100%;
          background: #334155;
          color: #f8fafc;
          border: none;
          padding: 0.6rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-refresh-presence:hover { background: #475569; }

        /* MEDIA CONTROLS */
        .media-controls-bar {
          background: #1e293b;
          border-top: 1px solid #334155;
          padding: 0.7rem 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
        }

        .controls-group {
          display: flex;
          gap: 8px;
        }

        .ctrl-btn {
          background: #334155;
          border: 1px solid #475569;
          color: #f8fafc;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .ctrl-btn:hover { background: #475569; }

        .ctrl-btn.muted {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }

        .ctrl-btn.active-share {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          color: #93c5fd;
        }

        .ctrl-btn.recording {
          background: rgba(239, 68, 68, 0.3);
          border-color: #ef4444;
          color: #fecaca;
          animation: rec-pulse 1.5s ease-in-out infinite;
        }

        @keyframes rec-pulse {
          0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
        }

        .hangup-btn {
          background: #dc2626 !important;
          border-color: #ef4444 !important;
          color: white !important;
        }

        .hangup-btn:hover {
          background: #b91c1c !important;
        }

        /* RECORDING MODAL */
        .recording-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
        }

        .recording-modal-card {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 16px;
          width: 100%;
          max-width: 620px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          direction: rtl;
        }

        .recording-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #334155;
          background: #1e293b;
        }

        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-icon { font-size: 1.8rem; }

        .modal-title-group h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #f8fafc;
        }

        .modal-subtitle {
          margin: 3px 0 0 0;
          font-size: 0.82rem;
          color: #94a3b8;
        }

        .btn-close-modal {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.4rem;
          cursor: pointer;
        }

        .recording-modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .video-preview-wrapper {
          width: 100%;
          border-radius: 10px;
          overflow: hidden;
          background: #000;
          border: 1px solid #334155;
        }

        .recording-preview-video {
          width: 100%;
          max-height: 280px;
          display: block;
        }

        .recording-tips {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fde68a;
          font-size: 0.82rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          line-height: 1.4;
        }

        .recording-modal-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          padding: 1rem 1.5rem;
          border-top: 1px solid #334155;
          background: #1e293b;
        }

        .btn-download-video {
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: white;
          font-weight: 800;
          font-size: 0.9rem;
          border: none;
          padding: 0.65rem 1.4rem;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
        }

        .btn-download-video:hover {
          transform: translateY(-1px);
        }

        .btn-dismiss-modal {
          background: rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.65rem 1.2rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .btn-dismiss-modal:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 900px) {
          .media-controls-bar {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .session-title {
            max-width: 160px;
          }
          .participants-drawer {
            width: 100%;
            position: absolute;
            top: 0;
            right: 0;
            height: 100%;
            z-index: 10;
          }
          .top-bar-left {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}