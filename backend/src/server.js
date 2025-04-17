import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.route.js'
import messageRoutes from './routes/message.route.js'
import friendRoutes from './routes/friend.route.js'
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { app, server } from './lib/socket.js';

dotenv.config();

const PORT = process.env.PORT || 5002;

// Increase payload size limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Configure CORS with credentials
const allowedOrigins = [
    "http://localhost:5173",                  // local dev
    "https://full-stack-chat-app-omega.vercel.app/"        // deployed frontend
  ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);



app.get("/", (req, res) => {
    res.send("Backend is working ✅");
  });

server.listen(PORT, ()=>{
    console.log(`Server started on Port ${PORT}`);
    connectDB();
});