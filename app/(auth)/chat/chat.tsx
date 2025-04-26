// Chats.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { getCurrentUser } from "../../../api/authapi"; // You may need to replace this with Expo-friendly auth
import { getMessages } from "../../../api/chatapi";
import ChatComponent from "./chat-component";

export default function Chats() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setUser(userData);
          const msgs = await getMessages(userData.id);
          setMessages(msgs);
        }
      } catch (error) {
        console.error("Error fetching user or messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndMessages();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  if (!user) {
    return <Text style={styles.errorText}>Error: User not found</Text>;
  }

  const chats = messages.map((msg) => ({
    id: msg.id.toString(),
    name: msg.sender?.name || "Unknown",
    text: msg.content,
    subject: "Message",
    chat: msg.content,
    date: msg.createdAt,
    read: msg.read ?? false,
    receiverId: msg.receiverId,
    receiverName: msg.receiver?.name,
    senderId: msg.senderId,
    senderName: msg.sender?.name,
  }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Chat</Text>
      <ChatComponent
        senderName={user.name}
        currentsenderId={user.id}
        receiverId={undefined}
        receiverName={undefined}
        initialMessages={[]}
        accounts={[]}
        chats={chats}
        defaultLayout={[265, 440, 655]}
        defaultCollapsed={false}
        navCollapsedSize={50}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    padding: 16,
    color: "red",
    fontSize: 18,
  },
});
