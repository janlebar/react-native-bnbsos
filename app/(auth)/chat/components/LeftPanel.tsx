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
  isMobile = false,
}: LeftPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSelectContact = (contactId: string) => {
    router.push(`/chat/${contactId}`);
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContact = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.contactItem,
        selectedContactId === item.id && styles.selectedContact,
        isMobile && styles.contactItemMobile,
      ]}
      onPress={() => handleSelectContact(item.id)}
    >
      <View style={styles.contactInfo}>
        {/* Avatar placeholder */}
        <View style={[styles.avatar, isMobile && styles.avatarMobile]}>
          <Text
            style={[styles.avatarText, isMobile && styles.avatarTextMobile]}
          >
            {item.name?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>

        <View style={styles.contactDetails}>
          <Text
            style={[styles.contactName, isMobile && styles.contactNameMobile]}
          >
            {item.name || "Unknown"}
          </Text>
          {item.email && (
            <Text
              style={[
                styles.contactEmail,
                isMobile && styles.contactEmailMobile,
              ]}
            >
              {item.email}
            </Text>
          )}
          {item.unreadCount > 0 && (
            <Text
              style={[styles.unreadText, isMobile && styles.unreadTextMobile]}
            >
              {item.unreadCount} unread
            </Text>
          )}
        </View>
      </View>

      {item.unreadCount > 0 && (
        <View
          style={[styles.unreadBadge, isMobile && styles.unreadBadgeMobile]}
        >
          <Text
            style={[
              styles.unreadBadgeText,
              isMobile && styles.unreadBadgeTextMobile,
            ]}
          >
            {item.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      {/* Header */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <Text style={[styles.title, isMobile && styles.titleMobile]}>
          Contacts
        </Text>
      </View>

      {/* Stats */}
      <View
        style={[styles.statsContainer, isMobile && styles.statsContainerMobile]}
      >
        <Text style={[styles.statsText, isMobile && styles.statsTextMobile]}>
          All Messages ({contacts.length})
        </Text>
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
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isMobile && styles.emptyTextMobile]}>
            {searchQuery ? "No contacts found" : "No contacts yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          style={styles.contactsList}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerMobile: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  titleMobile: {
    fontSize: 18,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsContainerMobile: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 14,
    color: "#666",
  },
  statsTextMobile: {
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
  },
  searchContainerMobile: {
    marginHorizontal: 8,
    marginBottom: 12,
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
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  contactItemMobile: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  selectedContact: {
    backgroundColor: "#f0f0f0",
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarMobile: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  avatarTextMobile: {
    fontSize: 14,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  contactNameMobile: {
    fontSize: 14,
  },
  contactEmail: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  contactEmailMobile: {
    fontSize: 10,
  },
  unreadText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  unreadTextMobile: {
    fontSize: 10,
  },
  unreadBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
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
