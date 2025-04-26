// ChatComponent.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Chat, ChatMessage, ChatGroup } from "../types"; // Correct for named exports

import ChatDisplay from "./chatDisplay";

import ChatList from "./chatList"; // Import ChatList here

interface ChatProps {
  senderName?: string | null;
  receiverName?: string | null;
  currentsenderId?: string;
  receiverId?: string;
  initialMessages: any[];
  accounts: any[];
  chats: ChatMessage[];
  defaultLayout?: number[];
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

const ChatComponent = ({
  senderName,
  receiverName,
  currentsenderId,
  chats,
}: ChatProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  const groupedChats: ChatGroup[] = Object.values(
    chats.reduce<Record<string, ChatGroup>>((acc, msg) => {
      const isSentToMe = msg.receiverId === currentsenderId;
      const groupId = isSentToMe ? msg.senderId : msg.receiverId;
      const groupName = isSentToMe ? msg.senderName : msg.receiverName;

      if (!acc[groupId]) {
        acc[groupId] = {
          receiverId: groupId,
          receiverName: groupName,
          chats: [],
          lastMessage: msg,
          unreadCount: 0,
        };
      }

      acc[groupId].chats.push(msg);

      if (
        new Date(msg.date).getTime() >
        new Date(acc[groupId].lastMessage.date).getTime()
      ) {
        acc[groupId].lastMessage = msg;
      }

      if (!msg.read && isSentToMe) {
        acc[groupId].unreadCount += 1;
      }

      return acc;
    }, {})
  );

  const selectedChat = groupedChats.find(
    (chat) => chat.lastMessage.id === selectedChatId
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
      <ChatList
        chats={groupedChats}
        searchQuery={searchQuery}
        onSelectChat={(chatId) => setSelectedChatId(chatId)}
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

export default ChatComponent;

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
  chatDisplayContainer: {
    marginTop: 16,
    flex: 1,
  },
});
