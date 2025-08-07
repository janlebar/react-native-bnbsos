import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface MiddlePanelProps {
  conversations: any[];
  currentUserId: string;
  selectedContactId: string | null;
  selectedConversationId: string | null;
  isMobile?: boolean;
}

// Format time for display
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export default function MiddlePanel({
  conversations,
  currentUserId,
  selectedContactId,
  selectedConversationId,
  isMobile = false,
}: MiddlePanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSelectConversation = (conversationId: string) => {
    if (selectedContactId) {
      router.push(`/chat/${selectedContactId}/${conversationId}`);
    }
  };

  // Filter conversations based on search and selected contact
  const filteredConversations = conversations.filter((conversation) => {
    // Only show conversations for the selected contact
    if (selectedContactId && conversation.contact_id !== selectedContactId) {
      return false;
    }

    // Apply search filter
    if (searchQuery) {
      const contactName =
        conversation.User?.name || conversation.Contractor?.user?.name || "";
      const lastMessageText = conversation.Chat?.[0]?.text || "";
      const query = searchQuery.toLowerCase();

      return (
        contactName.toLowerCase().includes(query) ||
        lastMessageText.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const renderConversation = ({ item }: { item: any }) => {
    const contactName =
      item.User?.name || item.Contractor?.user?.name || "Unknown";
    const lastMessage = item.Chat?.[0];
    const unreadCount =
      item.Chat?.filter(
        (chat: any) => !chat.read && chat.sender_id !== currentUserId
      ).length || 0;

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          selectedConversationId === item.id && styles.selectedConversation,
          isMobile && styles.conversationItemMobile,
        ]}
        onPress={() => handleSelectConversation(item.id)}
      >
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[styles.contactName, isMobile && styles.contactNameMobile]}
            >
              {contactName}
            </Text>
            {lastMessage && (
              <Text
                style={[styles.timeText, isMobile && styles.timeTextMobile]}
              >
                {formatTime(lastMessage.date)}
              </Text>
            )}
          </View>

          {lastMessage && (
            <Text
              style={[
                styles.lastMessageText,
                isMobile && styles.lastMessageTextMobile,
              ]}
              numberOfLines={2}
            >
              {lastMessage.text}
            </Text>
          )}
        </View>

        {unreadCount > 0 && (
          <View
            style={[styles.unreadBadge, isMobile && styles.unreadBadgeMobile]}
          >
            <Text
              style={[
                styles.unreadBadgeText,
                isMobile && styles.unreadBadgeTextMobile,
              ]}
            >
              {unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      {/* Header with Tabs */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text
              style={[
                styles.tabText,
                styles.activeTabText,
                isMobile && styles.tabTextMobile,
              ]}
            >
              All Chat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={[styles.tabText, isMobile && styles.tabTextMobile]}>
              Unread
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchContainer,
          isMobile && styles.searchContainerMobile,
        ]}
      >
        <Ionicons
          name="search"
          size={isMobile ? 16 : 18}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, isMobile && styles.searchInputMobile]}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isMobile && styles.emptyTextMobile]}>
            {searchQuery
              ? "No conversations found"
              : selectedContactId
              ? "No conversations with this contact yet"
              : "No conversations yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          style={styles.conversationsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerMobile: {
    paddingHorizontal: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerMobile: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  tabTextMobile: {
    fontSize: 12,
  },
  activeTabText: {
    color: "#000",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
  },
  searchContainerMobile: {
    marginHorizontal: 8,
    marginVertical: 12,
    height: 36,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  searchInputMobile: {
    fontSize: 12,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  conversationItemMobile: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  selectedConversation: {
    backgroundColor: "#f0f0f0",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  contactNameMobile: {
    fontSize: 14,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  timeTextMobile: {
    fontSize: 10,
  },
  lastMessageText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  lastMessageTextMobile: {
    fontSize: 12,
    lineHeight: 16,
  },
  unreadBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeMobile: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  unreadBadgeTextMobile: {
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  emptyTextMobile: {
    fontSize: 14,
  },
});
