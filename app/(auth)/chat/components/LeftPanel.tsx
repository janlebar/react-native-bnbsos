import React, { useState, useEffect } from "react";
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
  onSelectContact: (contactId: string | null) => void;
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

  // Filter conversations based on selected contact
  const getFilteredConversations = () => {
    if (!selectedContactId) {
      return []; // No conversations shown when no contact is selected
    }

    return conversations.filter((conversation) => {
      // Check if conversation is related to the selected contact
      const isRelatedToContact =
        conversation.Contractor?.id?.toString() === selectedContactId ||
        conversation.User?.id === selectedContactId ||
        conversation.contractorId?.toString() === selectedContactId ||
        conversation.userId === selectedContactId;

      return isRelatedToContact;
    });
  };

  const handleSelectContact = (contactId: string) => {
    console.log("[LeftPanel] Selecting contact:", contactId);
    onSelectContact(contactId);
  };

  const handleClearSelection = () => {
    console.log("[LeftPanel] Clearing contact selection");
    onSelectContact(null);
  };

  const handleSelectConversation = (conversationId: string) => {
    if (selectedContactId) {
      console.log(
        "[LeftPanel] Selecting conversation:",
        conversationId,
        "for contact:",
        selectedContactId
      );
      onSelectConversation(conversationId, selectedContactId);
    }
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get filtered conversations and apply search
  const baseFilteredConversations = getFilteredConversations();
  const filteredConversations = baseFilteredConversations.filter(
    (conversation) =>
      conversation.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.Chat?.[conversation.Chat.length - 1]?.text
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Log filtering for debugging
  useEffect(() => {
    console.log("[LeftPanel] Filtering conversations:");
    console.log("- Selected contact ID:", selectedContactId);
    console.log("- Total conversations:", conversations.length);
    console.log("- Filtered conversations:", baseFilteredConversations.length);
    console.log("- After search filter:", filteredConversations.length);
  }, [selectedContactId, conversations, searchQuery]);

  const getContactName = (contact: any) => {
    if (contact.name) return contact.name;
    if (contact.email) return contact.email;
    if (contact.contractor?.name) return contact.contractor.name;
    return "Unknown Contact";
  };

  const getContactType = (contact: any) => {
    if (contact.isContractor || contact.contractor) return "Contractor";
    return "User";
  };

  const renderContactAvatar = ({ item }: { item: any }) => {
    const contactName = getContactName(item);
    const contactType = getContactType(item);
    const isSelected = selectedContactId === item.id;

    return (
      <TouchableOpacity
        style={[styles.avatarContainer, isSelected && styles.selectedAvatar]}
        onPress={() => handleSelectContact(item.id)}
      >
        <View
          style={[
            styles.avatar,
            contactType === "Contractor"
              ? styles.contractorAvatar
              : styles.userAvatar,
          ]}
        >
          <Text style={styles.avatarText}>
            {contactName.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
        <Text style={styles.avatarName} numberOfLines={1}>
          {contactName}
        </Text>
        <Text style={styles.contactType} numberOfLines={1}>
          {contactType}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderConversationItem = ({ item }: { item: any }) => {
    const isSelected = selectedConversationId === item.id;

    // Determine the conversation partner's name
    const getConversationName = () => {
      if (item.Contractor?.name) return item.Contractor.name;
      if (item.User?.name) return item.User.name;
      if (item.subject) return item.subject;
      return "Conversation";
    };

    const getConversationType = () => {
      if (item.Contractor) return "with Contractor";
      if (item.User) return "with User";
      return "";
    };

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          isSelected && styles.selectedConversation,
        ]}
        onPress={() => handleSelectConversation(item.id)}
      >
        <View style={styles.conversationRow}>
          {/* Avatar */}
          <View
            style={[
              styles.conversationAvatar,
              item.Contractor
                ? styles.contractorConversationAvatar
                : styles.userConversationAvatar,
            ]}
          >
            <Text style={styles.conversationAvatarText}>
              {getConversationName().charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>

          {/* Conversation Info */}
          <View style={styles.conversationInfo}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {getConversationName()}
            </Text>
            <Text style={styles.conversationType} numberOfLines={1}>
              {getConversationType()}
            </Text>
            {item.Chat?.[0] && (
              <Text style={styles.lastMessage} numberOfLines={2}>
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
          placeholder="Search contacts and conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#64748b"
        />
      </View>

      {/* Contacts Carousel - TOP SECTION */}
      <View style={styles.carouselContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contacts</Text>
          {selectedContactId && (
            <TouchableOpacity
              onPress={handleClearSelection}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear Selection</Text>
            </TouchableOpacity>
          )}
        </View>
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
        <Text style={styles.sectionTitle}>
          {selectedContactId
            ? `Conversations with ${
                filteredContacts.find((c) => c.id === selectedContactId)
                  ?.name || "Contact"
              }`
            : "Select a contact to view conversations"}
        </Text>
        {!selectedContactId ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="person-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No contact selected</Text>
            <Text style={styles.emptySubtext}>
              Choose a contact from above to view their conversations
            </Text>
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No conversations found</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation with this contact
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#ef4444",
    borderRadius: 16,
  },
  clearButtonText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "500",
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
    width: 70,
    paddingVertical: 8,
  },
  selectedAvatar: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  contractorAvatar: {
    backgroundColor: "#8b5cf6",
  },
  userAvatar: {
    backgroundColor: "#3b82f6",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  avatarName: {
    fontSize: 12,
    color: "#1f2937",
    textAlign: "center",
    maxWidth: 70,
    fontWeight: "500",
  },
  contactType: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    maxWidth: 70,
  },
  unreadBadge: {
    position: "absolute",
    top: 4,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedConversation: {
    backgroundColor: "#f0f9ff",
    borderColor: "#3b82f6",
    borderWidth: 2,
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contractorConversationAvatar: {
    backgroundColor: "#8b5cf6",
  },
  userConversationAvatar: {
    backgroundColor: "#10b981",
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
  conversationType: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 16,
  },
  conversationStatus: {
    alignItems: "flex-end",
  },
  messageTime: {
    fontSize: 11,
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
    fontSize: 10,
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
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
});
