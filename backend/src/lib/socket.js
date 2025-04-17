import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";
import jwt from 'jsonwebtoken';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
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
});

const extractToken = (socket) => {
  // Try to get token from auth object (set by client)
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  // Try to get token from headers
  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  // Try to get token from cookie
  const cookies = socket.handshake.headers?.cookie;
  if (cookies) {
    const jwtCookie = cookies.split(';').find(c => c.trim().startsWith('jwt='));
    if (jwtCookie) {
      return jwtCookie.split('=')[1];
    }
  }

  return null;
};

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = extractToken(socket);
    
    if (!token) {
      return next(new Error('Authentication error - No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return next(new Error('Invalid token'));
    }
  } catch (error) {
    console.error('Socket authentication error:', error);
    return next(new Error('Authentication error'));
  }
});

const userSocketMap = {}; // {userId: socketId}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId?.toString()];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.user._id;
  if (userId) {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("sendMessage", async (message) => {
    try {
      const [sender, receiver] = await Promise.all([
        User.findById(message.senderId),
        User.findById(message.receiverId)
      ]);

      if (sender.blockedUsers.includes(message.receiverId) || 
          receiver.blockedUsers.includes(message.senderId)) {
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
      const [sender, receiver] = await Promise.all([
        User.findById(userId),
        User.findById(receiverId)
      ]);

      if (sender.blockedUsers.includes(receiverId) || 
          receiver.blockedUsers.includes(userId)) {
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