import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { formatDistanceToNow } from "date-fns";
import { ChatGroup } from "../types";
import { useChat } from "../hooks/useChat";

interface ChatListProps {
  items: ChatGroup[];
}

export const ChatList = ({ items }: ChatListProps) => {
  const [chat, setChat] = useChat();

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.lastMessage?.id?.toString() || ""}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.item,
            chat.selected === item.lastMessage?.id && styles.selectedItem,
          ]}
          onPress={() => setChat({ ...chat, selected: item.lastMessage?.id })}
        >
          <View style={styles.header}>
            <Text style={styles.name}>{item.receiverName}</Text>
            <Text style={styles.time}>
              {formatDistanceToNow(new Date(item.lastMessage?.date || 0), {
                addSuffix: true,
              })}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.subject}>
            {item.lastMessage?.subject}
          </Text>
          <Text numberOfLines={2} style={styles.preview}>
            {item.lastMessage?.text}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: 10 },
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
  },
  name: { fontWeight: "bold", fontSize: 16 },
  time: { fontSize: 12, color: "gray" },
  subject: { fontSize: 14, marginTop: 4 },
  preview: { fontSize: 12, color: "gray" },
});
