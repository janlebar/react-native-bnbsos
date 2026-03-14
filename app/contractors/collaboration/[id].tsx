// app/contractors/collaboration/[id].tsx
// Collaboration Detail Screen with Messages

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ContractorRouteGuard } from "../../../components/ContractorRouteGuard";
import {
  getCollaborationMessages,
  sendCollaborationMessage,
  getCollaboration,
} from "../../../api/contractorApi";
import { CollaborationMessage, Collaboration } from "../../../api/types";

export default function CollaborationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [collaboration, setCollaboration] = useState<Collaboration | null>(
    null
  );
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) {
      setError("Invalid collaboration ID");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [collabResult, messagesResult] = await Promise.all([
        getCollaboration(id),
        getCollaborationMessages(id),
      ]);
      setCollaboration(collabResult.collaboration);
      setMessages(messagesResult.messages);
    } catch (err: any) {
      console.error("Error loading collaboration:", err);
      setError(err.message || "Failed to load collaboration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSend = async () => {
    if (!messageText.trim() || sending || !id) return;

    try {
      setSending(true);
      setError(null);
      const result = await sendCollaborationMessage(id, {
        text: messageText.trim(),
      });
      setMessages([...messages, result.message]);
      setMessageText("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <ContractorRouteGuard>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading collaboration...</Text>
        </View>
      </ContractorRouteGuard>
    );
  }

  if (error && !collaboration) {
    return (
      <ContractorRouteGuard>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ContractorRouteGuard>
    );
  }

  return (
    <ContractorRouteGuard>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {collaboration && (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {collaboration.title || "Untitled Collaboration"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {collaboration.participants.length} participant
              {collaboration.participants.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.message}>
              <Text style={styles.senderName}>
                {item.sender.name || "Unknown"}
              </Text>
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.messageTime}>
                {new Date(item.date).toLocaleTimeString()}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Start the conversation by sending a message
              </Text>
            </View>
          }
        />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTextSmall}>{error}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ContractorRouteGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
    padding: 24,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  messagesList: {
    padding: 16,
  },
  message: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  senderName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1f2937",
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
    color: "#374151",
  },
  messageTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  errorContainer: {
    padding: 12,
    backgroundColor: "#fee2e2",
  },
  errorTextSmall: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
