import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");
const isMobile = width < 768;

interface LeftPanelProps {
  contacts: any[];
  currentUserId: string;
  selectedContactId: string | null;
  isMobile?: boolean;
}

export default function LeftPanel({
  contacts,
  currentUserId,
  selectedContactId,
  isMobile: propIsMobile = false,
}: LeftPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const mobile = propIsMobile || isMobile;

  const handleSelectContact = (contactId: string) => {
    router.push(`/chat/${contactId}`);
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContactAvatar = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.avatarContainer,
        selectedContactId === item.id && styles.selectedAvatarContainer,
        mobile && styles.avatarContainerMobile,
      ]}
      onPress={() => handleSelectContact(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, mobile && styles.avatarMobile]}>
        <Text style={[styles.avatarText, mobile && styles.avatarTextMobile]}>
          {item.name?.charAt(0).toUpperCase() ||
            item.email?.charAt(0).toUpperCase() ||
            "U"}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={[styles.unreadBadge, mobile && styles.unreadBadgeMobile]}>
          <Text style={[styles.unreadText, mobile && styles.unreadTextMobile]}>
            {item.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderContactItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.contactItem,
        selectedContactId === item.id && styles.selectedContact,
        mobile && styles.contactItemMobile,
      ]}
      onPress={() => handleSelectContact(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.contactRow}>
        {/* Avatar */}
        <View
          style={[styles.contactAvatar, mobile && styles.contactAvatarMobile]}
        >
          <Text
            style={[
              styles.contactAvatarText,
              mobile && styles.contactAvatarTextMobile,
            ]}
          >
            {item.name?.charAt(0).toUpperCase() ||
              item.email?.charAt(0).toUpperCase() ||
              "U"}
          </Text>
        </View>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Text
            style={[styles.contactName, mobile && styles.contactNameMobile]}
            numberOfLines={1}
          >
            {item.name || item.email}
          </Text>
          {item.lastMessageTime && (
            <Text
              style={[styles.lastMessage, mobile && styles.lastMessageMobile]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
          )}
        </View>

        {/* Time and Status */}
        <View style={styles.contactStatus}>
          {item.lastMessageTime && (
            <Text
              style={[styles.messageTime, mobile && styles.messageTimeMobile]}
            >
              {formatTime(item.lastMessageTime)}
            </Text>
          )}
          {item.unreadCount > 0 && (
            <View
              style={[
                styles.unreadIndicator,
                mobile && styles.unreadIndicatorMobile,
              ]}
            >
              <Text
                style={[
                  styles.unreadIndicatorText,
                  mobile && styles.unreadIndicatorTextMobile,
                ]}
              >
                {item.unreadCount}
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
    <View style={[styles.container, mobile && styles.containerMobile]}>
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
          placeholder="Search contacts..."
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

      {/* Conversations Carousel */}
      <View
        style={[styles.carouselSection, mobile && styles.carouselSectionMobile]}
      >
        <Text
          style={[styles.sectionTitle, mobile && styles.sectionTitleMobile]}
        >
          Conversations
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.carouselContent,
            mobile && styles.carouselContentMobile,
          ]}
        >
          {filteredContacts.map((contact) => (
            <View key={contact.id} style={styles.avatarWrapper}>
              {renderContactAvatar({ item: contact })}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Contacts List */}
      <View
        style={[styles.contactsSection, mobile && styles.contactsSectionMobile]}
      >
        <Text
          style={[styles.sectionTitle, mobile && styles.sectionTitleMobile]}
        >
          Contacts
        </Text>
        <FlatList
          data={filteredContacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id}
          style={styles.contactsList}
          contentContainerStyle={[
            styles.contactsListContent,
            mobile && styles.contactsListContentMobile,
          ]}
          showsVerticalScrollIndicator={false}
        />

        {/* Empty State */}
        {filteredContacts.length === 0 && (
          <View style={[styles.emptyState, mobile && styles.emptyStateMobile]}>
            <Ionicons
              name="people-outline"
              size={mobile ? 48 : 64}
              color="#cbd5e1"
            />
            <Text style={[styles.emptyText, mobile && styles.emptyTextMobile]}>
              {searchQuery ? "No contacts found" : "No contacts yet"}
            </Text>
            {!searchQuery && (
              <Text
                style={[
                  styles.emptySubtext,
                  mobile && styles.emptySubtextMobile,
                ]}
              >
                Start a conversation to see contacts here
              </Text>
            )}
          </View>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchContainerMobile: {
    marginHorizontal: 12,
    marginVertical: 8,
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
  carouselSection: {
    marginBottom: 20,
  },
  carouselSectionMobile: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitleMobile: {
    fontSize: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  carouselContent: {
    paddingHorizontal: 16,
  },
  carouselContentMobile: {
    paddingHorizontal: 12,
  },
  avatarWrapper: {
    marginRight: 16,
  },
  avatarContainer: {
    alignItems: "center",
    position: "relative",
  },
  avatarContainerMobile: {
    marginRight: 12,
  },
  selectedAvatarContainer: {
    // Add selection indicator if needed
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  avatarMobile: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
  avatarTextMobile: {
    fontSize: 18,
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeMobile: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
  },
  unreadText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  unreadTextMobile: {
    fontSize: 10,
  },
  contactsSection: {
    flex: 1,
  },
  contactsSectionMobile: {
    flex: 1,
  },
  contactsList: {
    flex: 1,
  },
  contactsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  contactsListContentMobile: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  contactItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  contactItemMobile: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  selectedContact: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactAvatarMobile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  contactAvatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  contactAvatarTextMobile: {
    fontSize: 16,
  },
  contactInfo: {
    flex: 1,
    marginRight: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  contactNameMobile: {
    fontSize: 14,
  },
  lastMessage: {
    fontSize: 14,
    color: "#64748b",
  },
  lastMessageMobile: {
    fontSize: 12,
  },
  contactStatus: {
    alignItems: "flex-end",
  },
  messageTime: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },
  messageTimeMobile: {
    fontSize: 11,
    marginBottom: 2,
  },
  unreadIndicator: {
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadIndicatorMobile: {
    minWidth: 18,
    height: 18,
  },
  unreadIndicatorText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  unreadIndicatorTextMobile: {
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
