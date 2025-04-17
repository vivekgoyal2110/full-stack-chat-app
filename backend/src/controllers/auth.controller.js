import cloudinary from '../lib/cloudinary.js';
import { generateToken } from '../lib/utils.js';
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'

export const signup = async (req, res) => {
    const {fullName, email, password} = req.body
    try {
        if(password.length < 6){
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }
        
        const user = await User.findOne({email})
        if(user) return res.status(400).json({message: "Email already exists"});

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullName: fullName,
            email: email,
            password: hashedPassword
        })

        if(newUser){
            const token = generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
                token
            });
        } else {
            res.status(400).json({message: "Invalid user data"});
        }
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
};

export const login = async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await User.findOne({email})
        
        if(!user){
            return res.status(400).json({message: "Invalid credentials"});
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect){
            return res.status(400).json({message: "Invalid credentials"});
        }

        const token = generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            token
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
};

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", {
            maxAge: 0,
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
        });
        res.status(200).json({message: "Logged out successfully!"});
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
};

export const updateProfile = async(req, res) => {
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;
        
        if(!profilePic){
            return res.status(400).json({message: "Profile pic is required!"});
        }

        try {
            const uploadResponse = await cloudinary.uploader.upload(profilePic, {
                resource_type: "auto",
                folder: "chat-app/profiles",
                quality: "auto",
                fetch_format: "auto",
                width: 500,
                height: 500,
                crop: "fill"
            });

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { profilePic: uploadResponse.secure_url },
                { new: true }
            ).select("-password");

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }

            // Include token in response for consistency
            const token = generateToken(updatedUser._id, res);
            res.status(200).json({
                ...updatedUser.toJSON(),
                token
            });
        } catch (cloudinaryError) {
            console.error("Cloudinary upload error:", cloudinaryError);
            return res.status(500).json({ 
                message: "Failed to upload image",
                error: cloudinaryError.message 
            });
        }

    } catch (error) {
        console.error("Error in update profile:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

export const checkAuth = (req, res) => {
    try {
        const token = generateToken(req.user._id, res);
        res.status(200).json({
            _id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            profilePic: req.user.profilePic,
            token
        });
    } catch (error) {
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
};