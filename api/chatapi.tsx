// api/chatapi.tsx
// Updated to use JWT token authentication

import { User } from "./types";
import { api } from "./authapi"; // Import the authenticated axios instance

const API_URL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:3000";

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
  // Enhanced sender/receiver info from API
  sender?: {
    id: string;
    name: string;
    type: "user" | "contractor";
  };
  receiver?: {
    id: string;
    name: string;
    type: "user" | "contractor";
  };
  isFromCurrentUser?: boolean;
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
  // Enhanced conversation context
  userRole?: "user" | "contractor";
  otherParty?: any;
  sender?: {
    id: string;
    name: string;
    type: "user" | "contractor";
  };
  receiver?: {
    id: string;
    name: string;
    type: "user" | "contractor";
  };
  conversationRole?: "user" | "contractor";
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  userId: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isContractor?: boolean;
  conversationId?: string;
  // Enhanced sender/receiver context
  sender?: {
    id: string;
    name: string;
    type: "user" | "contractor";
  };
  receiver?: {
    id: string;
    name: string;
    type: "user" | "contractor";
  };
  conversationRole?: "user" | "contractor";
  contractor?: {
    id: number;
    name: string;
    city: string;
    specializations: string[];
    rating: number;
    imageUrl?: string | null;
  };
}

// Chat API class
class ChatService {
  // Test if user is correctly signed in (using JWT token)
  async testAuthentication(): Promise<{
    isAuthenticated: boolean;
    user?: User;
  }> {
    try {
      // The api instance already includes the JWT token via interceptors
      const response = await api.get("/api/auth/session");
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
      // The api instance already includes JWT token authentication
      const response = await api.get("/api/chat/conversations");
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
      const response = await api.get(
        `/api/chat/conversations/contractor/${contractorId}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching contractor conversations:", error);
      throw new Error(
        error.response?.data?.error ||
          "Failed to fetch contractor conversations"
      );
    }
  }

  // Get a specific conversation with its messages
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const response = await api.get(`/api/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching conversation:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch conversation"
      );
    }
  }

  // Get all contacts for the current user
  async getContacts(): Promise<Contact[]> {
    try {
      const response = await api.get("/api/chat/contacts");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch contacts"
      );
    }
  }

  // Get contacts with conversation data (for the carousel and list view)
  async getContactsWithConversations(): Promise<Contact[]> {
    try {
      const response = await api.get("/api/chat/contacts/with-conversations");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching contacts with conversations:", error);
      throw new Error(
        error.response?.data?.error ||
          "Failed to fetch contacts with conversations"
      );
    }
  }

  // Send a message - JWT token authentication via interceptors
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    conversationId?: string
  ): Promise<ChatMessage> {
    try {
      const messageData = {
        text: content,
        sender_id: senderId,
        receiver_id: receiverId,
        conversationId: conversationId,
        subject: "New Message", // Default subject
      };

      const response = await api.post("/api/chat/messages", messageData);
      return response.data;
    } catch (error: any) {
      console.error("Error sending message:", error);
      throw new Error(error.response?.data?.error || "Failed to send message");
    }
  }

  // Create a new conversation - JWT token authentication via interceptors
  async createConversation(
    userId: string,
    contractorId: number,
    subject?: string
  ): Promise<Conversation> {
    try {
      const conversationData = {
        userId,
        contractorId,
        subject: subject || "New Conversation",
      };

      const response = await api.post("/api/chat/conversations", conversationData);
      return response.data;
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      throw new Error(
        error.response?.data?.error || "Failed to create conversation"
      );
    }
  }

  // Mark messages as read - JWT token authentication via interceptors
  async markMessagesAsRead(conversationId: string): Promise<void> {
    try {
      await api.put(`/api/chat/conversations/${conversationId}/read`, {});
    } catch (error: any) {
      console.error("Error marking messages as read:", error);
      throw new Error(
        error.response?.data?.error || "Failed to mark messages as read"
      );
    }
  }

  // Delete a message - JWT token authentication via interceptors
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await api.delete(`/api/chat/messages/${messageId}`);
    } catch (error: any) {
      console.error("Error deleting message:", error);
      throw new Error(
        error.response?.data?.error || "Failed to delete message"
      );
    }
  }

  // Get unread message count for a user
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get("/api/chat/unread-count");
      return response.data.count;
    } catch (error: any) {
      console.error("Error fetching unread count:", error);
      return 0; // Return 0 if there's an error
    }
  }

  // Search conversations
  async searchConversations(query: string): Promise<Conversation[]> {
    try {
      const response = await api.get(
        `/api/chat/conversations/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error searching conversations:", error);
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
      const response = await api.get(
        `/api/chat/conversations/contractor/${contractorId}/current`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No conversation exists
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
      const response = await api.get("/api/auth/session");
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
