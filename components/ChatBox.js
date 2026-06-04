import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function ChatBox() {

  const socketRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [ready, setReady] = useState(false);

  const bottomRef = useRef(null);

  // 🔐 login check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const logged = localStorage.getItem("isLogged");
      setIsLogged(!!logged);
      setReady(true);
    }
  }, []);

  // 👤 récupérer user COMPLET
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) return;

    try {
      const u = JSON.parse(storedUser);
      setUser(u);
    } catch {}
  }, []);

  // 🔌 socket
  useEffect(() => {

    if (!isLogged || !user) return;

    const initSocket = async () => {

      await fetch("/api/socket");

      // 🔥 FIX CRITIQUE : URL explicite
      socketRef.current = io("http://localhost:3000", {
        path: "/api/socket",
      });

      socketRef.current.on("connect", () => {
        console.log("✅ connecté :", socketRef.current.id);
      });

      socketRef.current.off("message");

      socketRef.current.on("message", (msg) => {
        console.log("📥 reçu :", msg);
        setMessages((prev) => [...prev, msg]);
      });
    };

    initSocket();

    return () => socketRef.current?.disconnect();

  }, [isLogged, user]);

  // 🔽 scroll auto
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 📤 envoyer
  const sendMessage = () => {
    if (!text.trim() || !socketRef.current || !user) return;

    const msg = {
      text,
      userId: user.id,
      userName: `${user.prenom} ${user.nom}`,
    };

    console.log("📤 envoi :", msg);

    // ✅ affichage immédiat (important UX)
    setMessages((prev) => [
      ...prev,
      { user: msg.userName, text: msg.text }
    ]);

    socketRef.current.emit("message", msg);

    setText("");
  };

  if (!ready || !isLogged || !user) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      right: 20,
      width: 300,
      height: 400,
      resize: "both",
      overflow: "auto",
      border: "2px solid #ccc",
      background: "#fff",
      zIndex: 999
    }}>
      <h4 style={{ background: "#eee", margin: 0, padding: 10 }}>
        💬 Chat
      </h4>

      <div style={{ height: 250, overflowY: "scroll", padding: 10 }}>
        {messages.map((m, i) => (
          <p key={i}>
            <b>{m.user}:</b> {m.text}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Message..."
        style={{ width: "70%" }}
        onKeyDown={(e) => {
          if (e.key === "Enter") sendMessage();
        }}
      />

      <button onClick={sendMessage}>Envoyer</button>
    </div>
  );
}