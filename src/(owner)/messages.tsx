/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessageCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../(auth)/store/Auth";
import { chatService } from "../api/chat";
import ErrorModal from "./components/chat_error";
import {
  type OwnerChat,
  ownerChatSocket,
  type ChatMessage,
  type ChatUpdateData,
} from "./socket/chat-socket";
import { useResortStore } from "./store/resort";
import Sidebar from "./components/sidebar";

const formatTime = (date: Date) => {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else if (diffInHours < 48) {
    return "Yesterday";
  } else {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

export default function ChatListScreen() {
  const [chats, setChats] = useState<OwnerChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [errorAlert, setErrorAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "OneStay / Messages";
  }, []);

  const { resorts, loading: resortsLoading, hasResorts } = useResortStore();
  const { user } = useAuthStore();

  useEffect(() => {
    initializeChat();
    return () => {
      ownerChatSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!resortsLoading && hasResorts) {
      loadChats();
    }
  }, [resortsLoading, hasResorts, resorts]);

  const initializeChat = async () => {
    try {
      const connected = await ownerChatSocket.connect();
      setSocketConnected(connected);

      if (!connected) {
        setErrorAlert({
          title: "Connection Error",
          message:
            "Failed to connect to chat service. You can still view messages but real-time updates won't work.",
        });
      }

      setupSocketListeners();
    } catch (error) {
      console.error("Error initializing chat:", error);
      setErrorAlert({ title: "Error", message: "Failed to initialize chat" });
    } finally {
      setLoading(false);
    }
  };

  const refreshChats = async () => {
    setRefreshing(true);
    try {
      await loadChats();
    } catch (error) {
      console.error("Error refreshing chats:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const setupSocketListeners = () => {
    // for new messages
    const unsubMessage = ownerChatSocket.onMessage((message: ChatMessage) => {
      updateChatWithNewMessage(message);
    });

    // for chat updates (real-time chat list updates)
    const unsubChatUpdate = ownerChatSocket.onChatUpdate(
      (update: ChatUpdateData) => {
        console.log("[OwnerChatScreen] Received chat_updated event:", update);
        handleChatUpdate(update);
      }
    );

    // for connection changes
    const unsubConnection = ownerChatSocket.onConnection((connected: any) => {
      setSocketConnected(connected);
    });

    // for errors
    const unsubError = ownerChatSocket.onError((error: any) => {
      console.error("Socket error:", error);
    });

    return () => {
      unsubMessage();
      unsubChatUpdate();
      unsubConnection();
      unsubError();
    };
  };

  const loadChats = async () => {
    try {
      if (!user?.id) {
        console.log("No user found for loading chats");
        return;
      }

      if (resortsLoading) {
        console.log("Waiting for resorts to load...");
        return;
      }

      if (!hasResorts || resorts.length === 0) {
        console.log("No resorts found for owner. Cannot load chats.");
        setChats([]);
        return;
      }

      const resortId = resorts[0]._id;

      console.log("Loading chats for resort:", resortId);
      const apiChats = await chatService.getResortChats(resortId);
      console.log("API chats response:", apiChats);

      const transformedChats = apiChats.map((chat: any) =>
        chatService.transformApiChat(chat)
      );

      transformedChats.sort(
        (a: any, b: any) =>
          new Date(b.last_message_time).getTime() -
          new Date(a.last_message_time).getTime()
      );

      console.log("Transformed chats:", transformedChats);
      setChats(transformedChats);
    } catch (error) {
      console.error("Error loading chats:", error);
      setErrorAlert({
        title: "Error",
        message: `Failed to load chats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
      setChats([]);
    }
  };

  const updateChatWithNewMessage = (message: ChatMessage) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.map((chat) => {
        if (chat._id === message.chatId) {
          return {
            ...chat,
            last_message: message.text,
            last_message_time: message.timestamp,
            unread_count:
              message.sender === "customer"
                ? chat.unread_count + 1
                : chat.unread_count,
          };
        }
        return chat;
      });

      return updatedChats.sort(
        (a, b) =>
          new Date(b.last_message_time).getTime() -
          new Date(a.last_message_time).getTime()
      );
    });
  };

  const handleChatUpdate = (update: ChatUpdateData) => {
    console.log("Owner received chat update:", update);

    setChats((prevChats) => {
      const updatedChats = [...prevChats];
      const existingChatIndex = updatedChats.findIndex(
        (chat) => chat._id === update.chatId
      );

      if (update.isNewChat && existingChatIndex === -1) {
        console.log("New chat detected for owner, reloading chat list...");
        loadChats();
        return prevChats;
      } else if (existingChatIndex >= 0) {
        updatedChats[existingChatIndex] = {
          ...updatedChats[existingChatIndex],
          last_message: update.lastMessage,
          last_message_time: update.lastMessageTime,
          unread_count:
            update.sender === "customer"
              ? updatedChats[existingChatIndex].unread_count + 1
              : updatedChats[existingChatIndex].unread_count,
        };

        return updatedChats.sort((a, b) => {
          return (
            new Date(b.last_message_time).getTime() -
            new Date(a.last_message_time).getTime()
          );
        });
      } else {
        console.log("Chat not found locally for owner, reloading chat list...");
        loadChats();
        return prevChats;
      }
    });
  };

  const handleChatPress = (chat: OwnerChat) => {
    if (chat.unread_count > 0) {
      ownerChatSocket.markAsRead(chat._id);
      setChats((prevChats) =>
        prevChats.map((c) =>
          c._id === chat._id ? { ...c, unread_count: 0 } : c
        )
      );
    }
    navigate(`/view/messages/${chat._id}`);
  };

  // --- Render Functions ---

  const renderChatItem = (chat: OwnerChat) => (
    <button
      key={chat._id}
      onClick={() => handleChatPress(chat)}
      className="flex flex-row justify-between w-full bg-base-200 shadow p-6 cursor-pointer"
    >
      <div className="flex flex-col">
        <h3 className="text-lg text-gray-900 font-bold ">
          {chat.customer_name}
        </h3>

        <p
          className={`text-sm text-left ${
            chat.unread_count > 0
              ? "text-gray-900 font-medium"
              : "text-gray-500"
          }`}
        >
          {chat.last_message.trim()}
        </p>
      </div>
      <div className="flex items-center">
        {/* {chat.unread_count > 0 && (
          <div className="bg-red-500 rounded-full h-5 flex items-center justify-center px-1.5 mr-2">
            <span className="text-white text-xs font-bold">
              {chat.unread_count > 99 ? "99+" : chat.unread_count}
            </span>
          </div>
        )} */}
        <span className="text-sm text-gray-500 font-medium">
          {formatTime(chat.last_message_time)}
        </span>
      </div>
    </button>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col flex-1 items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <MessageCircle size={32} color="#9CA3AF" />
      </div>
      <h2 className="text-xl text-gray-900 font-bold mb-2">
        {!hasResorts ? "No Resort Found" : "No guest messages"}
      </h2>
      <p className="text-gray-500 leading-5">
        {!hasResorts
          ? "Create a resort first to receive messages from guests"
          : "When guests book your resort, their conversations will appear here"}
      </p>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-gray-600">
          {resortsLoading ? "Loading resort data..." : "Loading chats..."}
        </span>
      </div>
    </div>
  );

  return (
    <main className="grid grid-cols-[0.2fr_1fr] h-dvh">
      <Sidebar />
      <div className="flex flex-col gap-6 p-12">
        {errorAlert && (
          <ErrorModal
            title={errorAlert.title}
            message={errorAlert.message}
            onClose={() => setErrorAlert(null)}
          />
        )}
        <div className="flex flex-row items-center justify-between">
          <h1 className="lg:text-4xl font-bold">Messages</h1>
          <button
            onClick={refreshChats}
            disabled={refreshing}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
          >
            <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
        {loading || resortsLoading ? (
          renderLoading()
        ) : chats.length > 0 ? (
          <div className="flex-1">
            <div className="space-y-3">
              {chats.map((chat) => renderChatItem(chat))}
            </div>
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>
    </main>
  );
}
