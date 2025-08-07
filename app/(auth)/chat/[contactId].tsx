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
import { AuthManager } from "../../../lib/auth";
import { getMessages } from "../../../api/chatapi";
import ChatLayout from "./components/ChatLayout";
import { User } from "../../../api/types";

const { width } = Dimensions.get("window");
const isMobile = width < 768;

export default function ContactChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { contactId } = useLocalSearchParams<{ contactId: string }>();

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
        const messages = await getMessages(userData.id);

        // Process messages into contacts and conversations (same logic as index.tsx)
        const contactsMap = new Map();
        const conversationsMap = new Map();

        messages.forEach((message) => {
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
          const conversationKey = [userData.id, messageContactId]
            .sort()
            .join("-");

          if (!conversationsMap.has(conversationKey)) {
            conversationsMap.set(conversationKey, {
              id: conversationKey,
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
          const conversation = conversationsMap.get(conversationKey);
          conversation.Chat.push({
            id: message.id,
            text: message.content,
            sender_id: message.senderId,
            User: { name: message.sender?.name },
            date: message.createdAt,
            read: message.read,
            deleted: false,
          });
        });

        // Sort messages in each conversation by date (newest first for preview)
        conversationsMap.forEach((conversation) => {
          conversation.Chat.sort(
            (a: any, b: any) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });

        setContacts(Array.from(contactsMap.values()));
        setConversations(Array.from(conversationsMap.values()));
      } catch (error) {
        console.error("Error fetching chat data:", error);
        setError("Failed to load chat data");
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [contactId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
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
          messages={[]}
          selectedContactId={contactId}
          selectedConversationId={null}
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
