import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { MoreVertical, Trash2 } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
  } = useChatStore();
  
  const { authUser } = useAuthStore();
  const messagesEndRef = useRef(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleDeleteClick = (messageId, isSender) => {
    if (isSender) {
      setSelectedMessageId(messageId);
      setShowDeleteOptions(true);
    } else {
      handleMessageDelete(messageId, false);
    }
  };

  const handleMessageDelete = async (messageId, deleteForEveryone) => {
    await deleteMessage(messageId, deleteForEveryone);
    setShowDeleteOptions(false);
    setSelectedMessageId(null);
  };

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isMessagesLoading ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-base-content/60">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isSender = message.senderId === authUser._id;
            return (
              <div
                key={message._id}
                className={`chat ${isSender ? "chat-end" : "chat-start"}`}
                onMouseEnter={() => setHoveredMessageId(message._id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    {message.senderId === authUser._id ? (
                      authUser.profilePic ? (
                        <img 
                          src={authUser.profilePic} 
                          alt="profile pic" 
                          className="size-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-base-300 flex items-center justify-center text-2xl text-base-content">
                          <FaRegUserCircle />
                        </div>
                      )
                    ) : selectedUser.profilePic ? (
                      <img 
                        src={selectedUser.profilePic} 
                        alt="profile pic" 
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-base-300 flex items-center justify-center text-2xl text-base-content">
                        <FaRegUserCircle />
                      </div>
                    )}
                  </div>
                </div>
                <div className="chat-header mb-1 flex items-center gap-2">
                  <time className="text-xs opacity-50 ml-1">
                    {formatMessageTime(message.createdAt)}
                  </time>
                  {hoveredMessageId === message._id && !message.deleteForEveryone && (
                    <button
                      onClick={() => handleDeleteClick(message._id, isSender)}
                      className="btn btn-ghost btn-xs text-error"
                      title="Delete message"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className={`chat-bubble ${message.deleteForEveryone ? "bg-base-300 text-base-content/60" : ""} flex flex-col gap-2`}>
                  {message.deleteForEveryone ? (
                    <p className="italic">This message was deleted</p>
                  ) : (
                    <>
                      {message.text && <p>{message.text}</p>}
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Attachment"
                          className="max-w-[200px] rounded-md"
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Delete Options Modal */}
      {showDeleteOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg p-4 max-w-sm w-full mx-4">
            <h3 className="font-medium text-lg mb-4">Delete Message</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleMessageDelete(selectedMessageId, false)}
                className="btn btn-block"
              >
                Delete for me
              </button>
              <button
                onClick={() => handleMessageDelete(selectedMessageId, true)}
                className="btn btn-error btn-block"
              >
                Delete for everyone
              </button>
              <button
                onClick={() => {
                  setShowDeleteOptions(false);
                  setSelectedMessageId(null);
                }}
                className="btn btn-ghost btn-block"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <MessageInput />
    </div>
  );
};

export default ChatContainer;