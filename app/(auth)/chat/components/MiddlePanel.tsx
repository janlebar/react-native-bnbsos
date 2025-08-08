import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");
const isMobile = width < 768;

interface MiddlePanelProps {
  conversations: any[];
  currentUserId: string;
  selectedContactId: string | null;
  selectedConversationId: string | null;
  isMobile?: boolean;
}

export default function MiddlePanel({
  conversations,
  currentUserId,
  selectedContactId,
  selectedConversationId,
}: MiddlePanelProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectConversation = (conversationId: string) => {
    if (selectedContactId) {
      router.push(`/chat/${selectedContactId}/${conversationId}`);
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conversation) => {
    const contactName =
      conversation.Contractor?.name || conversation.User?.name || "";
    const lastMessageText = conversation.Chat?.[0]?.text || "";
    const subject = conversation.subject || "";
    const query = searchQuery.toLowerCase();

    return (
      contactName.toLowerCase().includes(query) ||
      lastMessageText.toLowerCase().includes(query) ||
      subject.toLowerCase().includes(query)
    );
  });

  const renderConversationItem = ({ item }: { item: any }) => {
    const contactName = item.Contractor?.name || item.User?.name || "Unknown";
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
        ]}
        onPress={() => handleSelectConversation(item.id)}
      >
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {contactName}
            </Text>
            {lastMessage && (
              <Text style={styles.conversationTime}>
                {formatTime(lastMessage.date)}
              </Text>
            )}
          </View>
          {lastMessage && (
            <Text style={styles.conversationPreview} numberOfLines={1}>
              {lastMessage.text}
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

      if (diffInMinutes < 1) {
        return "now";
      } else if (diffInMinutes < 60) {
        return `${Math.floor(diffInMinutes)} min`;
      } else if (diffInMinutes < 1440) {
        return `${Math.floor(diffInMinutes / 60)}h`;
      } else {
        return `${Math.floor(diffInMinutes / 1440)}d`;
      }
    } catch (error) {
      return "";
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={16}
          color="#64748b"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#64748b"
        />
      </View>

      {/* Conversations List */}
      <View style={styles.conversationsContainer}>
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try a different search term"
                : "Start a conversation to see messages here"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.conversationsList}
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
  containerMobile: {
    height: "100%",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 4,
  },
  tabsContainerMobile: {
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  tabMobile: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activeTab: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  tabTextMobile: {
    fontSize: 13,
  },
  activeTabText: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchContainerMobile: {
    marginHorizontal: 12,
    marginVertical: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  searchInputMobile: {
    fontSize: 14,
  },
  clearButton: {
    padding: 4,
  },
  conversationsList: {
    flex: 1,
  },
  conversationsContainer: {
    flex: 1,
  },
  conversationsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  conversationsListContentMobile: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  conversationItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  conversationItemMobile: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  selectedConversation: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  conversationContent: {
    flex: 1,
    marginRight: 8,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  conversationSubject: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  conversationSubjectMobile: {
    fontSize: 14,
  },
  conversationTime: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  conversationTimeMobile: {
    fontSize: 11,
  },
  conversationPreview: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 4,
  },
  lastMessageMobile: {
    fontSize: 12,
    lineHeight: 16,
  },
  unreadIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3b82f6",
    marginRight: 6,
  },
  unreadDotMobile: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  unreadText: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "500",
  },
  unreadTextMobile: {
    fontSize: 11,
  },
  conversationStatus: {
    alignItems: "center",
  },
  unreadBadge: {
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  unreadBadgeMobile: {
    minWidth: 18,
    height: 18,
    marginBottom: 3,
  },
  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  unreadBadgeTextMobile: {
    fontSize: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyStateMobile: {
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 16,
    textAlign: "center",
  },
  emptyTextMobile: {
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 8,
    textAlign: "center",
  },
  emptySubtextMobile: {
    fontSize: 12,
    marginTop: 6,
  },
});
