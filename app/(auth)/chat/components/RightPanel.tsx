import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MessageInput from "./MessageInput";
import TimeSlotMessage from "./TimeSlotMessage";
import LocationMessage from "./LocationMessage";
import SchedulePlanner from "./SchedulePlanner";
import { chatService } from "../../../../api/chatapi";

interface RightPanelProps {
  messages: any[];
  currentUserId: string;
  currentUserName: string | null;
  selectedConversationId: string | null;
  selectedContactId?: string | null;
  conversation?: any;
  onSendMessage?: (text: string) => void;
  onBack?: () => void;
}

const { width } = Dimensions.get("window");

export default function RightPanel({
  messages,
  currentUserId,
  currentUserName,
  selectedConversationId,
  selectedContactId,
  conversation,
  onSendMessage,
  onBack,
}: RightPanelProps) {
  const [displayedMessages, setDisplayedMessages] = useState(messages);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  // Sync displayedMessages with props when messages change
  useEffect(() => {
    console.log(
      "[RightPanel] Raw messages received:",
      messages.map((msg) => ({
        id: msg.id,
        text: msg.text.substring(0, 100),
        sender_id: msg.sender_id,
        senderName: msg.User?.name || msg.sender?.name,
        deleted: msg.deleted,
        read: msg.read,
        date: msg.date,
        isCurrentUser: msg.sender_id === currentUserId || msg.isFromCurrentUser,
        senderType: msg.sender?.type,
        receiverType: msg.receiver?.type,
      }))
    );

    console.log("[RightPanel] Current user ID:", currentUserId);
    console.log(
      "[RightPanel] Conversation info:",
      conversation
        ? {
            id: conversation.id,
            userRole: conversation.userRole,
            conversationRole: conversation.conversationRole,
            regularUserId: conversation.User?.id,
            regularUserName: conversation.User?.name,
            contractorUserId: conversation.Contractor?.user?.id,
            contractorUserName: conversation.Contractor?.user?.name,
          }
        : "No conversation"
    );

    setDisplayedMessages(messages);
  }, [messages, currentUserId, conversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current && displayedMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [displayedMessages, selectedConversationId]);

  const getSenderName = (message: any) => {
    if (!message.sender_id) return "Unknown Sender";

    // Use enhanced sender info if available
    if (message.sender?.name) {
      return message.sender.name;
    }

    // Fallback to original logic
    if (message.sender_id === currentUserId || message.isFromCurrentUser) {
      return currentUserName || "You";
    }
    return message.User?.name || "Contact";
  };

  const getSenderType = (message: any) => {
    // Use enhanced sender info if available
    if (message.sender?.type) {
      return message.sender.type;
    }

    // Fallback logic based on conversation context
    if (message.sender_id === currentUserId || message.isFromCurrentUser) {
      return conversation?.conversationRole || "user";
    }

    // Other party type
    return conversation?.conversationRole === "user" ? "contractor" : "user";
  };

  const getContactInfo = () => {
    if (!conversation)
      return { name: "Contact", receiverId: selectedContactId };

    // Use enhanced receiver info if available
    if (conversation.receiver) {
      return {
        name: conversation.receiver.name,
        receiverId: conversation.receiver.id,
        type: conversation.receiver.type,
      };
    }

    // Fallback to original logic
    if (conversation.Contractor?.user?.id === currentUserId) {
      return {
        name: conversation.User?.name || "User",
        receiverId: conversation.User?.id,
        type: "user",
      };
    } else {
      return {
        name: conversation.Contractor?.user?.name || "Contractor",
        receiverId: conversation.Contractor?.user?.id,
        type: "contractor",
      };
    }
  };

  const contactInfo = getContactInfo();

  const isContractorForConversation =
    !!conversation &&
    conversation.Contractor &&
    conversation.Contractor.user &&
    conversation.Contractor.user.id === currentUserId;

  const contractorIdForConversation: number | undefined =
    conversation?.Contractor?.id;

  const getMessageType = (text: string) => {
    if (
      typeof text === "string" &&
      (text.startsWith("PROPOSED_TIMESLOT::") ||
        text.startsWith("APPROVED_TIMESLOT::"))
    ) {
      return "timeslot";
    }
    if (
      typeof text === "string" &&
      /Location: https:\/\/www\.google\.com\/maps\?q=/.test(text)
    ) {
      return "location";
    }
    return "text";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleDeleteMessage = (messageId: string) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Call backend to soft-delete the message
              await chatService.deleteMessage(messageId);

              // Update local state to reflect deletion
              setDisplayedMessages((prev) =>
                prev.map((msg) =>
                  msg.id === messageId
                    ? { ...msg, deleted: true, text: "Message was deleted" }
                    : msg
                )
              );
            } catch (error) {
              console.error("[RightPanel] Failed to delete message:", error);
              Alert.alert(
                "Error",
                "Failed to delete message. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  if (!selectedConversationId) {
    return (
      <View style={styles.noConversationContainer}>
        <Text style={styles.noConversationText}>
          Select a conversation to start chatting
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.contactName}>{contactInfo.name}</Text>
          <Text style={styles.contactType}>
            {contactInfo.type === "contractor" ? "Contractor" : "User"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowSchedule(true)}
            style={styles.iconButton}
          >
            <Ionicons name="time-outline" size={20} color="#4b5563" />
          </TouchableOpacity>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.iconButton}>
              <Ionicons name="close" size={20} color="#4b5563" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {displayedMessages.length === 0 ? (
          <View style={styles.noMessagesContainer}>
            <Text style={styles.noMessagesText}>
              No messages in this conversation
            </Text>
          </View>
        ) : (
          displayedMessages.map((message) => {
            const isCurrentUser =
              message.sender_id === currentUserId || message.isFromCurrentUser;
            const senderName = getSenderName(message);
            const senderType = getSenderType(message);
            const isDeleted = message.deleted;
            const messageType = getMessageType(message.text);

            return (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  isCurrentUser
                    ? styles.currentUserMessage
                    : styles.otherUserMessage,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isCurrentUser
                      ? senderType === "contractor"
                        ? styles.currentUserContractorBubble
                        : styles.currentUserBubble
                      : senderType === "contractor"
                      ? styles.otherContractorBubble
                      : styles.otherUserBubble,
                  ]}
                >
                  {/* Message header */}
                  <View style={styles.messageHeader}>
                    <Text style={styles.senderName}>{senderName}</Text>
                    <View
                      style={[
                        styles.senderTypeBadge,
                        senderType === "contractor"
                          ? styles.contractorBadge
                          : styles.userBadge,
                      ]}
                    >
                      <Text style={styles.senderTypeText}>
                        {senderType === "contractor" ? "Contractor" : "User"}
                      </Text>
                    </View>
                  </View>

                  {/* Message content */}
                  {isDeleted ? (
                    <Text
                      style={[styles.messageText, styles.deletedMessageText]}
                    >
                      Message was deleted
                    </Text>
                  ) : messageType === "timeslot" ? (
                    <TimeSlotMessage
                      messageText={message.text}
                      messageId={message.id}
                      isContractor={isContractorForConversation}
                      contractorId={contractorIdForConversation}
                      onMessageUpdate={(updated) => {
                        setDisplayedMessages((prev) =>
                          prev.map((m) =>
                            m.id === updated.id ? { ...m, ...updated } : m
                          )
                        );
                      }}
                    />
                  ) : messageType === "location" ? (
                    <LocationMessage text={message.text} />
                  ) : (
                    <Text style={styles.messageText}>{message.text}</Text>
                  )}

                  {/* Message footer */}
                  <View style={styles.messageFooter}>
                    <Text style={styles.messageTime}>
                      {message.date ? formatTime(message.date) : ""}
                    </Text>
                    {isCurrentUser && !isDeleted && (
                      <TouchableOpacity
                        onPress={() => handleDeleteMessage(message.id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Message Input */}
      <MessageInput
        conversationId={selectedConversationId || undefined}
        receiverId={contactInfo.receiverId || undefined}
        receiverName={contactInfo.name}
        onMessageSent={(newMessage) => {
          setDisplayedMessages((prev) => [...prev, newMessage]);
          setTimeout(
            () => scrollViewRef.current?.scrollToEnd({ animated: true }),
            100
          );
        }}
      />

      {/* Schedule Planner Overlay */}
      {showSchedule && (
        <View style={styles.scheduleOverlay}>
          <View style={styles.scheduleSheet}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleTitle}>Schedule</Text>
              <TouchableOpacity onPress={() => setShowSchedule(false)}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <SchedulePlanner
              onViewConversation={(conversationId) => {
                setShowSchedule(false);
                console.log(
                  "[RightPanel] onViewConversation from SchedulePlanner:",
                  conversationId
                );
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  noConversationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  noConversationText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  contactType: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  noMessagesText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  currentUserMessage: {
    alignSelf: "flex-end",
  },
  otherUserMessage: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  currentUserBubble: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
  },
  currentUserContractorBubble: {
    backgroundColor: "#dbeafe",
    borderColor: "#bfdbfe",
  },
  otherUserBubble: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },
  otherContractorBubble: {
    backgroundColor: "#faf5ff",
    borderColor: "#e9d5ff",
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  senderName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  senderTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  contractorBadge: {
    backgroundColor: "#e9d5ff",
  },
  userBadge: {
    backgroundColor: "#dbeafe",
  },
  senderTypeText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#374151",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1f2937",
  },
  deletedMessageText: {
    fontStyle: "italic",
    color: "#6b7280",
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  messageTime: {
    fontSize: 12,
    color: "#6b7280",
  },
  deleteButton: {
    padding: 4,
  },
  iconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  scheduleOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  scheduleSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
});
