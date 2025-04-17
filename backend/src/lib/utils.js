import jwt from 'jsonwebtoken'

export const generateToken = (userId, res) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

    // Set cookie with secure settings
    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: true, // Required for cross-site
        sameSite: 'none', // Required for cross-site
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
    });

    return token; // Return token for mobile clients
};