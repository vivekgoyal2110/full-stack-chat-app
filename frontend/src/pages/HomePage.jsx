import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen pt-16 bg-base-200">
      <div className="container mx-auto flex items-center justify-center h-full px-4">
        <div className="bg-base-100 w-full max-w-6xl h-[calc(100vh-5rem)] rounded-lg shadow-xl">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {selectedUser ? <ChatContainer /> : <NoChatSelected />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;