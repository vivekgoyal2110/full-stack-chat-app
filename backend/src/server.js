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

const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

const allowedOrigins = [
    'http://localhost:5173',
    'https://full-stack-chat-app-omega.vercel.app',
    'https://full-stack-chat-app-viveks-projects.vercel.app'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);

app.get("/", (req, res) => {
    res.json({ 
        message: "Backend is running",
        environment: NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

server.listen(PORT, () => {
    console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
    connectDB();
});