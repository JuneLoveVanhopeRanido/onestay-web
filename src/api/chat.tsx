/* eslint-disable @typescript-eslint/no-explicit-any */
import type { OwnerChat } from "../(owner)/socket/chat-socket";
import { authenticatedApiRequest } from "../api/client";

export interface ChatApiResponse {
  _id: string;
  customer_id: {
    _id: string;
    username: string;
    email: string;
  };
  resort_id: {
    _id: string;
    resort_name: string;
    location: string;
  };
  messages: Array<{
    _id: string;
    sender: "customer" | "owner";
    text: string;
    timestamp: string;
  }>;
  createdAt: string;
  deleted: boolean;
}

export interface SendMessageRequest {
  customer_id: string;
  resort_id: string;
  sender: "customer" | "owner";
  text: string;
}

class ChatService {
  // Send a message via REST API (backup to socket)
  async sendMessage(data: SendMessageRequest): Promise<ChatApiResponse> {
    return await authenticatedApiRequest("/chat/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Get chat by ID with optional pagination
  async getChat(
    chatId: string,
    options?: { limit?: number; skip?: number }
  ): Promise<ChatApiResponse> {
    let url = `/chat/${chatId}`;
    if (options) {
      const params = new URLSearchParams();
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.skip) params.append("skip", options.skip.toString());
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    return await authenticatedApiRequest(url);
  }

  // Load more messages for a chat
  async loadMoreMessages(
    chatId: string,
    options?: { limit?: number; skip?: number }
  ): Promise<{ messages: any[]; pagination: any }> {
    let url = `/chat/${chatId}/load-more`;
    if (options) {
      const params = new URLSearchParams();
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.skip) params.append("skip", options.skip.toString());
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    return await authenticatedApiRequest(url);
  }

  // Get all chats for a user (customer)
  async getUserChats(userId: string): Promise<ChatApiResponse[]> {
    return await authenticatedApiRequest(`/chat/user/${userId}`);
  }

  // Get all chats for a resort (owner)
  async getResortChats(resortId: string): Promise<ChatApiResponse[]> {
    try {
      const response = await authenticatedApiRequest(
        `/chat/resort/${resortId}/chats`
      );
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Error fetching resort chats:", error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(chatId: string): Promise<{ message: string }> {
    return await authenticatedApiRequest(`/chat/${chatId}/read`, {
      method: "PUT",
    });
  }

  // Delete chat (soft delete)
  async deleteChat(chatId: string): Promise<{ message: string }> {
    return await authenticatedApiRequest(`/chat/${chatId}`, {
      method: "DELETE",
    });
  }

  // Transform API response to local chat format
  transformApiChat(apiChat: ChatApiResponse): OwnerChat {
    return {
      _id: apiChat._id,
      customer_id: apiChat.customer_id._id,
      resort_id: apiChat.resort_id._id,
      customer_name: apiChat.customer_id.username,
      customer_avatar: `https://placehold.co/100x100/E9D5FF/4F46E5?text=${apiChat.customer_id.username[0].toUpperCase()}`,
      resort_name: apiChat.resort_id.resort_name,
      booking_id: `BK${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`, // Generate random booking ID
      last_message:
        apiChat.messages.length > 0
          ? apiChat.messages[apiChat.messages.length - 1].text
          : "No messages yet",
      last_message_time:
        apiChat.messages.length > 0
          ? new Date(apiChat.messages[apiChat.messages.length - 1].timestamp)
          : new Date(apiChat.createdAt),
      unread_count: this.calculateUnreadCount(apiChat.messages), // Calculate based on message read status
      booking_status: this.determineGuestStatus(), // You can enhance this based on booking data
      messages: apiChat.messages.map((msg) => ({
        _id: msg._id,
        sender: msg.sender,
        text: msg.text,
        timestamp: new Date(msg.timestamp),
        chatId: apiChat._id,
      })),
    };
  }

  private calculateUnreadCount(messages: any[]): number {
    return messages.filter((msg) => msg.sender === "customer").length;
  }

  private determineGuestStatus(): "active" | "checked_out" | "upcoming" {
    const statuses = ["active", "checked_out", "upcoming"] as const;
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
}

export const chatService = new ChatService();
