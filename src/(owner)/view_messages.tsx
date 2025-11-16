/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowLeft, Wifi, WifiOff, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { chatService } from "../api/chat";
import ErrorModal from "./components/chat_error";
import {
  type OwnerChat,
  ownerChatSocket,
  type ChatMessage,
} from "./socket/chat-socket";
import Sidebar from "./components/sidebar";

const formatMessageTime = (date: Date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// --- Main Component ---

export default function OwnerChatConversation() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [currentChat, setCurrentChat] = useState<OwnerChat | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorAlert, setErrorAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "OneStay / Chat";
  }, []);

  useEffect(() => {
    initializeChat();
    return () => {
      if (chatId) {
        ownerChatSocket.leaveChat(chatId as string);
      }
    };
  }, [chatId]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      await loadChat();

      const connected =
        ownerChatSocket.connected || (await ownerChatSocket.connect());
      setSocketConnected(connected);

      if (connected && chatId) {
        ownerChatSocket.joinChat(chatId as string);
        ownerChatSocket.getChatStatus(chatId as string);
        ownerChatSocket.markAsRead(chatId as string);
      }

      setupSocketListeners();
    } catch (error) {
      console.error("Error initializing chat:", error);
      setErrorAlert({ title: "Error", message: "Failed to load chat" });
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async () => {
    try {
      if (!chatId) return;

      const apiChat = await chatService.getChat(chatId as string, {
        limit: 1000,
      });
      const transformedChat = chatService.transformApiChat(apiChat);

      setCurrentChat(transformedChat);
    } catch (error) {
      console.error("Error loading chat:", error);
      setErrorAlert({
        title: "Error",
        message: `Failed to load chat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  };

  const setupSocketListeners = () => {
    const unsubscribeMessage = ownerChatSocket.onMessage((newMessage) => {
      if (newMessage.chatId === chatId) {
        if (newMessage.senderId !== ownerChatSocket.userId) {
          setCurrentChat((prevChat) => {
            if (!prevChat) return null;
            return {
              ...prevChat,
              messages: [
                ...prevChat.messages,
                { ...newMessage, timestamp: new Date(newMessage.timestamp) },
              ],
              last_message: newMessage.text,
              last_message_time: new Date(newMessage.timestamp),
            };
          });
        }
      }
    });

    const unsubscribeConnection = ownerChatSocket.onConnection((connected) => {
      setSocketConnected(connected);
    });

    const unsubscribeChatStatus = ownerChatSocket.onChatStatus((status) => {
      if (status.chatId === chatId) {
        setIsOtherUserOnline(status.isOtherUserOnline);
      }
    });

    const unsubscribeMessageSent = ownerChatSocket.onMessageSent(
      (confirmation) => {
        if (confirmation.chatId === chatId) {
          setCurrentChat((prevChat) => {
            if (!prevChat) return null;
            return {
              ...prevChat,
              messages: prevChat.messages.map((msg) => {
                if (
                  msg._id.startsWith("temp_") &&
                  confirmation.message &&
                  msg.text === confirmation.message.text
                ) {
                  return {
                    ...confirmation.message,
                    timestamp: new Date(confirmation.message.timestamp),
                  };
                }
                return msg;
              }),
            };
          });
        }
      }
    );

    const unsubscribeError = ownerChatSocket.onError((error) => {
      console.error("Chat socket error:", error);
      setErrorAlert({ title: "Connection Error", message: error });
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
      unsubscribeChatStatus();
      unsubscribeMessageSent();
      unsubscribeError();
    };
  };

  const handleSendMessage = async () => {
    if (message.trim() && currentChat && chatId) {
      const messageText = message.trim();
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const tempMessage: ChatMessage = {
        _id: tempId,
        sender: "owner",
        text: messageText,
        timestamp: new Date(),
        chatId: chatId as string,
      };

      setCurrentChat((prevChat) => {
        if (!prevChat) return null;
        return {
          ...prevChat,
          messages: [...prevChat.messages, tempMessage],
          last_message: messageText,
          last_message_time: new Date(),
        };
      });

      setMessage("");

      try {
        if (socketConnected) {
          ownerChatSocket.sendMessage({
            chatId: chatId as string,
            text: messageText,
          });
        } else {
          // Fallback to REST API
          const sentMessage = await chatService.sendMessage({
            customer_id: currentChat.customer_id,
            resort_id: currentChat.resort_id,
            sender: "owner",
            text: messageText,
          });

          if (
            sentMessage &&
            sentMessage.messages &&
            sentMessage.messages.length > 0
          ) {
            const realMessage =
              sentMessage.messages[sentMessage.messages.length - 1];
            setCurrentChat((prevChat) => {
              if (!prevChat) return null;
              return {
                ...prevChat,
                messages: prevChat.messages.map((msg) =>
                  msg._id === tempId
                    ? {
                        ...msg,
                        _id: realMessage._id,
                        timestamp: new Date(realMessage.timestamp),
                      }
                    : msg
                ),
              };
            });
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setErrorAlert({
          title: "Error",
          message: `Failed to send message: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });

        setCurrentChat((prevChat) => {
          if (!prevChat) return null;
          return {
            ...prevChat,
            messages: prevChat.messages.filter(
              (msg) => msg._id !== tempMessage._id
            ),
          };
        });
      }
    }
  };

  useEffect(() => {
    if (messageListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
      if (scrollHeight - scrollTop - clientHeight < 150) {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      }
    }
  }, [currentChat?.messages.length]);

  useEffect(() => {
    if (!loading && messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [loading]);

  // --- Render Message Bubble ---

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isOwner = msg.sender === "owner";
    const prevMessage = index > 0 ? currentChat!.messages[index - 1] : null;
    const nextMessage =
      index < currentChat!.messages.length - 1
        ? currentChat!.messages[index + 1]
        : null;

    const isFirstInGroup = !prevMessage || prevMessage.sender !== msg.sender;
    const isLastInGroup = !nextMessage || nextMessage.sender !== msg.sender;
    const showTime = isLastInGroup;

    return (
      <div
        key={msg._id}
        className={`flex mb-2 ${isOwner ? "justify-end" : "justify-start"}`}
      >
        {!isOwner && isLastInGroup && (
          <img
            src={currentChat!.customer_avatar}
            className="w-8 h-8 rounded-full mr-2 mt-1 self-end"
            alt="avatar"
          />
        )}
        {!isOwner && !isLastInGroup && <div className="w-10 mr-2" />}

        <div className={`max-w-[75%] ${isOwner ? "items-end" : "items-start"}`}>
          <div
            className={`px-4 py-3 shadow-sm ${
              isOwner
                ? `bg-red-500 text-white ${
                    isFirstInGroup ? "rounded-t-2xl" : "rounded-t-sm"
                  } ${
                    isLastInGroup
                      ? "rounded-bl-2xl rounded-br-md"
                      : "rounded-b-sm"
                  }`
                : `bg-white text-gray-900 ${
                    isFirstInGroup ? "rounded-t-2xl" : "rounded-t-sm"
                  } ${
                    isLastInGroup
                      ? "rounded-br-2xl rounded-bl-md"
                      : "rounded-b-sm"
                  }`
            }`}
          >
            <p className="text-base leading-5">{msg.text}</p>
          </div>

          {showTime && (
            <p className="text-xs text-gray-500 text-center p-2">
              {formatMessageTime(msg.timestamp)}
            </p>
          )}
        </div>
      </div>
    );
  };

  // --- Main Render ---

  if (!currentChat && !loading) {
    return (
      <div className="flex-1 bg-white items-center justify-center">
        <p className="text-gray-500">Chat not found</p>
      </div>
    );
  }

  return (
    <main className="grid grid-cols-[0.3fr_1fr] 2xl:grid-cols-[0.2fr_1fr] h-dvh">
      <Sidebar />
      <div className="flex flex-col h-dvh bg-white">
        {errorAlert && (
          <ErrorModal
            title={errorAlert.title}
            message={errorAlert.message}
            onClose={() => {
              navigate(-1 as any);
              setErrorAlert(null);
            }}
          />
        )}

        <div className="flex gap-6 items-center p-4 bg-base-100 border-b border-b-base-300">
          <button onClick={() => navigate(-1)} className="cursor-pointer">
            <ArrowLeft size={24} color="#374151" />
          </button>
          <h1 className="text-lg text-gray-900 flex-1 truncate font-bold">
            {loading ? "Loading..." : currentChat?.customer_name || "Chat"}
          </h1>
          <div className="relative">
            {socketConnected ? (
              <Wifi size={20} color="#16A34A" />
            ) : (
              <WifiOff size={20} color="#DC2626" />
            )}
            {socketConnected && (
              <div
                className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                  isOtherUserOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
            )}
          </div>
        </div>

        <div
          ref={messageListRef}
          className="flex-1 px-4 py-4 bg-base-200 overflow-y-auto"
        >
          {currentChat &&
            currentChat.messages &&
            currentChat.messages.map(renderMessage)}
        </div>

        <div className="flex flex-row items-end p-4 bg-base-100 border-t border-t-base-300">
          <div className="flex-1 max-h-24 bg-gray-50 rounded-2xl border border-gray-200 flex items-center">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                socketConnected ? "Type a message..." : "Connecting..."
              }
              disabled={!socketConnected}
              className="w-full text-base bg-transparent border-none outline-none resize-none px-4 py-3 disabled:text-base-100"
              rows={1}
              maxLength={500}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || !socketConnected}
            className={`w-12 h-12 rounded-full flex items-center justify-center ml-3 shrink-0
            ${
              message.trim() && socketConnected
                ? "bg-red-500 shadow-md cursor-pointer"
                : "bg-gray-300"
            }
            transition-all duration-150`}
          >
            <Send size={18} color="white" className="ml-1" />
          </button>
        </div>
      </div>
    </main>
  );
}
