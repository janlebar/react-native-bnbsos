import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedContactId = params.contactId as string | undefined;
  const selectedConversationId = params.conversationId as string | undefined;

  // Optional params when coming from contractor detail \"Send Message\" button
  const initialReceiverId = params.receiverId as string | undefined;
  const initialReceiverName = params.receiverName as string | undefined;
  const contractorIdParam = params.contractorId as string | undefined;
  const contractorId = contractorIdParam
    ? parseInt(contractorIdParam, 10)
    : undefined;

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

  // Optional: if we arrived with a contractorId but no conversationId yet,
  // try to find an existing conversation for this contractor and jump into it.
  useEffect(() => {
    if (!contractorId || selectedConversationId) return;
    if (!conversations.length) return;

    const existing = conversations.find(
      (c: any) => c.contractorId === contractorId
    );

    if (!existing) return;

    // Derive a contactId for this contractor; fall back to contractorId string.
    const contactForContractor = contacts.find(
      (c: any) =>
        c.isContractor &&
        (c.contractor?.id === contractorId ||
          c.id === String(contractorId))
    );

    const contactId =
      contactForContractor?.id ?? String(contractorId);

    router.replace(`/chat/${contactId}/${existing.id}`);
  }, [contractorId, selectedConversationId, conversations, contacts, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading chat data...");
      console.log("User:", user);

      // Load contacts with their conversation data
      const contactsData = await getContactsWithConversations();
      console.log("Contacts loaded:", contactsData);
      setContacts(contactsData);

      // Load all conversations
      const conversationsData = await getConversations();
      console.log("Conversations loaded:", conversationsData);
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

  // Show loading while data is loading
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading chat data...</Text>
      </View>
    );
  }

  // Show error message
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.debugText}>
          User: {user ? "Authenticated" : "Not authenticated"}
        </Text>
        <Text style={styles.debugText}>Contacts: {contacts.length}</Text>
        <Text style={styles.debugText}>
          Conversations: {conversations.length}
        </Text>
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
        initialReceiverId={initialReceiverId}
        initialReceiverName={initialReceiverName}
        initialContractorId={contractorId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  errorText: {
    fontSize: 18,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 16,
  },
  debugText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
});
