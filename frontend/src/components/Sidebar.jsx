import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
import { FaRegUserCircle } from "react-icons/fa";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers(); // Now this only returns friends due to backend changes
  }, [getUsers]);

  // Filter online friends
  const filteredUsers = users
    .filter(user => !showOnlineOnly || onlineUsers.includes(user._id));

  const handleUserSelect = (user) => {
    if (selectedUser?._id === user._id) {
      setSelectedUser(null);
    } else {
      setSelectedUser(user);
    }
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Friends</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.filter(id => users.some(u => u._id === id)).length} online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => handleUserSelect(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={user.fullName}
                    className="size-12 object-cover rounded-full"
                  />
                ) : (
                  <div className="size-12 rounded-full bg-base-300 flex items-center justify-center text-3xl text-base-content">
                    <FaRegUserCircle />
                  </div>
                )}
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-base-100"
                  />
                )}
              </div>

              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center p-4 text-base-content/70">
            <p className="mb-2">No friends {showOnlineOnly ? "online" : "yet"}</p>
            {!showOnlineOnly && (
              <p className="text-sm">
                Use the search bar above to find and add friends
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;