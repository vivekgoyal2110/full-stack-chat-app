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
    "http://localhost:5173",
    "https://full-stack-chat-app-omega.vercel.app",
    "https://full-stack-chat-app-viveks-projects.vercel.app"    // add your specific Vercel domain
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['set-cookie']
}));

// Add OPTIONS handling for preflight requests
app.options('*', cors());

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