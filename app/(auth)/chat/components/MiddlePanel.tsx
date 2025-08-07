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

export default function MiddlePanel({
  conversations,
  currentUserId,
  selectedContactId,
  selectedConversationId,
  isMobile: propIsMobile = false,
}: MiddlePanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const router = useRouter();
  const mobile = propIsMobile || isMobile;

  const handleSelectConversation = (conversationId: string) => {
    if (selectedContactId) {
      router.push(`/chat/${selectedContactId}/${conversationId}`);
    }
  };

  // Filter conversations based on search and tab
  const filteredConversations = conversations.filter((conversation) => {
    // Text search filter
    const searchMatch =
      conversation.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage?.text
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      false;

    // Tab filter
    if (activeTab === "unread") {
      const hasUnread = conversation.unreadCount > 0;
      return searchQuery ? searchMatch && hasUnread : hasUnread;
    }

    return searchQuery ? searchMatch : true;
  });

  const renderConversation = ({ item }: { item: any }) => {
    const isSelected = selectedConversationId === item.id;
    const lastMessage = item.lastMessage;
    const unreadCount = item.unreadCount || 0;

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          isSelected && styles.selectedConversation,
          mobile && styles.conversationItemMobile,
        ]}
        onPress={() => handleSelectConversation(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.conversationContent}>
          {/* Conversation Header */}
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.conversationSubject,
                mobile && styles.conversationSubjectMobile,
              ]}
              numberOfLines={1}
            >
              {item.subject || "Untitled Conversation"}
            </Text>
            {lastMessage && (
              <Text
                style={[
                  styles.conversationTime,
                  mobile && styles.conversationTimeMobile,
                ]}
              >
                {formatTime(lastMessage.date)}
              </Text>
            )}
          </View>

          {/* Last Message */}
          {lastMessage && (
            <Text
              style={[styles.lastMessage, mobile && styles.lastMessageMobile]}
              numberOfLines={2}
            >
              {lastMessage.text}
            </Text>
          )}

          {/* Unread indicator */}
          {unreadCount > 0 && (
            <View style={styles.unreadIndicator}>
              <View
                style={[styles.unreadDot, mobile && styles.unreadDotMobile]}
              />
              <Text
                style={[styles.unreadText, mobile && styles.unreadTextMobile]}
              >
                {unreadCount} unread
              </Text>
            </View>
          )}
        </View>

        {/* Status indicators */}
        <View style={styles.conversationStatus}>
          {unreadCount > 0 && (
            <View
              style={[styles.unreadBadge, mobile && styles.unreadBadgeMobile]}
            >
              <Text
                style={[
                  styles.unreadBadgeText,
                  mobile && styles.unreadBadgeTextMobile,
                ]}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
          <Ionicons
            name="chevron-forward"
            size={mobile ? 16 : 20}
            color="#cbd5e1"
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, mobile && styles.containerMobile]}>
      {/* Tabs */}
      <View
        style={[styles.tabsContainer, mobile && styles.tabsContainerMobile]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "all" && styles.activeTab,
            mobile && styles.tabMobile,
          ]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.activeTabText,
              mobile && styles.tabTextMobile,
            ]}
          >
            All Chat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "unread" && styles.activeTab,
            mobile && styles.tabMobile,
          ]}
          onPress={() => setActiveTab("unread")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "unread" && styles.activeTabText,
              mobile && styles.tabTextMobile,
            ]}
          >
            Unread
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View
        style={[styles.searchContainer, mobile && styles.searchContainerMobile]}
      >
        <Ionicons
          name="search"
          size={mobile ? 16 : 20}
          color="#64748b"
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, mobile && styles.searchInputMobile]}
          placeholder="Search conversations..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={mobile ? 16 : 20}
              color="#64748b"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        style={styles.conversationsList}
        contentContainerStyle={[
          styles.conversationsListContent,
          mobile && styles.conversationsListContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Empty State */}
      {filteredConversations.length === 0 && (
        <View style={[styles.emptyState, mobile && styles.emptyStateMobile]}>
          <Ionicons
            name="chatbubbles-outline"
            size={mobile ? 48 : 64}
            color="#cbd5e1"
          />
          <Text style={[styles.emptyText, mobile && styles.emptyTextMobile]}>
            {searchQuery ? "No conversations found" : "No conversations yet"}
          </Text>
          {!searchQuery && (
            <Text
              style={[styles.emptySubtext, mobile && styles.emptySubtextMobile]}
            >
              Start a conversation to see it here
            </Text>
          )}
        </View>
      )}
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
