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

// Mock data for testing while backend is being set up
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    userId: "user1",
    lastMessage: "Hey, how's the project going?",
    lastMessageTime: "2 hours ago",
    unreadCount: 2,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    userId: "user2",
    lastMessage: "Can we meet tomorrow?",
    lastMessageTime: "1 day ago",
    unreadCount: 0,
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    userId: "user3",
    lastMessage: "Thanks for the update!",
    lastMessageTime: "3 days ago",
    unreadCount: 1,
  },
];

const mockConversations: Conversation[] = [
  {
    id: "conv1",
    userId: "currentUser",
    contractorId: 1,
    startedAt: "2024-01-15T10:00:00Z",
    subject: "Project Discussion",
    Chat: [
      {
        id: "msg1",
        subject: "Project Discussion",
        text: "Hey, how's the project going?",
        date: "2024-01-15T10:00:00Z",
        read: false,
        deleted: false,
        labels: [],
        sender_id: "1",
        conversationId: "conv1",
        User: {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
        },
      },
      {
        id: "msg2",
        subject: "Project Discussion",
        text: "It's going well! We're on track.",
        date: "2024-01-15T10:05:00Z",
        read: true,
        deleted: false,
        labels: [],
        sender_id: "currentUser",
        conversationId: "conv1",
        User: {
          id: "currentUser",
          name: "You",
          email: "you@example.com",
        },
      },
    ],
    Contractor: {
      id: 1,
      name: "John Doe",
      city: "New York",
      specializations: ["Web Development", "React"],
      rating: 4.8,
      imageUrl: null,
    },
    User: {
      id: "currentUser",
      name: "You",
      email: "you@example.com",
    },
  },
];

// Chat API class
class ChatService {
  // Get all conversations for the current user
  async getConversations(): Promise<Conversation[]> {
    try {
      // For now, return mock data while backend is being set up
      console.log("Returning mock conversations");
      return mockConversations;

      // Uncomment when backend is ready:
      // const response = await api.get("/chat/conversations");
      // return response.data;
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      // Return mock data on error for now
      return mockConversations;
    }
  }

  // Get conversations for a specific contact/contractor
  async getConversationsByContractor(
    contractorId: number
  ): Promise<Conversation[]> {
    try {
      // For now, return mock data while backend is being set up
      console.log("Returning mock conversations for contractor:", contractorId);
      return mockConversations.filter(
        (conv) => conv.contractorId === contractorId
      );

      // Uncomment when backend is ready:
      // const response = await api.get(
      //   `/chat/conversations/contractor/${contractorId}`
      // );
      // return response.data;
    } catch (error: any) {
      console.error("Error fetching contractor conversations:", error);
      return mockConversations.filter(
        (conv) => conv.contractorId === contractorId
      );
    }
  }

  // Get a specific conversation with its messages
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      // For now, return mock data while backend is being set up
      console.log("Returning mock conversation:", conversationId);
      const conversation = mockConversations.find(
        (conv) => conv.id === conversationId
      );
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      return conversation;

      // Uncomment when backend is ready:
      // const response = await api.get(`/chat/conversations/${conversationId}`);
      // return response.data;
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
      // For now, return mock data while backend is being set up
      console.log("Returning mock contacts");
      return mockContacts;

      // Uncomment when backend is ready:
      // const response = await api.get("/chat/contacts");
      // return response.data;
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      return mockContacts;
    }
  }

  // Get contacts with conversation data (for the carousel and list view)
  async getContactsWithConversations(): Promise<Contact[]> {
    try {
      // For now, return mock data while backend is being set up
      console.log("Returning mock contacts with conversations");
      return mockContacts;

      // Uncomment when backend is ready:
      // const response = await api.get("/chat/contacts/with-conversations");
      // return response.data;
    } catch (error: any) {
      console.error("Error fetching contacts with conversations:", error);
      return mockContacts;
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
      // For now, create a mock message while backend is being set up
      console.log("Creating mock message:", content);
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        text: content,
        subject: "New Message",
        date: new Date().toISOString(),
        read: false,
        deleted: false,
        labels: [],
        sender_id: senderId,
        conversationId: conversationId || "conv1",
        User: {
          id: senderId,
          name: senderId === "currentUser" ? "You" : "Other User",
          email: "user@example.com",
        },
      };

      // Add to mock conversation
      const conversation = mockConversations.find(
        (conv) => conv.id === (conversationId || "conv1")
      );
      if (conversation) {
        conversation.Chat.push(newMessage);
      }

      return newMessage;

      // Uncomment when backend is ready:
      // const messageData = {
      //   text: content,
      //   sender_id: senderId,
      //   receiver_id: receiverId,
      //   conversationId: conversationId,
      //   subject: "New Message", // Default subject
      // };

      // const response = await api.post("/chat/messages", messageData, {
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });
      // return response.data;
    } catch (error: any) {
      console.error("Error sending message:", error);
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
      // For now, create a mock conversation while backend is being set up
      console.log("Creating mock conversation");
      const newConversation: Conversation = {
        id: `conv_${Date.now()}`,
        userId,
        contractorId,
        startedAt: new Date().toISOString(),
        subject: subject || "New Conversation",
        Chat: [],
        Contractor: {
          id: contractorId,
          name: "New Contractor",
          city: "Unknown",
          specializations: [],
          rating: 0,
          imageUrl: null,
        },
        User: {
          id: userId,
          name: "You",
          email: "you@example.com",
        },
      };

      mockConversations.push(newConversation);
      return newConversation;

      // Uncomment when backend is ready:
      // const conversationData = {
      //   userId,
      //   contractorId,
      //   subject: subject || "New Conversation",
      // };

      // const response = await api.post("/chat/conversations", conversationData, {
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });
      // return response.data;
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      throw new Error(
        error.response?.data?.error || "Failed to create conversation"
      );
    }
  }

  // Mark messages as read - uses session authentication only
  async markMessagesAsRead(conversationId: string): Promise<void> {
    try {
      // For now, just log while backend is being set up
      console.log("Marking messages as read for conversation:", conversationId);

      // Update mock data
      const conversation = mockConversations.find(
        (conv) => conv.id === conversationId
      );
      if (conversation) {
        conversation.Chat.forEach((msg) => {
          msg.read = true;
        });
      }

      // Uncomment when backend is ready:
      // await api.put(`/chat/conversations/${conversationId}/read`, {});
    } catch (error: any) {
      console.error("Error marking messages as read:", error);
      throw new Error(
        error.response?.data?.error || "Failed to mark messages as read"
      );
    }
  }

  // Delete a message - uses session authentication only
  async deleteMessage(messageId: string): Promise<void> {
    try {
      // For now, just log while backend is being set up
      console.log("Deleting message:", messageId);

      // Update mock data
      mockConversations.forEach((conv) => {
        const messageIndex = conv.Chat.findIndex((msg) => msg.id === messageId);
        if (messageIndex !== -1) {
          conv.Chat[messageIndex].deleted = true;
        }
      });

      // Uncomment when backend is ready:
      // await api.delete(`/chat/messages/${messageId}`);
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
      // For now, return mock count while backend is being set up
      const unreadCount = mockConversations.reduce((total, conv) => {
        return (
          total +
          conv.Chat.filter(
            (msg) => !msg.read && msg.sender_id !== "currentUser"
          ).length
        );
      }, 0);

      return unreadCount;

      // Uncomment when backend is ready:
      // const response = await api.get("/chat/unread-count");
      // return response.data.count;
    } catch (error: any) {
      console.error("Error fetching unread count:", error);
      return 0; // Return 0 if there's an error
    }
  }

  // Search conversations
  async searchConversations(query: string): Promise<Conversation[]> {
    try {
      // For now, return filtered mock data while backend is being set up
      const filtered = mockConversations.filter(
        (conv) =>
          conv.subject?.toLowerCase().includes(query.toLowerCase()) ||
          conv.Chat.some((msg) =>
            msg.text.toLowerCase().includes(query.toLowerCase())
          )
      );

      return filtered;

      // Uncomment when backend is ready:
      // const response = await api.get(
      //   `/chat/conversations/search?q=${encodeURIComponent(query)}`
      // );
      // return response.data;
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
      // For now, return mock data while backend is being set up
      const conversation = mockConversations.find(
        (conv) => conv.contractorId === contractorId
      );
      return conversation || null;

      // Uncomment when backend is ready:
      // const response = await api.get(
      //   `/chat/conversations/contractor/${contractorId}/current`
      // );
      // return response.data;
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
      // For now, return mock user while backend is being set up
      return {
        id: "currentUser",
        name: "You",
        email: "you@example.com",
        isContractor: false,
      };

      // Uncomment when backend is ready:
      // const response = await api.get("/auth/session");
      // return response.data.user || null;
    } catch (error: any) {
      return null; // User not authenticated
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
