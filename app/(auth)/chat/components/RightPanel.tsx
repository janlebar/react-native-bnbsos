import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendMessage } from "../../../../api/chatapi";

interface RightPanelProps {
  messages: any[];
  currentUserId: string;
  currentUserName: string | null;
  selectedConversationId: string | null;
  selectedContactId?: string | null;
  conversation?: any;
  isMobile?: boolean;
}

// Format time for display
const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function RightPanel({
  messages,
  currentUserId,
  currentUserName,
  selectedConversationId,
  selectedContactId,
  conversation,
  isMobile = false,
}: RightPanelProps) {
  const [inputText, setInputText] = useState("");
  const [displayedMessages, setDisplayedMessages] = useState(messages);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Update displayed messages when props change
  useEffect(() => {
    setDisplayedMessages(messages);
    // Auto scroll to bottom when messages change
    setTimeout(() => {
      if (flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedContactId || isLoading) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsLoading(true);

    try {
      // Create optimistic message for immediate UI update
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        text: messageText,
        sender_id: currentUserId,
        User: { name: currentUserName },
        date: new Date().toISOString(),
        read: true,
        deleted: false,
      };

      // Update UI immediately
      setDisplayedMessages((prev) => [...prev, optimisticMessage]);

      // Send message to API
      const newMessage = await sendMessage(
        currentUserId,
        selectedContactId,
        messageText
      );

      // Replace optimistic message with real one
      setDisplayedMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id
            ? {
                id: newMessage.id,
                text: newMessage.content,
                sender_id: newMessage.senderId,
                User: { name: newMessage.sender?.name },
                date: newMessage.createdAt,
                read: newMessage.read,
                deleted: false,
              }
            : msg
        )
      );

      // Scroll to bottom
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");

      // Remove optimistic message on error
      setDisplayedMessages((prev) =>
        prev.filter((msg) => msg.id !== `temp-${Date.now()}`)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getSenderName = (message: any) => {
    if (message.sender_id === currentUserId) {
      return currentUserName || "You";
    }
    return message.User?.name || "Contact";
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isCurrentUser = item.sender_id === currentUserId;
    const senderName = getSenderName(item);

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
          isMobile && styles.messageContainerMobile,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            isMobile && styles.messageBubbleMobile,
          ]}
        >
          {!isCurrentUser && (
            <Text
              style={[styles.senderName, isMobile && styles.senderNameMobile]}
            >
              {senderName}
            </Text>
          )}

          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText,
              isMobile && styles.messageTextMobile,
            ]}
          >
            {item.deleted ? "Message was deleted" : item.text}
          </Text>

          <Text
            style={[
              styles.messageTime,
              isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
              isMobile && styles.messageTimeMobile,
            ]}
          >
            {formatMessageTime(item.date)}
          </Text>
        </View>
      </View>
    );
  };

  if (!selectedConversationId) {
    return (
      <View style={[styles.container, styles.emptyStateContainer]}>
        <Text
          style={[
            styles.emptyStateText,
            isMobile && styles.emptyStateTextMobile,
          ]}
        >
          Select a conversation to start messaging
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={styles.headerContent}>
          <View style={[styles.avatar, isMobile && styles.avatarMobile]}>
            <Text
              style={[styles.avatarText, isMobile && styles.avatarTextMobile]}
            >
              {conversation?.User?.name?.charAt(0)?.toUpperCase() ||
                conversation?.Contractor?.user?.name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                "?"}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text
              style={[styles.headerName, isMobile && styles.headerNameMobile]}
            >
              {conversation?.User?.name ||
                conversation?.Contractor?.user?.name ||
                "Contact"}
            </Text>
            <Text
              style={[
                styles.headerSubtext,
                isMobile && styles.headerSubtextMobile,
              ]}
            >
              Reply to conversation
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, isMobile && styles.actionButtonMobile]}
          >
            <Ionicons
              name="archive-outline"
              size={isMobile ? 18 : 20}
              color="#666"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, isMobile && styles.actionButtonMobile]}
          >
            <Ionicons
              name="trash-outline"
              size={isMobile ? 18 : 20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <View style={styles.messagesContainer}>
        {displayedMessages.length === 0 ? (
          <View style={styles.emptyMessagesContainer}>
            <Text
              style={[
                styles.emptyMessagesText,
                isMobile && styles.emptyMessagesTextMobile,
              ]}
            >
              No messages in this conversation
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayedMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: false });
              }
            }}
          />
        )}
      </View>

      {/* Input Area */}
      <View
        style={[styles.inputContainer, isMobile && styles.inputContainerMobile]}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[styles.attachButton, isMobile && styles.attachButtonMobile]}
          >
            <Ionicons name="attach" size={isMobile ? 20 : 24} color="#666" />
          </TouchableOpacity>

          <TextInput
            style={[styles.textInput, isMobile && styles.textInputMobile]}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              isMobile && styles.sendButtonMobile,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name={isLoading ? "hourglass" : "send"}
              size={isMobile ? 18 : 20}
              color={!inputText.trim() || isLoading ? "#ccc" : "#007AFF"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  emptyStateContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  emptyStateTextMobile: {
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  headerMobile: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerContent: {
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
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  headerNameMobile: {
    fontSize: 14,
  },
  headerSubtext: {
    fontSize: 12,
    color: "#666",
  },
  headerSubtextMobile: {
    fontSize: 10,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  actionButtonMobile: {
    padding: 6,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMessagesText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  emptyMessagesTextMobile: {
    fontSize: 14,
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  messageContainerMobile: {
    paddingHorizontal: 12,
  },
  currentUserMessage: {
    alignItems: "flex-end",
  },
  otherUserMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  messageBubbleMobile: {
    maxWidth: "85%",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  currentUserBubble: {
    backgroundColor: "#007AFF",
  },
  otherUserBubble: {
    backgroundColor: "#f0f0f0",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 2,
  },
  senderNameMobile: {
    fontSize: 10,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTextMobile: {
    fontSize: 14,
    lineHeight: 18,
  },
  currentUserText: {
    color: "#fff",
  },
  otherUserText: {
    color: "#000",
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  messageTimeMobile: {
    fontSize: 8,
  },
  currentUserTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherUserTime: {
    color: "#999",
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainerMobile: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  attachButtonMobile: {
    padding: 6,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  textInputMobile: {
    fontSize: 14,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
  },
  sendButtonMobile: {
    padding: 6,
    marginLeft: 6,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
