import { MoreVertical, UserMinus, UserX, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import { FaRegUserCircle } from "react-icons/fa";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { removeFriend, blockUser } = useFriendStore();

  if (!selectedUser || !authUser) return null;

  const handleRemoveFriend = () => {
    if (confirm("Are you sure you want to remove this friend?")) {
      removeFriend(selectedUser._id);
    }
  };

  const handleBlockUser = () => {
    if (confirm("Are you sure you want to block this user? This will also remove them from your friends list.")) {
      blockUser(selectedUser._id);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              {selectedUser.profilePic ? (
                <img 
                  src={selectedUser.profilePic} 
                  alt={selectedUser.fullName} 
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <div className="size-10 rounded-full bg-base-300 flex items-center justify-center text-2xl text-base-content">
                  <FaRegUserCircle />
                </div>
              )}
              {onlineUsers.includes(selectedUser._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-base-100"
                />
              )}
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* User Actions Dropdown */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
              <MoreVertical className="size-5" />
            </label>
            <ul tabIndex={0} className="dropdown-content menu menu-sm z-50 p-2 shadow-lg bg-base-200 rounded-box w-48">
              <li>
                <button onClick={handleRemoveFriend} className="text-warning">
                  <UserMinus className="size-4" />
                  Remove Friend
                </button>
              </li>
              <li>
                <button onClick={handleBlockUser} className="text-error">
                  <UserX className="size-4" />
                  Block User
                </button>
              </li>
            </ul>
          </div>

          {/* Close button */}
          <button onClick={() => setSelectedUser(null)} className="btn btn-ghost btn-sm btn-circle">
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;