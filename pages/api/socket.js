import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const onlineUsers = new Map(); // userId → socketId

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("🟢 Initialisation Socket.IO");

    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("🟢 connecté :", socket.id);

      // ✅ Identifier l'utilisateur
      socket.on("identify", ({ token }) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId  = parseInt(decoded.id);
          onlineUsers.set(userId, socket.id);
          socket.userId = userId; // stocker le userId sur le socket
          io.emit("online_users", Array.from(onlineUsers.keys()));
          console.log("👤 Online users:", Array.from(onlineUsers.keys()));
        } catch (err) {
          console.error("❌ identify error:", err.message);
        }
      });

      // Rejoindre une room (pour les groupes)
      socket.on("join", ({ roomId }) => {
        socket.join(roomId);
        console.log(`📌 ${socket.id} → room : ${roomId}`);
      });

      // Message privé
      socket.on("private_message", async ({ userId, receiverId, content }) => {
        try {
          if (!userId || !receiverId || !content) return;

          const senderId = parseInt(userId);
          const rcvId = parseInt(receiverId);

          const saved = await prisma.message.create({
            data: { 
              senderId, 
              receiverId: rcvId, 
              content 
            },
            include: {
              sender:   { select: { id: true, nom: true, prenom: true, role: true } },
              receiver: { select: { id: true, nom: true, prenom: true, role: true } },
            },
          });

          // ✅ Émettre au sender (pour qu'il voie son propre message)
          const senderSocketId = onlineUsers.get(senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit("private_message", saved);
          }

          // ✅ Émettre au receiver (pour qu'il voie le message arriver)
          const receiverSocketId = onlineUsers.get(rcvId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("private_message", saved);

            // ✅ Notifier le destinataire pour mettre à jour le badge
            // Compter tous les messages non lus de ce sender
            const unreadCount = await prisma.message.count({
              where: {
                receiverId: rcvId,
                senderId: senderId,
                lu: false,
              },
            });

            io.to(receiverSocketId).emit("unread_update", {
              senderId: senderId,
              unreadCount: unreadCount,
            });
          }

          console.log(`📬 private_message: ${senderId} → ${rcvId}`);

        } catch (error) {
          console.error("❌ private_message:", error.message);
          socket.emit("error", { message: "Erreur envoi" });
        }
      });

      // Message de groupe
      socket.on("group_message", async ({ userId, groupType, content }) => {
        try {
          if (!userId || !groupType || !content) return;

          const saved = await prisma.groupMessage.create({
            data: { 
              senderId: parseInt(userId), 
              groupType, 
              content 
            },
            include: { sender: { select: { id: true, nom: true, prenom: true, role: true } } },
          });

          io.to(groupType).emit("group_message", saved);
          console.log(`📢 group_message → ${groupType}`);

        } catch (error) {
          console.error("❌ group_message:", error.message);
          socket.emit("error", { message: "Erreur envoi" });
        }
      });

      // Forum
      socket.on("forum_message", async ({ token, courseId, contenu }) => {
        try {
          const decoded  = jwt.verify(token, process.env.JWT_SECRET);
          const authorId = decoded.id;
          if (!courseId || !contenu) return;

          let forum = await prisma.forum.findUnique({ where: { courseId: parseInt(courseId) } });
          if (!forum) forum = await prisma.forum.create({ data: { courseId: parseInt(courseId) } });

          const post = await prisma.forumPost.create({
            data: { forumId: forum.id, authorId, contenu },
            include: { author: { select: { id: true, nom: true, prenom: true, role: true } } },
          });

          io.to(`forum-${courseId}`).emit("forum_message", post);

        } catch (error) {
          console.error("❌ forum_message:", error.message);
        }
      });

      // Typing
      socket.on("typing",      ({ roomId, userName }) => socket.to(roomId).emit("typing",      { userName }));
      socket.on("stop_typing", ({ roomId })           => socket.to(roomId).emit("stop_typing"));

      // ✅ Marquer messages comme lus (appelé par le client quand il ouvre une conversation)
      socket.on("mark_read", async ({ userId, contactId }) => {
        try {
          if (!userId || !contactId) return;

          const myId = parseInt(userId);
          const otherId = parseInt(contactId);

          await prisma.message.updateMany({
            where: {
              receiverId: myId,
              senderId: otherId,
              lu: false,
            },
            data: { lu: true },
          });

          // Notifier le client que le badge doit être remis à 0
          const mySocketId = onlineUsers.get(myId);
          if (mySocketId) {
            io.to(mySocketId).emit("unread_update", {
              senderId: otherId,
              unreadCount: 0,
            });
          }

          console.log(`✅ Messages de ${otherId} marqués lus par ${myId}`);
        } catch (error) {
          console.error("❌ mark_read:", error.message);
        }
      });

      // ✅ Déconnexion — retirer de la liste
      socket.on("disconnect", () => {
        for (const [userId, sid] of onlineUsers.entries()) {
          if (sid === socket.id) {
            onlineUsers.delete(userId);
            break;
          }
        }
        io.emit("online_users", Array.from(onlineUsers.keys()));
        console.log("🔴 déconnecté :", socket.id);
      });
    });
  }

  res.end();
}