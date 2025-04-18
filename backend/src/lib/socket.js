import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        'http://localhost:5173',
        'https://full-stack-chat-app-sepia.vercel.app'
      ];

      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  cookie: {
    name: "io",
    httpOnly: true,
    sameSite: "none",
    secure: true
  }
});

const userSocketMap = {}; // {userId: socketId}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId?.toString()];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    // Broadcast when a user connects
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  // Handle real-time messaging
  socket.on("sendMessage", async (message) => {
    console.log("Message received:", message);

    try {
      // Check if either user has blocked the other
      const [sender, receiver] = await Promise.all([
        User.findById(message.senderId),
        User.findById(message.receiverId)
      ]);

      if (sender.blockedUsers.includes(message.receiverId) || 
          receiver.blockedUsers.includes(message.senderId)) {
        // Don't forward the message if either user is blocked
        return;
      }

      const receiverSocketId = getReceiverSocketId(message.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", message);
      }
      
      const senderSocketId = getReceiverSocketId(message.senderId);
      if (senderSocketId && senderSocketId !== receiverSocketId) {
        io.to(senderSocketId).emit("newMessage", message);
      }
    } catch (error) {
      console.error("Error in socket message handling:", error);
    }
  });

  socket.on("typing", async ({ receiverId, isTyping }) => {
    try {
      // Check if either user has blocked the other
      const [sender, receiver] = await Promise.all([
        User.findById(userId),
        User.findById(receiverId)
      ]);

      if (sender.blockedUsers.includes(receiverId) || 
          receiver.blockedUsers.includes(userId)) {
        // Don't forward typing status if either user is blocked
        return;
      }

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", { senderId: userId, isTyping });
      }
    } catch (error) {
      console.error("Error in socket typing handling:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { io, app, server };