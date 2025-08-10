// src/api/chat.ts

import axios, { AxiosResponse } from "axios";
import { User } from "./types";

const API_URL = "http://localhost:3000/api"; // Replace with your actual Next.js app URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for NextAuth session cookies
});

// Types based on Prisma schema
export interface ChatMessage {
  id: string;
  subject: string;
  text: string;
  date: string;
  read: boolean;
  deleted: boolean;
  labels: string[];
  sender_id: string | null;
  conversationId: string;
  User?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export interface Conversation {
  id: string;
  userId: string;
  contractorId: number;
  startedAt: string;
  subject: string | null;
  Chat: ChatMessage[];
  Contractor: {
    id: number;
    name: string;
    city: string;
    specializations: string[];
    rating: number;
    imageUrl?: string | null;
  };
  User: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  userId: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

// Chat API class
class ChatService {
  // Test if user is correctly signed in
  async testAuthentication(): Promise<{
    isAuthenticated: boolean;
    user?: User;
  }> {
    try {
      const response = await api.get("/auth/session");
      if (response.data.user) {
        return {
          isAuthenticated: true,
          user: response.data.user,
        };
      }
      return { isAuthenticated: false };
    } catch (error: any) {
      console.error("Authentication test failed:", error);
      return { isAuthenticated: false };
    }
  }

  // Get all conversations for the current user
  async getConversations(): Promise<Conversation[]> {
    try {
      // First check if user is authenticated
      const authCheck = await this.testAuthentication();
      if (!authCheck.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      const response = await api.get("/chat/conversations");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      if (error.message === "User not authenticated") {
        throw new Error("Please sign in to view conversations");
      }
      throw new Error(
        error.response?.data?.error || "Failed to fetch conversations"
      );
    }
  }

  // Get conversations for a specific contact/contractor
  async getConversationsByContractor(
    contractorId: number
  ): Promise<Conversation[]> {
    try {
      // First check if user is authenticated
      const authCheck = await this.testAuthentication();
      if (!authCheck.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      const response = await api.get(
        `/chat/conversations/contractor/${contractorId}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching contractor conversations:", error);
      if (error.message === "User not authenticated") {
        throw new Error("Please sign in to view conversations");
      }
      throw new Error(
        error.response?.data?.error ||
          "Failed to fetch contractor conversations"
      );
    }
  }

  // Get a specific conversation with its messages
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      // First check if user is authenticated
      const authCheck = await this.testAuthentication();
      if (!authCheck.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      const response = await api.get(`/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching conversation:", error);
      if (error.message === "User not authenticated") {
        throw new Error("Please sign in to view this conversation");
      }
      throw new Error(
        error.response?.data?.error || "Failed to fetch conversation"
      );
    }
  }

  // Get all contacts for the current user
  async getContacts(): Promise<Contact[]> {
    try {
      // First check if user is authenticated
      const authCheck = await this.testAuthentication();
      if (!authCheck.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      const response = await api.get("/chat/contacts");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      if (error.message === "User not authenticated") {
        throw new Error("Please sign in to view contacts");
      }
      throw new Error(
        error.response?.data?.error || "Failed to fetch contacts"
      );
    }
  }

  // Get contacts with conversation data (for the carousel and list view)
  async getContactsWithConversations(): Promise<Contact[]> {
    try {
      // First check if user is authenticated
      const authCheck = await this.testAuthentication();
      if (!authCheck.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      const response = await api.get("/chat/contacts/with-conversations");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching contacts with conversations:", error);
      if (error.message === "User not authenticated") {
        throw new Error("Please sign in to view contacts");
      }
      throw new Error(
        error.response?.data?.error ||
          "Failed to fetch contacts with conversations"
      );
    }
  }

  // Send a message - uses session authentication only
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    conversationId?: string
  ): Promise<ChatMessage> {
    try {
      // First check if user is authenticated
      const authCheck = await this.testAuthentication();
      if (!authCheck.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      const messageData = {
        text: content,
        sender_id: senderId,
        receiver_id: receiverId,
        conversationId: conversationId,
        subject: "New Message", // Default subject
      };

      const response = await api.post("/chat/messages", messageData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error.message === "User not authenticated") {
        throw new Error("Please sign in to send messages");
      }
      throw new Error(error.response?.data?.error || "Failed to send message");
    }
  }

  // Create a new conversation - uses session authentication only
  async createConversation(
    userId: string,
    contractorId: number,
    subject?: string
  ): Promise<Conversation> {
    try {
      // First check if user is authenticated
      const authCheck = await this.testAuthentication();
      if (!authCheck.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      const conversationData = {
        userId,
        contractorId,
        subject: subject || "New Conversation",
      };

      const response = await api.post("/chat/conversations", conversationData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      if (error.message === "User not authenticated") {
        throw new Error("Please sign in to create conversations");
      }
      throw new Error(
        error.response?.data?.error || "Failed to create conversation"
      );
    }
  }

  // Mark messages as read - uses session authentication only
  async markMessagesAsRead(conversationId: string): Promise<void> {
    try {
      // First check if user is authenticated
      const authCheck = await this.testAuthentication();
      if (!authCheck.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      await api.put(`/chat/conversations/${conversationId}/read`, {});
    } catch (error: any) {
      console.error("Error marking messages as read:", error);
      if (error.message === "User not authenticated") {
        throw new Error("Please sign in to mark messages as read");
      }
      throw new Error(
        error.response?.data?.error || "Failed to mark messages as read"
      );
    }
  }

  // Delete a message - uses session authentication only
  async deleteMessage(messageId: string): Promise<void> {
    try {
      // First check if user is authenticated
      const authCheck = await this.testAuthentication();
      if (!authCheck.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      await api.delete(`/chat/messages/${messageId}`);
    } catch (error: any) {
      console.error("Error deleting message:", error);
      if (error.message === "User not authenticated") {
        throw new Error("Please sign in to delete messages");
      }
      throw new Error(
        error.response?.data?.error || "Failed to delete message"
      );
    }
  }

  // Get unread message count for a user
  async getUnreadCount(): Promise<number> {
    try {
      // First check if user is authenticated
      const authCheck = await this.testAuthentication();
      if (!authCheck.isAuthenticated) {
        return 0; // Return 0 if not authenticated
      }

      const response = await api.get("/chat/unread-count");
      return response.data.count;
    } catch (error: any) {
      console.error("Error fetching unread count:", error);
      return 0; // Return 0 if there's an error
    }
  }

  // Search conversations
  async searchConversations(query: string): Promise<Conversation[]> {
    try {
      // First check if user is authenticated
      const authCheck = await this.testAuthentication();
      if (!authCheck.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      const response = await api.get(
        `/chat/conversations/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error searching conversations:", error);
      if (error.message === "User not authenticated") {
        throw new Error("Please sign in to search conversations");
      }
      throw new Error(
        error.response?.data?.error || "Failed to search conversations"
      );
    }
  }

  // Get conversation by contractor (for mobile app navigation)
  async getConversationByContractor(
    contractorId: number
  ): Promise<Conversation | null> {
    try {
      // First check if user is authenticated
      const authCheck = await this.testAuthentication();
      if (!authCheck.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      const response = await api.get(
        `/chat/conversations/contractor/${contractorId}/current`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No conversation exists
      }
      if (error.message === "User not authenticated") {
        throw new Error("Please sign in to view conversations");
      }
      console.error("Error fetching conversation by contractor:", error);
      throw new Error(
        error.response?.data?.error ||
          "Failed to fetch conversation by contractor"
      );
    }
  }

  // Get current user session
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get("/auth/session");
      return response.data.user || null;
    } catch (error: any) {
      return null; // User not authenticated
    }
  }

  // Test API connectivity and authentication
  async testApiConnection(): Promise<{
    connected: boolean;
    authenticated: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      // Test basic connectivity
      const authCheck = await this.testAuthentication();

      return {
        connected: true,
        authenticated: authCheck.isAuthenticated,
        user: authCheck.user,
      };
    } catch (error: any) {
      return {
        connected: false,
        authenticated: false,
        error: error.message || "API connection failed",
      };
    }
  }
}

const chatService = new ChatService();

// Export individual functions for backward compatibility
export const getConversations = async (
  contactId?: string
): Promise<Conversation[]> => {
  if (contactId) {
    // If contactId is provided, treat it as contractorId
    const contractorId = parseInt(contactId);
    if (isNaN(contractorId)) {
      throw new Error("Invalid contractor ID");
    }
    return await chatService.getConversationsByContractor(contractorId);
  }
  return await chatService.getConversations();
};

export const getConversation = async (
  conversationId: string
): Promise<Conversation> => {
  return await chatService.getConversation(conversationId);
};

export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string
): Promise<ChatMessage> => {
  return await chatService.sendMessage(senderId, receiverId, content);
};

export const getContactsWithConversations = async (): Promise<Contact[]> => {
  return await chatService.getContactsWithConversations();
};

export const getUsers = async (): Promise<User[]> => {
  // This would typically be used for user search, but we'll return contacts instead
  return (await chatService.getContacts()) as any[];
};

export const getMessages = async (): Promise<ChatMessage[]> => {
  // Get all messages from all conversations
  const conversations = await chatService.getConversations();
  const allMessages: ChatMessage[] = [];

  conversations.forEach((conversation) => {
    allMessages.push(...conversation.Chat);
  });

  return allMessages;
};

// Helper function to get contact by ID
export const getContactById = async (
  contactId: string
): Promise<Contact | null> => {
  try {
    const contacts = await chatService.getContacts();
    return contacts.find((contact) => contact.id === contactId) || null;
  } catch (error) {
    console.error("Error fetching contact by ID:", error);
    return null;
  }
};

// Export the chat service for direct use if needed
export { chatService };
