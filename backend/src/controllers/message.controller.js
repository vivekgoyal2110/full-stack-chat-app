import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const getUsersForSideBar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        // Only get users who are friends with the logged in user and not blocked
        const user = await User.findById(loggedInUserId);
        const filteredUsers = await User.find({
            _id: { 
                $ne: loggedInUserId,
                $nin: user.blockedUsers // Exclude blocked users
            },
            friends: loggedInUserId, // Only return users who have the current user in their friends list
            blockedUsers: { $ne: loggedInUserId } // Exclude users who have blocked the current user
        }).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("Error in getUsersForSideBar", error.message);
        res.status(500).json({message: "Internal server error"});
    }
};

export const getMessages = async (req, res) => {
    try {
        const {id:userToChatId} = req.params;
        const myId = req.user._id;

        // Check if either user has blocked the other
        const [currentUser, otherUser] = await Promise.all([
            User.findById(myId),
            User.findById(userToChatId)
        ]);

        if (currentUser.blockedUsers.includes(userToChatId) || 
            otherUser.blockedUsers.includes(myId)) {
            return res.status(403).json({ message: "Cannot view messages with blocked user" });
        }

        // Check if users are friends
        if (!currentUser.friends.includes(userToChatId)) {
            return res.status(403).json({ message: "You can only message your friends" });
        }

        const messages = await Message.find({
            $or:[
                {senderId:myId, receiverId: userToChatId},
                {senderId: userToChatId, receiverId: myId}
            ],
            deletedFor: { $ne: myId }
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
};

export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;

        // Check if either user has blocked the other
        const [sender, receiver] = await Promise.all([
            User.findById(senderId),
            User.findById(receiverId)
        ]);

        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found" });
        }

        if (sender.blockedUsers.includes(receiverId) || 
            receiver.blockedUsers.includes(senderId)) {
            return res.status(403).json({ message: "Cannot send message to blocked user" });
        }

        // Check if users are friends
        if (!sender.friends.includes(receiverId)) {
            return res.status(403).json({ message: "You can only message your friends" });
        }

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        // Emit to both sender and receiver sockets
        const receiverSocketId = getReceiverSocketId(receiverId);
        const senderSocketId = getReceiverSocketId(senderId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        if (senderSocketId && senderSocketId !== receiverSocketId) {
            io.to(senderSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendMessage controller:", error);
        res.status(500).json({message: "Internal server error"});
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { deleteForEveryone } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Check if user is authorized to delete this message
        const isSender = message.senderId.toString() === userId.toString();
        const isReceiver = message.receiverId.toString() === userId.toString();
        
        if (!isSender && !isReceiver) {
            return res.status(403).json({ message: "Not authorized to delete this message" });
        }

        // Only sender can delete for everyone
        if (deleteForEveryone && !isSender) {
            return res.status(403).json({ message: "Only the sender can delete for everyone" });
        }

        if (deleteForEveryone) {
            // Delete for everyone
            await Message.findByIdAndUpdate(messageId, {
                deleteForEveryone: true,
                $addToSet: { deletedFor: [userId, message.receiverId] }
            });

            // Emit to both sender and receiver
            const receiverSocketId = getReceiverSocketId(message.receiverId);
            const senderSocketId = getReceiverSocketId(message.senderId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messageDeleted", { messageId, deleteForEveryone: true });
            }
            if (senderSocketId && senderSocketId !== receiverSocketId) {
                io.to(senderSocketId).emit("messageDeleted", { messageId, deleteForEveryone: true });
            }
        } else {
            // Delete only for the requesting user
            await Message.findByIdAndUpdate(messageId, {
                $addToSet: { deletedFor: userId }
            });

            // Emit only to the user who deleted
            const userSocketId = getReceiverSocketId(userId);
            if (userSocketId) {
                io.to(userSocketId).emit("messageDeleted", { messageId, deleteForEveryone: false });
            }
        }

        res.status(200).json({ 
            message: deleteForEveryone ? "Message deleted for everyone" : "Message deleted for you" 
        });
    } catch (error) {
        console.error("Error in deleteMessage controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};