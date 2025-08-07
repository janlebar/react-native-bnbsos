import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthManager } from "../../../../lib/auth";
import { getMessages } from "../../../../api/chatapi";
import ChatLayout from "../components/ChatLayout";
import { User } from "../../../../api/types";

const { width } = Dimensions.get("window");
const isMobile = width < 768;

export default function ConversationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { contactId, conversationId } = useLocalSearchParams<{
    contactId: string;
    conversationId: string;
  }>();

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);

        // Get current user
        const userData = await AuthManager.getCurrentUser();
        if (!userData) {
          router.replace("/login");
          return;
        }

        setUser(userData);

        // Load messages and process them into contacts and conversations
        const allMessages = await getMessages(userData.id);

        // Process messages into contacts and conversations (same logic as index.tsx)
        const contactsMap = new Map();
        const conversationsMap = new Map();

        allMessages.forEach((message) => {
          const isFromCurrentUser = message.senderId === userData.id;
          const messageContactId = isFromCurrentUser
            ? message.receiverId
            : message.senderId;
          const contactName = isFromCurrentUser
            ? message.receiver?.name
            : message.sender?.name;

          // Add to contacts if not exists
          if (!contactsMap.has(messageContactId)) {
            contactsMap.set(messageContactId, {
              id: messageContactId,
              name: contactName || "Unknown",
              email: "",
              unreadCount: 0,
            });
          }

          // Update unread count for received messages
          if (!isFromCurrentUser && !message.read) {
            const contact = contactsMap.get(messageContactId);
            contact.unreadCount += 1;
          }

          // Create conversation key
          const convKey = [userData.id, messageContactId].sort().join("-");

          if (!conversationsMap.has(convKey)) {
            conversationsMap.set(convKey, {
              id: convKey,
              contact_id: messageContactId,
              User: isFromCurrentUser
                ? { id: userData.id, name: userData.name }
                : { id: messageContactId, name: contactName },
              Contractor: {
                user: isFromCurrentUser
                  ? { id: messageContactId, name: contactName }
                  : { id: userData.id, name: userData.name },
              },
              Chat: [],
            });
          }

          // Add message to conversation
          const conv = conversationsMap.get(convKey);
          conv.Chat.push({
            id: message.id,
            text: message.content,
            sender_id: message.senderId,
            User: { name: message.sender?.name },
            date: message.createdAt,
            read: message.read,
            deleted: false,
          });
        });

        // Sort messages in each conversation by date (newest first for preview, oldest first for display)
        conversationsMap.forEach((conv) => {
          conv.Chat.sort(
            (a: any, b: any) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });

        setContacts(Array.from(contactsMap.values()));
        setConversations(Array.from(conversationsMap.values()));

        // Find the specific conversation and its messages
        const targetConversation = conversationsMap.get(conversationId);
        if (targetConversation) {
          setConversation(targetConversation);
          // Sort messages for display (oldest first)
          const sortedMessages = [...targetConversation.Chat].sort(
            (a: any, b: any) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          setMessages(sortedMessages);
        } else {
          setError("Conversation not found");
        }
      } catch (error) {
        console.error("Error fetching chat data:", error);
        setError("Failed to load chat data");
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [contactId, conversationId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatContainer}>
        <ChatLayout
          currentUserId={user.id}
          currentUserName={user.name || null}
          contacts={contacts}
          conversations={conversations}
          messages={messages}
          selectedContactId={contactId}
          selectedConversationId={conversationId}
          conversation={conversation}
          isMobile={isMobile}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
  },
  chatContainer: {
    flex: 1,
  },
});
