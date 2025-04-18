import User from "../models/user.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const searchUsers = async (req, res) => {
    try {
        const { email } = req.query;
        const currentUser = req.user;

        // Find user by email, excluding the current user
        const user = await User.findOne({ 
            email: { $regex: email, $options: 'i' },
            _id: { $ne: currentUser._id }
        }).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user is blocked
        const isBlocked = currentUser.blockedUsers.includes(user._id);
        const hasBlockedMe = user.blockedUsers.includes(currentUser._id);
        
        if (isBlocked || hasBlockedMe) {
            return res.status(403).json({ message: "User is blocked" });
        }

        // Check friendship status
        const isFriend = currentUser.friends.includes(user._id);
        
        // Check if there's a pending request from the current user
        const hasSentRequest = user.friendRequests.some(
            req => req.from.toString() === currentUser._id.toString() && req.status === "pending"
        );

        // Check if there's a pending request to the current user
        const hasPendingRequest = currentUser.friendRequests.some(
            req => req.from.toString() === user._id.toString() && req.status === "pending"
        );

        res.json({
            user,
            isFriend,
            hasSentRequest,
            hasPendingRequest
        });

    } catch (error) {
        console.error("Error in searchUsers:", error);
        res.status(500).json({ message: "Error searching for users" });
    }
};

export const sendFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user;

        // Check if users exist
        const [sender, receiver] = await Promise.all([
            User.findById(currentUser._id),
            User.findById(userId)
        ]);

        if (!receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if either user has blocked the other
        if (sender.blockedUsers.includes(userId) || receiver.blockedUsers.includes(currentUser._id)) {
            return res.status(403).json({ message: "Cannot send friend request to blocked user" });
        }

        // Check if they're already friends
        if (sender.friends.includes(userId)) {
            return res.status(400).json({ message: "Already friends with this user" });
        }

        // Check if there's already a pending request
        const existingRequest = receiver.friendRequests.find(
            req => req.from.toString() === currentUser._id.toString() && req.status === "pending"
        );

        if (existingRequest) {
            return res.status(400).json({ message: "Friend request already sent" });
        }

        // Add friend request
        const newRequest = {
            from: currentUser._id,
            status: "pending"
        };
        
        receiver.friendRequests.push(newRequest);
        await receiver.save();

        // Get the actual request document that was created
        const populatedReceiver = await User.findById(receiver._id)
            .populate({
                path: "friendRequests.from",
                select: "fullName email profilePic"
            });
            
        const createdRequest = populatedReceiver.friendRequests
            .find(req => req.from._id.toString() === currentUser._id.toString());

        // Emit friend request event via socket with complete request data
        const receiverSocketId = getReceiverSocketId(userId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("friendRequestReceived", {
                request: createdRequest
            });
        }

        res.json({ message: "Friend request sent successfully" });
    } catch (error) {
        console.error("Error in sendFriendRequest:", error);
        res.status(500).json({ message: "Error sending friend request" });
    }
};

export const handleFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action } = req.body; // "accept" or "reject"
        const currentUser = req.user;

        const user = await User.findById(currentUser._id)
            .populate({
                path: "friendRequests.from",
                select: "fullName email profilePic"
            });
        
        // Find the request
        const requestIndex = user.friendRequests.findIndex(
            req => req._id.toString() === requestId
        );

        if (requestIndex === -1) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        const request = user.friendRequests[requestIndex];

        if (request.status !== "pending") {
            return res.status(400).json({ message: "Request already handled" });
        }

        if (action === "accept") {
            // Check if either user has blocked the other
            const otherUser = await User.findById(request.from._id);
            if (user.blockedUsers.includes(request.from._id) || 
                otherUser.blockedUsers.includes(currentUser._id)) {
                return res.status(403).json({ message: "Cannot accept request from blocked user" });
            }

            // Add users to each other's friends lists
            await Promise.all([
                User.findByIdAndUpdate(currentUser._id, {
                    $push: { friends: request.from._id }
                }),
                User.findByIdAndUpdate(request.from._id, {
                    $push: { friends: currentUser._id }
                })
            ]);
        }

        // Update request status
        request.status = action === "accept" ? "accepted" : "rejected";
        await user.save();

        // Emit event to notify the other user with complete user data
        const otherUserSocketId = getReceiverSocketId(request.from._id);
        if (otherUserSocketId) {
            io.to(otherUserSocketId).emit("friendRequestResponseReceived", {
                status: action,
                from: {
                    _id: currentUser._id,
                    fullName: currentUser.fullName,
                    email: currentUser.email,
                    profilePic: currentUser.profilePic
                },
                requestId
            });
        }

        res.json({ 
            message: `Friend request ${action}ed successfully`
        });

    } catch (error) {
        console.error("Error in handleFriendRequest:", error);
        res.status(500).json({ message: "Error handling friend request" });
    }
};

export const getFriendRequests = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: "friendRequests.from",
                select: "fullName email profilePic"
            });

        const pendingRequests = user.friendRequests.filter(
            req => req.status === "pending"
        );

        res.json(pendingRequests);

    } catch (error) {
        console.error("Error in getFriendRequests:", error);
        res.status(500).json({ message: "Error getting friend requests" });
    }
};

export const removeFriend = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user;

        // Check if they are actually friends
        const user = await User.findById(currentUser._id);
        if (!user.friends.includes(userId)) {
            return res.status(400).json({ message: "User is not in your friends list" });
        }

        // Remove from both users' friend lists
        await Promise.all([
            User.findByIdAndUpdate(currentUser._id, {
                $pull: { friends: userId }
            }),
            User.findByIdAndUpdate(userId, {
                $pull: { friends: currentUser._id }
            })
        ]);

        // Emit event to notify the other user
        const otherUserSocketId = getReceiverSocketId(userId);
        if (otherUserSocketId) {
            io.to(otherUserSocketId).emit("friendRemoved", {
                userId: currentUser._id
            });
        }

        res.json({ message: "Friend removed successfully" });
    } catch (error) {
        console.error("Error in removeFriend:", error);
        res.status(500).json({ message: "Error removing friend" });
    }
};

export const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user;

        // Check if user exists
        const userToBlock = await User.findById(userId);
        if (!userToBlock) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already blocked
        if (currentUser.blockedUsers.includes(userId)) {
            return res.status(400).json({ message: "User is already blocked" });
        }

        // Remove from friends if they are friends
        if (currentUser.friends.includes(userId)) {
            await Promise.all([
                User.findByIdAndUpdate(currentUser._id, {
                    $pull: { friends: userId }
                }),
                User.findByIdAndUpdate(userId, {
                    $pull: { friends: currentUser._id }
                })
            ]);
        }

        // Add to blocked users
        await User.findByIdAndUpdate(currentUser._id, {
            $push: { blockedUsers: userId }
        });

        // Emit events
        const otherUserSocketId = getReceiverSocketId(userId);
        if (otherUserSocketId) {
            io.to(otherUserSocketId).emit("userBlocked", {
                userId: currentUser._id
            });
        }

        res.json({ message: "User blocked successfully" });
    } catch (error) {
        console.error("Error in blockUser:", error);
        res.status(500).json({ message: "Error blocking user" });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user;

        // Check if user is actually blocked
        if (!currentUser.blockedUsers.includes(userId)) {
            return res.status(400).json({ message: "User is not blocked" });
        }

        // Remove from blocked users
        await User.findByIdAndUpdate(currentUser._id, {
            $pull: { blockedUsers: userId }
        });

        res.json({ message: "User unblocked successfully" });
    } catch (error) {
        console.error("Error in unblockUser:", error);
        res.status(500).json({ message: "Error unblocking user" });
    }
};

export const getBlockedUsers = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate("blockedUsers", "fullName email profilePic");

        res.json(user.blockedUsers);
    } catch (error) {
        console.error("Error in getBlockedUsers:", error);
        res.status(500).json({ message: "Error getting blocked users" });
    }
};