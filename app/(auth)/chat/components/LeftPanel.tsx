import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface LeftPanelProps {
  contacts: any[];
  conversations: any[];
  currentUserId: string;
  selectedContactId: string | null;
  selectedConversationId: string | null;
  onSelectContact: (contactId: string) => void;
  onSelectConversation: (conversationId: string, contactId: string) => void;
}

const { width } = Dimensions.get("window");
const isMobile = width < 768;

export default function LeftPanel({
  contacts,
  conversations,
  currentUserId,
  selectedContactId,
  selectedConversationId,
  onSelectContact,
  onSelectConversation,
}: LeftPanelProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectContact = (contactId: string) => {
    onSelectContact(contactId);
  };

  const handleSelectConversation = (conversationId: string) => {
    if (selectedContactId) {
      onSelectConversation(conversationId, selectedContactId);
    }
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter conversations based on search
  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.Chat?.[conversation.Chat.length - 1]?.text
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const renderContactAvatar = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.avatarContainer,
        selectedContactId === item.id && styles.selectedAvatar,
      ]}
      onPress={() => handleSelectContact(item.id)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0)?.toUpperCase() ||
            item.email?.charAt(0)?.toUpperCase() ||
            "?"}
        </Text>
      </View>
      <Text style={styles.avatarName} numberOfLines={1}>
        {item.name || item.email}
      </Text>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderConversationItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        selectedConversationId === item.id && styles.selectedConversation,
      ]}
      onPress={() => handleSelectConversation(item.id)}
    >
      <View style={styles.conversationRow}>
        {/* Avatar */}
        <View style={styles.conversationAvatar}>
          <Text style={styles.conversationAvatarText}>
            {item.Contractor?.name?.charAt(0)?.toUpperCase() ||
              item.User?.name?.charAt(0)?.toUpperCase() ||
              item.subject?.charAt(0)?.toUpperCase() ||
              "?"}
          </Text>
        </View>

        {/* Conversation Info */}
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {item.Contractor?.name ||
              item.User?.name ||
              item.subject ||
              "Conversation"}
          </Text>
          {item.Chat?.[0] && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.Chat[0].text}
            </Text>
          )}
        </View>

        {/* Time and Status */}
        <View style={styles.conversationStatus}>
          {item.Chat?.[0]?.date && (
            <Text style={styles.messageTime}>
              {formatTime(item.Chat[0].date)}
            </Text>
          )}
          {item.Chat?.some(
            (msg: any) => !msg.read && msg.sender_id !== currentUserId
          ) && (
            <View style={styles.unreadIndicator}>
              <Text style={styles.unreadIndicatorText}>
                {
                  item.Chat?.filter(
                    (msg: any) => !msg.read && msg.sender_id !== currentUserId
                  ).length
                }
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

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
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#64748b"
        />
      </View>

      {/* Contacts Carousel - TOP SECTION */}
      <View style={styles.carouselContainer}>
        <Text style={styles.sectionTitle}>Contacts</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
        >
          {filteredContacts.length === 0 ? (
            <View style={styles.emptyCarousel}>
              <Text style={styles.emptyText}>No contacts yet</Text>
            </View>
          ) : (
            filteredContacts.map((contact) => (
              <View key={contact.id} style={styles.avatarWrapper}>
                {renderContactAvatar({ item: contact })}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Conversations List - BOTTOM SECTION */}
      <View style={styles.conversationsContainer}>
        <Text style={styles.sectionTitle}>Conversations</Text>
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations found</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation to see messages here
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
  },
  carouselContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  carouselContent: {
    paddingHorizontal: 16,
  },
  emptyCarousel: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatarContainer: {
    alignItems: "center",
    width: 60,
  },
  selectedAvatar: {
    opacity: 0.7,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  avatarName: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    maxWidth: 60,
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: 8,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  conversationsContainer: {
    flex: 1,
  },
  conversationsList: {
    paddingHorizontal: 16,
  },
  conversationItem: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  selectedConversation: {
    backgroundColor: "#f0f9ff",
    borderColor: "#3b82f6",
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  conversationAvatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  conversationInfo: {
    flex: 1,
    marginRight: 8,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: "#64748b",
  },
  conversationStatus: {
    alignItems: "flex-end",
  },
  messageTime: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },
  unreadIndicator: {
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadIndicatorText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
});
