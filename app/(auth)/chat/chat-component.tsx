// ChatComponent.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Chat, ChatGroup } from "../types";
import { ChatDisplay } from "./chatDisplay";

interface ChatProps {
  senderName?: string | null;
  receiverName?: string | null;
  currentsenderId?: string;
  receiverId?: string;
  initialMessages: any[];
  accounts: any[];
  chats: Chat[];
  defaultLayout?: number[];
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export const ChatComponent = ({
  senderName,
  receiverName,
  currentsenderId,
  chats,
}: ChatProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const groupedChats: ChatGroup[] = Object.values(
    chats.reduce<Record<string, ChatGroup>>((acc, msg) => {
      const isSent = msg.receiverId === currentsenderId;
      const groupId = isSent ? msg.senderId : msg.receiverId;
      const groupName = isSent ? msg.senderName : msg.receiverName;

      if (!acc[groupId]) {
        acc[groupId] = {
          receiverId: groupId,
          receiverName: groupName,
          chats: [],
          lastMessage: null,
          unreadCount: 0,
        };
      }

      acc[groupId].chats.push(msg);
      acc[groupId].lastMessage = msg;
      if (!msg.read) acc[groupId].unreadCount += 1;

      return acc;
    }, {})
  );

  const filteredChats = groupedChats.filter((group) =>
    group.receiverName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedChat = groupedChats.find(
    (chat) => chat.lastMessage?.id === selectedChatId
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Inbox</Text>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={16}
          color="gray"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.receiverId}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              setSelectedChatId(item.lastMessage?.id.toString() || "")
            }
            style={styles.chatItem}
          >
            <Text style={styles.chatName}>{item.receiverName}</Text>
            <Text numberOfLines={1} style={styles.lastMessage}>
              {item.lastMessage?.chat}
            </Text>
            {item.unreadCount > 0 && (
              <Text style={styles.unreadBadge}>{item.unreadCount}</Text>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Chat Display */}
      {selectedChat && (
        <View style={styles.chatDisplayContainer}>
          <ChatDisplay currentsenderId={currentsenderId} chat={selectedChat} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  chatItem: {
    paddingVertical: 12,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  chatName: {
    fontWeight: "600",
  },
  lastMessage: {
    color: "#666",
    marginTop: 2,
  },
  unreadBadge: {
    color: "#fff",
    backgroundColor: "#f44",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  chatDisplayContainer: {
    marginTop: 16,
    flex: 1,
  },
});
