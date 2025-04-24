import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./Avatar";
import MessageInput from "./MessageInput";
import { ChatGroup } from "../types";

interface ChatDisplayProps {
  chat: ChatGroup | null;
  currentsenderId?: string;
}

export const ChatDisplay = ({ chat, currentsenderId }: ChatDisplayProps) => {
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(
    null
  );

  const markDisplayedMessageAsRead = async () => {
    // Fake marking message as read
    console.log("Marking message as read");
  };

  useEffect(() => {
    if (chat) markDisplayedMessageAsRead();
  }, [chat]);

  const handleSelectMessage = (messageId: number) => {
    setSelectedMessageId(messageId);
  };

  if (!chat) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>No message selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.messagesContainer}>
        {chat.chats.map((message) => (
          <TouchableOpacity
            key={message.id}
            onPress={() => handleSelectMessage(message.id)}
            style={[
              styles.message,
              selectedMessageId === message.id && styles.selectedMessage,
            ]}
          >
            <View style={styles.messageHeader}>
              <Text style={styles.sender}>
                {message.sender?.name || "Unknown"}
              </Text>
              <Text style={styles.timestamp}>
                {formatDistanceToNow(new Date(message.date), {
                  addSuffix: true,
                })}
              </Text>
            </View>
            <Text style={styles.messageText}>{message.text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <MessageInput
        receiverId={chat.receiverId}
        receiverName={chat.receiverName}
        currentsenderId={currentsenderId}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesContainer: { padding: 10 },
  message: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  selectedMessage: {
    backgroundColor: "#fdd",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sender: { fontWeight: "bold" },
  timestamp: { fontSize: 10, color: "gray" },
  messageText: { marginTop: 5 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: "gray", fontSize: 16 },
});
