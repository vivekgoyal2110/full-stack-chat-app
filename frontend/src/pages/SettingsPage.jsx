import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useFriendStore } from "../store/useFriendStore";
import { Send, UserX } from "lucide-react";
import { useEffect } from "react";
import { FaRegUserCircle } from "react-icons/fa";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { blockedUsers, getBlockedUsers, unblockUser, isLoadingBlockedUsers } = useFriendStore();

  useEffect(() => {
    getBlockedUsers();
  }, [getBlockedUsers]);

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl space-y-8">
      {/* Theme Section */}
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="text-sm text-base-content/70">Choose a theme for your chat interface</p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              className={`
                group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}
              `}
              onClick={() => setTheme(t)}
            >
              <div className="relative h-8 w-full rounded-md overflow-hidden" data-theme={t}>
                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                  <div className="rounded bg-primary"></div>
                  <div className="rounded bg-secondary"></div>
                  <div className="rounded bg-accent"></div>
                  <div className="rounded bg-neutral"></div>
                </div>
              </div>
              <span className="text-[11px] font-medium truncate w-full text-center">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </button>
          ))}
        </div>

        {/* Preview Section */}
        <h3 className="text-lg font-semibold mb-3">Preview</h3>
        <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
          <div className="p-4 bg-base-200">
            <div className="max-w-lg mx-auto">
              {/* Mock Chat UI */}
              <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                      J
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">John Doe</h3>
                      <p className="text-xs text-base-content/70">Online</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                  {PREVIEW_MESSAGES.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-xl p-3 shadow-sm
                          ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                        `}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`
                            text-[10px] mt-1.5
                            ${message.isSent ? "text-primary-content/70" : "text-base-content/70"}
                          `}
                        >
                          12:00 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-base-300 bg-base-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-sm h-10"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                    />
                    <button className="btn btn-primary h-10 min-h-0">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blocked Users Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserX className="size-5" />
            Blocked Users
          </h2>
          <p className="text-sm text-base-content/70">
            Manage your blocked users. Blocked users cannot send you messages or friend requests.
          </p>
        </div>

        <div className="bg-base-200 rounded-xl p-4">
          {isLoadingBlockedUsers ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner"></span>
            </div>
          ) : blockedUsers.length === 0 ? (
            <p className="text-center py-8 text-base-content/70">
              You haven't blocked any users
            </p>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-base-100 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        {user.profilePic ? (
                          <img
                            src={user.profilePic}
                            alt={user.fullName}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-base-300 flex items-center justify-center">
                            <FaRegUserCircle className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{user.fullName}</h3>
                      <p className="text-sm text-base-content/70">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => unblockUser(user._id)}
                    className="btn btn-sm btn-ghost text-warning"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;