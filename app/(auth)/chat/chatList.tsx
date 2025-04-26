// ChatList.tsx
import React from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import { ChatGroup } from "../types";

interface ChatListProps {
  chats: ChatGroup[];
  onSelectChat: (chatId: number) => void;
  searchQuery: string;
}

const ChatList = ({ chats, onSelectChat, searchQuery }: ChatListProps) => {
  const filteredChats = chats.filter((group) =>
    group.receiverName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <FlatList
      data={filteredChats}
      keyExtractor={(item) => item.receiverId}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onSelectChat(item.lastMessage.id)}
          style={styles.chatItem}
        >
          <Text style={styles.chatName}>{item.receiverName}</Text>
          <Text numberOfLines={1} style={styles.lastMessage}>
            {item.lastMessage?.text}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );
};

export default ChatList;

const styles = StyleSheet.create({
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
    backgroundColor: "#f44",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
  },
});
