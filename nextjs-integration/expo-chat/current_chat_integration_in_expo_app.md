## Expo Chat - Current Implementation Overview

This document describes the **current chat implementation** in the Expo app: main features, how the UI is structured, and how it talks to the **Next.js backend** via the chat API.

---

## High-Level Architecture

- **UI Screens**
  - `app/chat.tsx` → wraps `app/(auth)/chat/index.tsx` as the main chat entry.
  - `app/(auth)/chat/index.tsx` → main chat page (all contacts + conversations).
  - `app/(auth)/chat/[contactId].tsx` → chat focused on a specific contact.
  - `app/(auth)/chat/[contactId]/[conversationId].tsx` → specific conversation view.
- **Layout Components**
  - `ChatLayout` (three-panel layout controller).
  - `LeftPanel` (contacts + conversations list).
  - `RightPanel` (messages view).
- **Data & API**
  - `api/chatapi.tsx` → typed chat API client (JWT-based).
  - `lib/auth-context.tsx` → global auth state (user, tokens).
  - `api/authapi.tsx` → Better Auth + JWT login/refresh/session.
- **Backend**
  - Current mobile app expects Next.js endpoints under `/api/chat/*` and `/api/auth/session`.

---

## 1. Chat Screens & Navigation

### 1.1 Main Chat Entry (`app/chat.tsx`)

```tsx
// app/chat.tsx
import React from "react";
import ChatPage from "./(auth)/chat/index";

export default function MainChat() {
  return <ChatPage />;
}
```

- Navigating to `/chat` renders `ChatPage` from `/(auth)/chat/index.tsx`.
- Route is under the `(auth)` group, so it’s protected by the auth layout.

### 1.2 Protected Auth Layout (`app/(auth)/_layout.tsx`)

```tsx
import React from "react";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { ActivityIndicator, View, StyleSheet } from "react-native";

export default function AuthenticatedLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  return <Stack />;
}
```

- Ensures that **chat routes only render for authenticated users**.
- Uses `useAuth()` (not the legacy `AuthManager`) to check login state.

---

## 2. Chat Layout & Panels

### 2.1 Main Chat Page (`app/(auth)/chat/index.tsx`)

Responsibilities:
- Load **contacts with conversations**.
- Load **all conversations**.
- Pass data into `ChatLayout`.
- Use `useAuth()` to know current user.

Key logic:

```tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ChatLayout from "./components/ChatLayout";
import {
  getContactsWithConversations,
  getConversations,
  getConversation,
} from "../../../api/chatapi";
import { useAuth } from "../../../lib/auth-context";

export default function ChatPage() {
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const [contacts, setContacts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedContactId = params.contactId as string | undefined;
  const selectedConversationId = params.conversationId as string | undefined;

  const currentUserId = user?.id || "currentUser";
  const currentUserName = user?.name || "You";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const contactsData = await getContactsWithConversations();
      setContacts(contactsData);

      const conversationsData = await getConversations();
      setConversations(conversationsData);
    } catch (err) {
      console.error("Error loading chat data:", err);
      setError("Failed to load chat data");
    } finally {
      setLoading(false);
    }
  };

  // ... loadConversations / loadConversation helpers omitted for brevity

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading chat data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ChatLayout
        contacts={contacts}
        conversations={conversations}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        selectedContactId={selectedContactId || null}
        selectedConversationId={selectedConversationId || null}
        conversation={conversation}
      />
    </View>
  );
}
```

### 2.2 `ChatLayout` – Panel Controller

`app/(auth)/chat/components/ChatLayout.tsx`:

```tsx
interface ChatLayoutProps {
  contacts: any[];
  conversations: any[];
  currentUserId: string;
  currentUserName: string | null;
  selectedContactId?: string | null;
  selectedConversationId?: string | null;
  conversation?: any;
}

export default function ChatLayout({
  contacts,
  conversations,
  currentUserId,
  currentUserName,
  selectedContactId,
  selectedConversationId,
  conversation,
}: ChatLayoutProps) {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<"contacts" | "messages">("contacts");

  useEffect(() => {
    if (selectedConversationId) setActivePanel("messages");
    else setActivePanel("contacts");
  }, [selectedConversationId]);

  const handleSelectContact = (contactId: string) => {
    setActivePanel("contacts");
    router.push(`/chat/${contactId}`);
  };

  const handleSelectConversation = (conversationId: string, contactId: string) => {
    setActivePanel("messages");
    router.push(`/chat/${contactId}/${conversationId}`);
  };

  const handleBack = () => {
    if (activePanel === "messages") {
      setActivePanel("contacts");
      router.push("/chat");
    }
  };

  return (
    <View style={styles.container}>
      {/* header omitted for brevity */}
      <View style={styles.content}>
        {activePanel === "contacts" && (
          <LeftPanel
            contacts={contacts}
            conversations={conversations}
            currentUserId={currentUserId}
            selectedContactId={selectedContactId || null}
            selectedConversationId={selectedConversationId || null}
            onSelectContact={handleSelectContact}
            onSelectConversation={handleSelectConversation}
          />
        )}

        {activePanel === "messages" && selectedConversationId && (
          <RightPanel
            messages={conversation?.Chat || []}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            selectedConversationId={selectedConversationId}
            selectedContactId={selectedContactId || null}
            conversation={conversation}
          />
        )}
      </View>
    </View>
  );
}
```

**Key idea:** `ChatLayout` orchestrates which panel is visible and syncs with the router (`/chat`, `/chat/[contactId]`, `/chat/[contactId]/[conversationId]`).

---

## 3. LeftPanel – Contacts & Conversations

Main responsibilities:
- Show **contacts carousel** (top).
- Show **conversations list** for selected contact (bottom).
- Support **search**, **unread badges**, and **selection state**.
- Drive navigation to correct `/chat/*` routes.

Key parts:

```tsx
export default function LeftPanel({
  contacts,
  conversations,
  currentUserId,
  selectedContactId,
  selectedConversationId,
  onSelectContact,
  onSelectConversation,
}: LeftPanelProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter conversations for currently selected contact
  const getFilteredConversations = () => {
    if (!selectedContactId) return [];

    const selectedContact = contacts.find((c) => c.id === selectedContactId);
    if (!selectedContact) return [];

    // 1) Prefer explicit conversationId attached to contact
    if (selectedContact.conversationId) {
      return conversations.filter(
        (c) => c.id === selectedContact.conversationId
      );
    }

    // 2) Fallback by matching contractor/user IDs
    if (selectedContact.isContractor) {
      return conversations.filter(
        (c) =>
          c.contractorId?.toString() === selectedContactId ||
          c.Contractor?.id?.toString() === selectedContactId
      );
    } else {
      return conversations.filter(
        (c) =>
          c.userId === selectedContactId || c.User?.id === selectedContactId
      );
    }
  };

  const handleSelectContact = (contactId: string) => {
    onSelectContact(contactId);
    router.push(`/chat/${contactId}`);
  };

  const handleSelectConversation = (conversationId: string) => {
    if (selectedContactId) {
      onSelectConversation(conversationId, selectedContactId);
    }
  };

  // Unread badge example
  const hasUnread = item.Chat?.some(
    (msg: any) => !msg.read && msg.sender_id !== currentUserId
  );
```

Features implemented in `LeftPanel`:
- **Search** across contacts and conversations.
- **Unread counts** per contact and per conversation.
- **Responsive layout** (mobile/desktop).
- Clear selection / back-to-main.

---

## 4. RightPanel – Messages View

Responsibilities:
- Render a **single conversation** (list of messages).
- Differentiate **current user vs other party**.
- Style messages by **sender role** (user vs contractor).
- Support **soft delete** (mark a message as deleted in UI).

Key logic:

```tsx
export default function RightPanel({
  messages,
  currentUserId,
  currentUserName,
  selectedConversationId,
  selectedContactId,
  conversation,
}: RightPanelProps) {
  const [displayedMessages, setDisplayedMessages] = useState(messages);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setDisplayedMessages(messages);
  }, [messages, currentUserId, conversation]);

  useEffect(() => {
    if (scrollViewRef.current && displayedMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [displayedMessages, selectedConversationId]);

  const getSenderName = (message: any) => {
    if (message.sender?.name) return message.sender.name;
    if (message.sender_id === currentUserId || message.isFromCurrentUser) {
      return currentUserName || "You";
    }
    return message.User?.name || "Contact";
  };

  const getSenderType = (message: any) => {
    if (message.sender?.type) return message.sender.type;
    if (message.sender_id === currentUserId || message.isFromCurrentUser) {
      return conversation?.conversationRole || "user";
    }
    return conversation?.conversationRole === "user" ? "contractor" : "user";
  };

  const handleDeleteMessage = (messageId: string) => {
    Alert.alert("Delete Message", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setDisplayedMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, deleted: true, text: "Message was deleted" }
                : msg
            )
          );
        },
      },
    ]);
  };
```

Features:
- **Auto-scroll to latest message**.
- **Role-aware styling** (user vs contractor).
- **Soft delete** with UI-only state for now (backend delete endpoint is defined but not yet wired).

---

## 5. Chat API – Connection to Next.js

All chat data is loaded through `api/chatapi.tsx`. It reuses the **authenticated axios instance** from `api/authapi.tsx`, which:
- Adds `Authorization: Bearer <access-token>` to every request.
- Automatically refreshes tokens on `401` using `/api/mobile/auth/refresh`.

### 5.1 API Client Setup (`api/chatapi.tsx`)

```ts
// api/chatapi.tsx
import { User } from "./types";
import { api } from "./authapi"; // axios instance with JWT interceptors

const API_URL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:3000";
```

### 5.2 Core Types

```ts
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
  User?: { id: string; name: string | null; email: string | null };
  sender?: { id: string; name: string; type: "user" | "contractor" };
  receiver?: { id: string; name: string; type: "user" | "contractor" };
  isFromCurrentUser?: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  contractorId: number;
  startedAt: string;
  subject: string | null;
  Chat: ChatMessage[];
  Contractor: { id: number; name: string; city: string; specializations: string[]; rating: number; imageUrl?: string | null };
  User: { id: string; name: string | null; email: string | null };
}
```

### 5.3 API Methods → Next.js Endpoints

All methods assume the Next.js backend provides these endpoints (documented in `NEXTJS_COMPLETE_IMPLEMENTATION.md`).

```ts
class ChatService {
  // Session check
  async testAuthentication() {
    const response = await api.get("/api/auth/session");
    if (response.data.user) {
      return { isAuthenticated: true, user: response.data.user as User };
    }
    return { isAuthenticated: false };
  }

  // 1) List all conversations
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get("/api/chat/conversations");
    return response.data;
  }

  // 2) Conversations by contractor (for contractor-specific view)
  async getConversationsByContractor(contractorId: number): Promise<Conversation[]> {
    const response = await api.get(
      `/api/chat/conversations/contractor/${contractorId}`
    );
    return response.data;
  }

  // 3) Single conversation with messages
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await api.get(`/api/chat/conversations/${conversationId}`);
    return response.data;
  }

  // 4) Contacts list
  async getContacts(): Promise<Contact[]> {
    const response = await api.get("/api/chat/contacts");
    return response.data;
  }

  // 5) Contacts with conversation metadata (used in UI)
  async getContactsWithConversations(): Promise<Contact[]> {
    const response = await api.get("/api/chat/contacts/with-conversations");
    return response.data;
  }

  // 6) Send message
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    conversationId?: string
  ): Promise<ChatMessage> {
    const response = await api.post("/api/chat/messages", {
      text: content,
      sender_id: senderId,
      receiver_id: receiverId,
      conversationId,
      subject: "New Message",
    });
    return response.data;
  }

  // 7) Create conversation
  async createConversation(
    userId: string,
    contractorId: number,
    subject?: string
  ): Promise<Conversation> {
    const response = await api.post("/api/chat/conversations", {
      userId,
      contractorId,
      subject: subject || "New Conversation",
    });
    return response.data;
  }

  // 8) Mark messages as read
  async markMessagesAsRead(conversationId: string): Promise<void> {
    await api.put(`/api/chat/conversations/${conversationId}/read`, {});
  }

  // 9) Delete message
  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/api/chat/messages/${messageId}`);
  }

  // 10) Unread count
  async getUnreadCount(): Promise<number> {
    const response = await api.get("/api/chat/unread-count");
    return response.data.count;
  }

  // 11) Search conversations
  async searchConversations(query: string): Promise<Conversation[]> {
    const response = await api.get(
      `/api/chat/conversations/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  // 12) Get current conversation by contractor
  async getConversationByContractor(
    contractorId: number
  ): Promise<Conversation | null> {
    const response = await api.get(
      `/api/chat/conversations/contractor/${contractorId}/current`
    );
    return response.data;
  }
}
```

Exported helpers used by the UI:

```ts
const chatService = new ChatService();

export const getConversations = async (contactId?: string) => {
  if (contactId) {
    const contractorId = parseInt(contactId);
    if (isNaN(contractorId)) throw new Error("Invalid contractor ID");
    return await chatService.getConversationsByContractor(contractorId);
  }
  return await chatService.getConversations();
};

export const getConversation = async (conversationId: string) =>
  await chatService.getConversation(conversationId);

export const getContactsWithConversations = async () =>
  await chatService.getContactsWithConversations();

export const sendMessage = async (senderId: string, receiverId: string, content: string) =>
  await chatService.sendMessage(senderId, receiverId, content);
```

---

## 6. Next.js API Expectations

The Expo chat currently expects these **Next.js API routes** (documented in `NEXTJS_COMPLETE_IMPLEMENTATION.md`):

- `/api/auth/session` – returns `{ user }` for the current JWT.
- `/api/chat/conversations` – list/create conversations.
- `/api/chat/conversations/[id]` – get a single conversation.
- `/api/chat/conversations/[id]/read` – mark messages as read.
- `/api/chat/conversations/search` – search conversations.
- `/api/chat/conversations/contractor/[id]` – list conversations for contractor.
- `/api/chat/conversations/contractor/[id]/current` – most recent conversation.
- `/api/chat/messages` – send messages.
- `/api/chat/messages/[id]` – delete message.
- `/api/chat/contacts` – contacts list.
- `/api/chat/contacts/with-conversations` – contacts + latest message + unread.
- `/api/chat/unread-count` – unread messages count for badge.

These routes are fully defined on the Next.js side in `NEXTJS_COMPLETE_IMPLEMENTATION.md`, but must still be implemented in the web project.

---

## 7. Summary of Current Chat Features

**Implemented in Expo app:**
- Auth-protected chat area (`/(auth)/chat`).
- Contacts list with:
  - Names / types (User vs Contractor).
  - Unread badges.
  - Search bar & filtering.
- Conversations list per contact:
  - Last message preview.
  - Partner name & type.
  - Unread count per conversation.
- Messages view:
  - Role-based styling (user vs contractor).
  - Soft delete (UI only).
  - Auto-scroll to latest message.
- Navigation flow:
  - `/chat` → contacts.
  - `/chat/[contactId]` → conversations with that contact.
  - `/chat/[contactId]/[conversationId]` → messages.

**Integration with Next.js:**
- Uses JWT tokens from `authapi.tsx` for all chat calls.
- All chat endpoints are under `/api/chat/*` on the Next.js backend.
- Session check via `/api/auth/session`.

Once the corresponding Next.js routes are implemented, this chat UI will be fully functional end‑to‑end.

