import React, { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ChatLayout from "../components/ChatLayout";
import {
  getContactsWithConversations,
  getConversations,
  getConversation,
} from "../../../../api/chatapi";

const { width } = Dimensions.get("window");
const isMobile = width < 768;

export default function ConversationChatPage() {
  const params = useLocalSearchParams();
  const [contacts, setContacts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedContactId = params.contactId as string;
  const selectedConversationId = params.conversationId as string;

  // Mock current user data
  const currentUserId = "currentUser";
  const currentUserName = "You";

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

      // Load conversations for the selected contact
      if (selectedContactId) {
        const conversationsData = await getConversations(selectedContactId);
        setConversations(conversationsData);
      }

      // Load the specific conversation
      if (selectedConversationId) {
        const conversationData = await getConversation(selectedConversationId);
        setConversation(conversationData);
      }
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
