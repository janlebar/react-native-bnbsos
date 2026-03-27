import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { replyToConversation, sendMessage } from "../../../../api/chatapi";
import { useAuth } from "../../../../lib/auth-context";
import { encodeLocationMessage } from "../../../../utils/locationUtils";
import LocationPickerModal from "./LocationPickerModal";
import CalendarPickerModal from "./CalendarPickerModal";

interface MessageInputProps {
  conversationId?: string; // If set: reply to existing conversation
  receiverId?: string; // If set (no conversationId): create new conversation
  receiverName?: string | null;
  onMessageSent?: (message: any) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export default function MessageInput({
  conversationId,
  receiverId,
  receiverName,
  onMessageSent,
  onConversationCreated,
}: MessageInputProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = user?.id;

  const handleSendText = async () => {
    if (!text.trim() || !currentUserId) return;
    await sendContent(text.trim());
    setText("");
  };

  const handleSendLocation = async (lat: number, lng: number) => {
    // Encode using the same format as the Next.js app
    const locationText = encodeLocationMessage(lat, lng);
    await sendContent(locationText, "Location shared");
    setShowLocationPicker(false);
  };

  const handleSendTimeSlot = async (slot: { startTime: Date; endTime: Date }) => {
    const timeSlotData = {
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      proposedAt: new Date().toISOString(),
    };
    const formatted = `PROPOSED_TIMESLOT::${JSON.stringify(timeSlotData)}`;
    await sendContent(formatted, "Time slot proposal");
    setShowCalendar(false);
  };

  const sendContent = async (content: string, subject?: string) => {
    if (!currentUserId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (conversationId) {
        // Reply to existing conversation
        // sender_id removed from call: server derives from JWT session (C-1 + C-2 fix)
        const message = await replyToConversation(
          conversationId,
          content,
          subject
        );
        onMessageSent?.(message);
      } else if (receiverId) {
        // Create new conversation with first message
        // senderId removed from call: server derives from JWT session (C-1 fix)
        const message = await sendMessage(receiverId, content);
        if (message?.conversationId) {
          onConversationCreated?.(message.conversationId);
        }
        onMessageSent?.(message);
      }
    } catch (err) {
      console.error("[MessageInput] Error:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      {/* Toolbar: location + calendar buttons */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={() => setShowLocationPicker(true)}
          style={styles.toolbarButton}
        >
          <FontAwesome5 name="map-marker-alt" size={18} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowCalendar(true)}
          style={styles.toolbarButton}
        >
          <Ionicons name="calendar-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Text input + send button */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={
            conversationId
              ? "Type your message..."
              : `Message ${receiverName || "contact"}...`
          }
          placeholderTextColor="#9ca3af"
          editable={!isSubmitting}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSendText}
        />
        <TouchableOpacity
          onPress={handleSendText}
          disabled={isSubmitting || !text.trim()}
          style={[
            styles.sendButton,
            (!text.trim() || isSubmitting) && styles.sendButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPickerModal
          onClose={() => setShowLocationPicker(false)}
          onSend={handleSendLocation}
        />
      )}

      {/* Calendar / Time Slot Picker Modal */}
      {showCalendar && (
        <CalendarPickerModal
          onClose={() => setShowCalendar(false)}
          onSend={handleSendTimeSlot}
          receiverId={receiverId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toolbar: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 8,
  },
  toolbarButton: {
    padding: 6,
    borderRadius: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  error: {
    color: "#ef4444",
    fontSize: 12,
    marginBottom: 4,
  },
});

