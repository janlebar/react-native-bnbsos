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
import MiddlePanel from "./MiddlePanel";
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
}

type PanelType = "contacts" | "conversations" | "messages";

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
  const [activePanel, setActivePanel] = useState<PanelType>("contacts");
  const { width } = Dimensions.get("window");
  const isMobile = width < 768;

  // Auto-navigate to appropriate panel based on selection
  useEffect(() => {
    if (!isMobile) return;

    if (selectedConversationId) {
      setActivePanel("messages");
    } else if (selectedContactId) {
      setActivePanel("conversations");
    } else {
      setActivePanel("contacts");
    }
  }, [selectedContactId, selectedConversationId, isMobile]);

  const handleSelectContact = (contactId: string) => {
    if (isMobile) {
      setActivePanel("conversations");
    }
    router.push(`/chat/${contactId}`);
  };

  const handleSelectConversation = (
    conversationId: string,
    contactId: string
  ) => {
    if (isMobile) {
      setActivePanel("messages");
    }
    router.push(`/chat/${contactId}/${conversationId}`);
  };

  const handleBack = () => {
    if (activePanel === "messages") {
      setActivePanel("conversations");
      if (selectedContactId) {
        router.push(`/chat/${selectedContactId}`);
      }
    } else if (activePanel === "conversations") {
      setActivePanel("contacts");
      router.push("/chat");
    }
  };

  const getHeaderTitle = () => {
    switch (activePanel) {
      case "contacts":
        return "Contacts";
      case "conversations":
        const contact = contacts.find((c) => c.id === selectedContactId);
        return contact?.name || contact?.email || "Conversations";
      case "messages":
        const conv = conversations.find((c) => c.id === selectedConversationId);
        return conv?.subject || "Messages";
      default:
        return "Chat";
    }
  };

  const renderMobileNavigation = () => (
    <View style={styles.mobileNav}>
      <TouchableOpacity
        style={[
          styles.navButton,
          activePanel === "contacts" && styles.activeNavButton,
        ]}
        onPress={() => setActivePanel("contacts")}
      >
        <Ionicons
          name="people"
          size={20}
          color={activePanel === "contacts" ? "#007AFF" : "#666"}
        />
        <Text
          style={[
            styles.navButtonText,
            activePanel === "contacts" && styles.activeNavButtonText,
          ]}
        >
          Contacts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navButton,
          activePanel === "conversations" && styles.activeNavButton,
        ]}
        onPress={() => setActivePanel("conversations")}
        disabled={!selectedContactId}
      >
        <Ionicons
          name="chatbubbles"
          size={20}
          color={activePanel === "conversations" ? "#007AFF" : "#666"}
        />
        <Text
          style={[
            styles.navButtonText,
            activePanel === "conversations" && styles.activeNavButtonText,
          ]}
        >
          Conversations
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navButton,
          activePanel === "messages" && styles.activeNavButton,
        ]}
        onPress={() => setActivePanel("messages")}
        disabled={!selectedConversationId}
      >
        <Ionicons
          name="chatbubble"
          size={20}
          color={activePanel === "messages" ? "#007AFF" : "#666"}
        />
        <Text
          style={[
            styles.navButtonText,
            activePanel === "messages" && styles.activeNavButtonText,
          ]}
        >
          Messages
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderMobileHeader = () => (
    <View style={styles.mobileHeader}>
      {(activePanel === "conversations" || activePanel === "messages") && (
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
    </View>
  );

  // Desktop layout
  if (!isMobile) {
    return (
      <View style={styles.desktopContainer}>
        <View style={styles.desktopLeftPanel}>
          <LeftPanel
            contacts={contacts}
            conversations={conversations}
            currentUserId={currentUserId}
            selectedContactId={selectedContactId || null}
            selectedConversationId={selectedConversationId || null}
          />
        </View>

        {selectedContactId && (
          <View style={styles.desktopMiddlePanel}>
            <MiddlePanel
              conversations={conversations}
              currentUserId={currentUserId}
              selectedContactId={selectedContactId}
              selectedConversationId={selectedConversationId || null}
            />
          </View>
        )}

        {selectedConversationId && (
          <View style={styles.desktopRightPanel}>
            <RightPanel
              messages={conversation?.Chat || []}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              selectedConversationId={selectedConversationId}
              selectedContactId={selectedContactId || null}
              conversation={conversation}
            />
          </View>
        )}
      </View>
    );
  }

  // Mobile layout
  return (
    <View style={styles.mobileContainer}>
      {renderMobileHeader()}
      {renderMobileNavigation()}

      <View style={styles.mobileContent}>
        {activePanel === "contacts" && (
          <LeftPanel
            contacts={contacts}
            conversations={conversations}
            currentUserId={currentUserId}
            selectedContactId={selectedContactId || null}
            selectedConversationId={selectedConversationId || null}
          />
        )}

        {activePanel === "conversations" && selectedContactId && (
          <MiddlePanel
            conversations={conversations}
            currentUserId={currentUserId}
            selectedContactId={selectedContactId}
            selectedConversationId={selectedConversationId || null}
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

const styles = StyleSheet.create({
  // Desktop styles
  desktopContainer: {
    flex: 1,
    flexDirection: "row",
    height: "100%",
  },
  desktopLeftPanel: {
    width: 250,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  desktopMiddlePanel: {
    width: 300,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  desktopRightPanel: {
    flex: 1,
  },

  // Mobile styles
  mobileContainer: {
    flex: 1,
    height: "100%",
  },
  mobileHeader: {
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
  mobileNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeNavButton: {
    backgroundColor: "#f3f4f6",
  },
  navButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeNavButtonText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  mobileContent: {
    flex: 1,
    height: "100%",
  },
});
