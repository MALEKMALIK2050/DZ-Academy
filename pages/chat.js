import { useEffect, useState } from "react";
import { io } from "socket.io-client";

let socket;

export default function Chat() {

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState("Anonyme");

  // ✅ récupérer utilisateur
  useEffect(() => {
    const prenom = localStorage.getItem("prenom");
    const nom = localStorage.getItem("nom");

    if (prenom && nom) {
      setUser(`${prenom} ${nom}`);
    }
  }, []);

  // ✅ init socket + messages
  useEffect(() => {

    fetch("/api/socket");
    socket = io();

    fetch("/api/messages")
      .then(res => res.json())
      .then(setMessages);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => socket.disconnect();

  }, []);

  // ✅ envoyer message
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      user,
      text: message,
    });

    setMessage("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>💬 Chat temps réel</h1>

      <div style={{
        height: 300,
        overflowY: "scroll",
        border: "1px solid #ccc",
        marginBottom: 10,
        padding: 10
      }}>
        {messages.map((m, i) => (
          <p key={i}>
            <b>{m.user || "User"}:</b> {m.text || m.content}
          </p>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Écrire..."
        style={{ width: "70%" }}
        onKeyDown={(e) => {
          if (e.key === "Enter") sendMessage();
        }}
      />

      <button onClick={sendMessage}>Envoyer</button>
    </div>
  );
}