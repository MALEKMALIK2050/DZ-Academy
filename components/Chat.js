import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

let socket;

export default function Chat() {
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const selectedContactRef = useRef(null);

  // Garder la ref synchronisée avec le state
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  console.log("🟢 Chat component - User:", user?.id);

  // Récupérer contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch("/api/chat/contacts", { credentials: "include" });
        const data = await res.json();
        console.log("📋 Contacts chargés:", data);
        setContacts(data.contacts || []);
        setGroups(data.groups || []);
      } catch (err) {
        console.error("❌ Erreur contacts:", err);
        setError("Erreur chargement contacts");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchContacts();
  }, [user?.id]);

  // Socket.IO init
  useEffect(() => {
    if (!user?.id) return;

    console.log("🔌 Initialisation socket...");

    fetch("/api/socket");
    socket = io({
      path: "/api/socket",
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connecté:", socket.id);

      // ✅ S'identifier auprès du serveur avec le token
      const token = document.cookie
        .split("; ")
        .find((c) => c.startsWith("token="))
        ?.split("=")[1];

      if (token) {
        socket.emit("identify", { token });
        console.log("🔑 Identify envoyé");
      }

      // Rejoindre les rooms des groupes
      groups.forEach((g) => {
        socket.emit("join", { roomId: g.id });
      });
    });

    // ✅ Message privé reçu
    socket.on("private_message", (msg) => {
      console.log("📥 Message privé reçu:", msg);

      const currentContact = selectedContactRef.current;
      const isFromCurrentContact =
        msg.senderId === currentContact || msg.sender?.id === currentContact;
      const isMyOwnMessage =
        msg.senderId === user.id || msg.sender?.id === user.id;

      // Afficher le message seulement s'il concerne la conversation ouverte
      if (isFromCurrentContact || isMyOwnMessage) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // Si c'est un message reçu dans la conv ouverte, le marquer lu immédiatement
        if (isFromCurrentContact && !isMyOwnMessage && socket) {
          socket.emit("mark_read", {
            userId: user.id,
            contactId: msg.senderId || msg.sender?.id,
          });
        }
      }
    });

    // ✅ Mise à jour des badges en temps réel
    socket.on("unread_update", ({ senderId, unreadCount }) => {
      console.log(`🔴 Badge update: senderId=${senderId}, count=${unreadCount}`);
      setContacts((prev) =>
        prev.map((c) =>
          c.id === senderId ? { ...c, unreadCount } : c
        )
      );
    });

    socket.on("group_message", (msg) => {
      console.log("📥 Message groupe reçu:", msg);
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("error", (err) => {
      console.error("❌ Socket error:", err);
    });

    return () => socket?.disconnect();
  }, [user?.id, groups]);

  // Scroll auto
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  // Charger messages
  const loadMessages = async (contactId, type = "private") => {
    try {
      console.log(`📂 Chargement ${type} messages avec:`, contactId);

      const url =
        type === "private"
          ? `/api/chat/private?contactId=${contactId}`
          : `/api/chat/group?groupType=${contactId}`;

      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();

      console.log(`✅ ${type} messages chargés:`, data.length);
      setMessages(data || []);
      setSelectedContact(contactId);

      // ✅ Marquer les messages comme lus via socket (plus rapide qu'un PATCH par message)
      if (type === "private" && socket) {
        socket.emit("mark_read", {
          userId: user?.id,
          contactId: parseInt(contactId),
        });
      }
    } catch (err) {
      console.error(`❌ Erreur chargement ${type}:`, err);
    }
  };

  // Envoyer message
  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedContact || !socket || !user?.id) {
      console.log("⚠️ Impossible d'envoyer - état invalide");
      return;
    }

    try {
      console.log("📤 Envoi du message...");

      if (groups.some((g) => g.id === selectedContact)) {
        console.log("📢 Message groupe vers:", selectedContact);
        socket.emit("group_message", {
          userId: user.id,
          groupType: selectedContact,
          content: newMsg,
        });
      } else {
        console.log("💬 Message privé vers:", selectedContact);
        socket.emit("private_message", {
          userId: user.id,
          receiverId: parseInt(selectedContact),
          content: newMsg,
        });
      }

      setNewMsg("");
    } catch (err) {
      console.error("❌ Erreur envoi:", err);
      setError("Erreur envoi du message");
    }
  };

  if (loading) return <p>Chargement des contacts...</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "1rem", height: "600px", width: "100%", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ background: "#f8fafc", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0", fontWeight: "bold", background: "#1e40af", color: "white" }}>
          💬 Contacts
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {groups.length > 0 && (
            <>
              <div style={{ padding: "0.5rem 1rem", fontWeight: "600", color: "#718096", fontSize: "0.75rem", textTransform: "uppercase", background: "#f1f5f9" }}>
                Groupes
              </div>
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => loadMessages(g.id, "group")}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "none",
                    background: selectedContact === g.id ? "#1e40af" : "transparent",
                    color: selectedContact === g.id ? "white" : "#475569",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontWeight: selectedContact === g.id ? "600" : "normal",
                    fontSize: "0.9rem",
                  }}
                >
                  {g.label}
                </button>
              ))}
            </>
          )}

          {contacts.length > 0 && (
            <>
              <div style={{ padding: "0.5rem 1rem", fontWeight: "600", color: "#718096", fontSize: "0.75rem", textTransform: "uppercase", background: "#f1f5f9", marginTop: "1rem" }}>
                المستخدمون
              </div>
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadMessages(c.id, "private")}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "none",
                    background: selectedContact === c.id ? "#1e40af" : "transparent",
                    color: selectedContact === c.id ? "white" : "#475569",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontWeight: selectedContact === c.id ? "600" : c.unreadCount > 0 ? "700" : "normal",
                    fontSize: "0.9rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{c.prenom} {c.nom}</span>
                  {c.unreadCount > 0 && (
                    <span style={{
                      background: selectedContact === c.id ? "#fff" : "#dc2626",
                      color: selectedContact === c.id ? "#1e40af" : "white",
                      borderRadius: "12px",
                      padding: "0.15rem 0.5rem",
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      minWidth: "20px",
                      textAlign: "center",
                      lineHeight: "1.3",
                      animation: "badgePulse 2s ease-in-out infinite",
                    }}>
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}

          {contacts.length === 0 && groups.length === 0 && (
            <div style={{ padding: "1rem", color: "#718096", fontSize: "0.9rem" }}>
              Aucun contact
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selectedContact ? (
          <>
            <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0", fontWeight: "bold", background: "#f8fafc" }}>
              {contacts.find((c) => c.id === selectedContact)?.prenom ||
                groups.find((g) => g.id === selectedContact)?.label ||
                "Chat"}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", background: "#fafbfc" }}>
              {messages.length === 0 ? (
                <p style={{ textAlign: "center", color: "#718096" }}>Aucun message</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#1e40af" }}>
                      {m.sender?.prenom} {m.sender?.nom}
                    </div>
                    <div style={{ background: "white", padding: "0.75rem", borderRadius: "8px", marginTop: "0.25rem", color: "#1e293b", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                      {m.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && <div style={{ padding: "0.75rem", background: "#fee2e2", color: "#dc2626", fontSize: "0.9rem" }}>{error}</div>}

            <div style={{ padding: "1rem", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", gap: "0.5rem" }}>
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Écrire..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e0",
                  fontSize: "0.95rem",
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#1e40af",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                📤
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#718096" }}>
            Sélectionnez un contact
          </div>
        )}
      </div>

      {/* Animation CSS pour le badge */}
      <style jsx global>{`
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}