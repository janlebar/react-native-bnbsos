import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import { Ionicons } from "@expo/vector-icons";

interface ChatLayoutProps {
  contacts: any[];
  conversations: any[];
  currentUserId: string;
  currentUserName: string | null;
  selectedContactId?: string | null;
  selectedConversationId?: string | null;
  conversation?: any;
  initialReceiverId?: string;
  initialReceiverName?: string | null;
  initialContractorId?: number;
}

type PanelType = "contacts" | "messages";

export default function ChatLayout({
  contacts,
  conversations,
  currentUserId,
  currentUserName,
  selectedContactId,
  selectedConversationId,
  conversation,
  initialReceiverId,
  initialReceiverName,
  initialContractorId,
}: ChatLayoutProps) {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<PanelType>("contacts");

  // Auto-navigate to appropriate panel based on selection
  useEffect(() => {
    if (selectedConversationId) {
      // Existing conversation selected → show messages
      setActivePanel("messages");
    } else if (initialReceiverId) {
      // No conversation yet, but we have an initial receiver
      setActivePanel("messages");
    } else {
      setActivePanel("contacts");
    }
  }, [selectedConversationId, initialReceiverId]);

  const handleSelectContact = (contactId: string) => {
    // Stay on contacts panel when selecting a contact
    setActivePanel("contacts");
    router.push(`/chat/${contactId}`);
  };

  const handleSelectConversation = (
    conversationId: string,
    contactId: string
  ) => {
    // Go directly to messages panel when selecting a conversation
    setActivePanel("messages");
    router.push(`/chat/${contactId}/${conversationId}`);
  };

  const handleBack = () => {
    if (activePanel === "messages") {
      setActivePanel("contacts");
      router.push("/chat");
    }
  };

  const getHeaderTitle = () => {
    switch (activePanel) {
      case "contacts":
        return "Contacts";
      case "messages":
        const conv = conversations.find((c) => c.id === selectedConversationId);
        return conv?.subject || "Messages";
      default:
        return "Chat";
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {activePanel === "messages" && (
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

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

        {activePanel === "messages" &&
          (selectedConversationId || initialReceiverId) && (
            <RightPanel
              messages={conversation?.Chat || []}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              selectedConversationId={selectedConversationId || null}
              selectedContactId={selectedContactId || null}
              conversation={conversation}
              onBack={handleBack}
              initialReceiverId={initialReceiverId}
              initialReceiverName={initialReceiverName}
              initialContractorId={initialContractorId}
            />
          )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  content: {
    flex: 1,
    width: "100%",
  },
});
