import React, { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ChatLayout from "./components/ChatLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import {
  getContactsWithConversations,
  getConversations,
  getConversation,
} from "../../../api/chatapi";
import { useAuth } from "../../../lib/auth-context";

const { width } = Dimensions.get("window");
const isMobile = width < 768;

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

  // Use authenticated user data
  const currentUserId = user?.id || "currentUser";
  const currentUserName = user?.name || "You";

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedContactId) {
      loadConversations(selectedContactId);
    }
  }, [selectedContactId]);

  useEffect(() => {
    if (selectedConversationId) {
      loadConversation(selectedConversationId);
    }
  }, [selectedConversationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load contacts with their conversation data
      const contactsData = await getContactsWithConversations();
      setContacts(contactsData);

      // Load all conversations
      const conversationsData = await getConversations();
      setConversations(conversationsData);
    } catch (err) {
      console.error("Error loading chat data:", err);
      setError("Failed to load chat data");
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async (contactId: string) => {
    try {
      const conversationsData = await getConversations(contactId);
      setConversations(conversationsData);
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const conversationData = await getConversation(conversationId);
      setConversation(conversationData);
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* You can add a loading spinner here */}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {/* You can add an error message here */}
      </View>
    );
  }

  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
