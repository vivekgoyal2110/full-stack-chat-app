import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
    searchUsers, 
    sendFriendRequest, 
    handleFriendRequest,
    getFriendRequests,
    removeFriend,
    blockUser,
    unblockUser,
    getBlockedUsers
} from "../controllers/friend.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.post("/request/:userId", protectRoute, sendFriendRequest);
router.put("/request/:requestId", protectRoute, handleFriendRequest);
router.get("/requests", protectRoute, getFriendRequests);
router.delete("/remove/:userId", protectRoute, removeFriend);
router.post("/block/:userId", protectRoute, blockUser);
router.delete("/unblock/:userId", protectRoute, unblockUser);
router.get("/blocked", protectRoute, getBlockedUsers);

export default router;