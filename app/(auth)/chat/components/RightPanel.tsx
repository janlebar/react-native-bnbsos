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
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendMessage } from "../../../../api/chatapi";

const { width, height } = Dimensions.get("window");
const isMobile = width < 768;

interface RightPanelProps {
  messages: any[];
  currentUserId: string;
  currentUserName: string | null;
  selectedConversationId: string | null;
  selectedContactId?: string | null;
  conversation?: any;
  isMobile?: boolean;
}

const formatMessageTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "now";
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  } catch (error) {
    return "";
  }
};

export default function RightPanel({
  messages,
  currentUserId,
  currentUserName,
  selectedConversationId,
  selectedContactId,
  conversation,
  isMobile: propIsMobile = false,
}: RightPanelProps) {
  const [inputText, setInputText] = useState("");
  const [displayedMessages, setDisplayedMessages] = useState(messages);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const mobile = propIsMobile || isMobile;

  // Update displayed messages when props change
  useEffect(() => {
    setDisplayedMessages(messages);
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && displayedMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [displayedMessages]);

  const handleSendMessage = async () => {
    if (
      !inputText.trim() ||
      !selectedConversationId ||
      !selectedContactId ||
      isLoading
    ) {
      return;
    }

    const messageText = inputText.trim();
    setInputText("");
    setIsLoading(true);

    // Create optimistic message
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender_id: currentUserId,
      senderName: currentUserName || "You",
      date: new Date().toISOString(),
      isOptimistic: true,
    };

    // Add optimistic message to UI
    setDisplayedMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Send message to API
      const newMessage = await sendMessage(
        currentUserId,
        selectedContactId,
        messageText
      );

      // Replace optimistic message with real message
      setDisplayedMessages((prev) =>
        prev.map((msg) =>
          msg.isOptimistic
            ? { ...newMessage, senderName: currentUserName || "You" }
            : msg
        )
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");

      // Remove optimistic message on error
      setDisplayedMessages((prev) => prev.filter((msg) => !msg.isOptimistic));
    } finally {
      setIsLoading(false);
    }
  };

  const getSenderName = (message: any) => {
    if (!message.sender_id) return "Unknown Sender";
    if (message.sender_id === currentUserId) return currentUserName || "You";
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
          mobile && styles.messageContainerMobile,
        ]}
      >
        {/* Message Header */}
        <View style={styles.messageHeader}>
          <Text
            style={[
              styles.senderName,
              isCurrentUser ? styles.currentUserName : styles.otherUserName,
              mobile && styles.senderNameMobile,
            ]}
          >
            {senderName}
          </Text>
          <Text
            style={[styles.messageTime, mobile && styles.messageTimeMobile]}
          >
            {formatMessageTime(item.date)}
          </Text>
        </View>

        {/* Message Content */}
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            mobile && styles.messageBubbleMobile,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText,
              mobile && styles.messageTextMobile,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  if (!selectedConversationId) {
    return (
      <View style={[styles.container, mobile && styles.containerMobile]}>
        <View style={[styles.emptyState, mobile && styles.emptyStateMobile]}>
          <Ionicons
            name="chatbubble-outline"
            size={mobile ? 64 : 80}
            color="#cbd5e1"
          />
          <Text style={[styles.emptyText, mobile && styles.emptyTextMobile]}>
            Select a conversation to start messaging
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, mobile && styles.containerMobile]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={displayedMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesListContent,
          mobile && styles.messagesListContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (flatListRef.current && displayedMessages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
      />

      {/* Input Area */}
      <View
        style={[styles.inputContainer, mobile && styles.inputContainerMobile]}
      >
        <View
          style={[styles.inputWrapper, mobile && styles.inputWrapperMobile]}
        >
          <TextInput
            style={[styles.textInput, mobile && styles.textInputMobile]}
            placeholder="Type a message..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              mobile && styles.sendButtonMobile,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={mobile ? 20 : 24}
              color={inputText.trim() && !isLoading ? "#ffffff" : "#94a3b8"}
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
    backgroundColor: "#ffffff",
  },
  containerMobile: {
    height: "100%",
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messagesListContentMobile: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  messageContainerMobile: {
    marginBottom: 12,
    maxWidth: "85%",
  },
  currentUserMessage: {
    alignSelf: "flex-end",
  },
  otherUserMessage: {
    alignSelf: "flex-start",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  senderNameMobile: {
    fontSize: 11,
  },
  currentUserName: {
    color: "#3b82f6",
  },
  otherUserName: {
    color: "#64748b",
  },
  messageTime: {
    fontSize: 10,
    color: "#94a3b8",
  },
  messageTimeMobile: {
    fontSize: 9,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageBubbleMobile: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  currentUserBubble: {
    backgroundColor: "#3b82f6",
  },
  otherUserBubble: {
    backgroundColor: "#f1f5f9",
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
    color: "#ffffff",
  },
  otherUserText: {
    color: "#1e293b",
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainerMobile: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputWrapperMobile: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    maxHeight: 100,
    paddingVertical: 4,
  },
  textInputMobile: {
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonMobile: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  sendButtonDisabled: {
    backgroundColor: "#e2e8f0",
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
});
