import jwt from 'jsonwebtoken'

export const generateToken = (userId, res) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: '7d',
    })

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        httpOnly: true,
        sameSite: 'none', // Required for cross-site cookies
        secure: true, // Required for cross-site cookies
        path: '/'
    })
    return token;
};