import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const getTokenFromRequest = (req) => {
    // First try to get from cookie
    const cookieToken = req.cookies.jwt;
    if (cookieToken) return cookieToken;

    // Then try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    return null;
};

export const protectRoute = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            console.log("No token found in request");
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select("-password");

            if (!user) {
                console.log("No user found with token payload");
                return res.status(404).json({ message: "User not found" });
            }

            req.user = user;
            next();
        } catch (tokenError) {
            console.log("Token verification failed:", tokenError.message);
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }
    } catch (error) {
        console.error("Error in protectRoute middleware:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};