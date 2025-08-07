import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import LeftPanel from "./LeftPanel";
import MiddlePanel from "./MiddlePanel";
import RightPanel from "./RightPanel";

const { width } = Dimensions.get("window");

interface ChatLayoutProps {
  currentUserId: string;
  currentUserName: string | null;
  contacts: any[];
  conversations: any[];
  messages: any[];
  selectedContactId: string | null;
  selectedConversationId: string | null;
  conversation?: any;
  isMobile?: boolean;
}

export default function ChatLayout({
  currentUserId,
  currentUserName,
  contacts,
  conversations,
  messages,
  selectedContactId,
  selectedConversationId,
  conversation,
  isMobile = true,
}: ChatLayoutProps) {
  const router = useRouter();
  const params = useLocalSearchParams();

  // For mobile, we show different panels based on navigation state
  const showingContactsPanel = !selectedContactId;
  const showingConversationsPanel =
    selectedContactId && !selectedConversationId;
  const showingMessagesPanel = selectedContactId && selectedConversationId;

  // Mobile layout with conditional panel rendering
  if (isMobile) {
    return (
      <View style={styles.container}>
        {/* Mobile Header with Back Navigation */}
        {(selectedContactId || selectedConversationId) && (
          <View style={styles.mobileHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (selectedConversationId) {
                  // Go back to conversations
                  router.push(`/chat/${selectedContactId}`);
                } else if (selectedContactId) {
                  // Go back to contacts
                  router.push("/chat");
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {selectedConversationId
                ? "Messages"
                : selectedContactId
                ? "Conversations"
                : "Contacts"}
            </Text>
          </View>
        )}

        {/* Mobile Content Area */}
        <View style={styles.contentArea}>
          {showingContactsPanel ? (
            // Show Contacts Panel
            <LeftPanel
              contacts={contacts}
              currentUserId={currentUserId}
              selectedContactId={selectedContactId}
              isMobile={true}
            />
          ) : showingConversationsPanel ? (
            // Show Conversations Panel
            <MiddlePanel
              conversations={conversations}
              currentUserId={currentUserId}
              selectedContactId={selectedContactId}
              selectedConversationId={selectedConversationId}
              isMobile={true}
            />
          ) : showingMessagesPanel ? (
            // Show Messages Panel
            <RightPanel
              messages={messages}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              selectedConversationId={selectedConversationId}
              selectedContactId={selectedContactId}
              conversation={conversation}
              isMobile={true}
            />
          ) : null}
        </View>
      </View>
    );
  }

  // Tablet/Desktop layout (side by side panels)
  return (
    <View style={styles.container}>
      <View style={styles.desktopLayout}>
        {/* Left Panel - Contacts */}
        <View style={styles.leftPanel}>
          <LeftPanel
            contacts={contacts}
            currentUserId={currentUserId}
            selectedContactId={selectedContactId}
            isMobile={false}
          />
        </View>

        {/* Middle Panel - Conversations */}
        <View style={styles.middlePanel}>
          <MiddlePanel
            conversations={conversations}
            currentUserId={currentUserId}
            selectedContactId={selectedContactId}
            selectedConversationId={selectedConversationId}
            isMobile={false}
          />
        </View>

        {/* Right Panel - Messages */}
        <View style={styles.rightPanel}>
          <RightPanel
            messages={messages}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            selectedConversationId={selectedConversationId}
            selectedContactId={selectedContactId}
            conversation={conversation}
            isMobile={false}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  contentArea: {
    flex: 1,
  },
  desktopLayout: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },
  middlePanel: {
    width: 320,
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },
  rightPanel: {
    flex: 1,
  },
});
