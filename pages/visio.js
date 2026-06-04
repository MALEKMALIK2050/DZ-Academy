import { useEffect } from "react";

export default function Visio() {

  useEffect(() => {

    if (typeof window === "undefined") return;

    let api;

    const initJitsi = () => {
      const domain = "meet.jit.si";

      const params = new URLSearchParams(window.location.search);
      const room = params.get("room") || "classe-lms";

      const container = document.getElementById("jitsi-container");
      if (!container) {
        console.error("❌ container introuvable");
        return;
      }

      api = new window.JitsiMeetExternalAPI(domain, {
        roomName: room,
        width: "100%",
        height: "100%", // 🔥 important

        parentNode: container,

        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
        },

        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "desktop",
            "fullscreen",
            "hangup",
            "participants-pane"
          ]
        }
      });
    };

    // ✅ charger script UNE SEULE FOIS
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = initJitsi;

      document.body.appendChild(script);
    } else {
      initJitsi();
    }

    return () => {
      if (api) api.dispose();
    };

  }, []);

  return (
    <div style={{ padding: 20 }}>

      <h1>🎥 Classe en ligne</h1>

      <div
        id="jitsi-container"
        style={{
          width: "100%",
          height: "80vh", // 🔥 parent donne la taille
          background: "#000",
          borderRadius: "10px",
          overflow: "hidden"
        }}
      />

    </div>
  );
}