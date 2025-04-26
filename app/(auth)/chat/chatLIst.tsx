import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { formatDistanceToNow } from "date-fns";
import { ChatGroup } from "../types"; // Ensure correct path to types

interface ChatListProps {
  items: ChatGroup[];
}

const ChatList = ({ items }: ChatListProps) => {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.lastMessage?.id.toString()}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const isSelected = selectedChatId === item.lastMessage?.id;

        return (
          <TouchableOpacity
            style={[styles.item, isSelected && styles.selectedItem]}
            onPress={() => setSelectedChatId(item.lastMessage?.id || null)}
          >
            <View style={styles.header}>
              <Text style={styles.name}>{item.receiverName}</Text>
              <Text style={styles.time}>
                {item.lastMessage?.date
                  ? formatDistanceToNow(new Date(item.lastMessage.date), {
                      addSuffix: true,
                    })
                  : ""}
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.subject}>
              {item.lastMessage?.subject || "No Subject"}
            </Text>
            <Text numberOfLines={2} style={styles.preview}>
              {item.lastMessage?.text || "No message content"}
            </Text>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No chats available</Text>
        </View>
      }
    />
  );
};

export default ChatList;

const styles = StyleSheet.create({
  list: {
    padding: 10,
  },
  item: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedItem: {
    backgroundColor: "#d0ebff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  time: {
    fontSize: 12,
    color: "gray",
  },
  subject: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "600",
  },
  preview: {
    fontSize: 12,
    color: "gray",
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "gray",
  },
});
