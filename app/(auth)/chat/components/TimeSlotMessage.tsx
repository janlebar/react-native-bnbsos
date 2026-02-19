import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { approveTimeSlot } from "../../../../api/chatapi";

interface TimeSlotData {
  startTime: string; // ISO string
  endTime: string;
  approvedAt?: string;
  availabilitySlotId?: string;
}

interface TimeSlotMessageProps {
  messageText: string;
  messageId: string;
  isContractor: boolean;
  contractorId?: number;
  onMessageUpdate?: (updatedMessage: any) => void;
}

function parseTimeSlot(text: string): TimeSlotData | null {
  try {
    if (text.startsWith("PROPOSED_TIMESLOT::")) {
      return JSON.parse(text.replace("PROPOSED_TIMESLOT::", ""));
    }
    if (text.startsWith("APPROVED_TIMESLOT::")) {
      return JSON.parse(text.replace("APPROVED_TIMESLOT::", ""));
    }
    return null;
  } catch {
    return null;
  }
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function TimeSlotMessage({
  messageText,
  messageId,
  isContractor,
  contractorId,
  onMessageUpdate,
}: TimeSlotMessageProps) {
  const [isApproving, setIsApproving] = useState(false);

  const isProposed = messageText.startsWith("PROPOSED_TIMESLOT::");
  const isApproved = messageText.startsWith("APPROVED_TIMESLOT::");
  const slotData = parseTimeSlot(messageText);

  if (!slotData) {
    return (
      <Text style={{ color: "#ef4444", fontSize: 12 }}>
        Invalid time slot data
      </Text>
    );
  }

  const handleApprove = async () => {
    if (!isContractor || !contractorId) {
      Alert.alert("Error", "Only contractors can approve time slots.");
      return;
    }

    setIsApproving(true);
    try {
      const result = await approveTimeSlot(
        contractorId,
        slotData.startTime,
        slotData.endTime,
        messageId
      );

      if (result.success) {
        Alert.alert("Approved!", "The time slot has been confirmed.");
        onMessageUpdate?.(result.updatedChat);
      } else {
        Alert.alert("Error", result.error || "Failed to approve time slot.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to approve time slot.");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <View style={[styles.card, isApproved && styles.approvedCard]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="calendar"
          size={16}
          color={isApproved ? "#16a34a" : "#2563eb"}
        />
        <Text style={[styles.title, isApproved && styles.approvedTitle]}>
          {isApproved ? "Confirmed Appointment" : "Proposed Time Slot"}
        </Text>
        {isApproved && (
          <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
        )}
      </View>

      {/* Date and Time */}
      <View style={styles.detail}>
        <Ionicons name="calendar-outline" size={14} color="#6b7280" />
        <Text style={styles.detailText}>{formatDateTime(slotData.startTime)}</Text>
      </View>
      <View style={styles.detail}>
        <Ionicons name="time-outline" size={14} color="#6b7280" />
        <Text style={styles.detailText}>
          {formatTime(slotData.startTime)} – {formatTime(slotData.endTime)}
        </Text>
      </View>

      {/* Approved timestamp */}
      {isApproved && slotData.approvedAt && (
        <Text style={styles.approvedAt}>
          ✓ Approved on {formatDateTime(slotData.approvedAt)}
        </Text>
      )}

      {/* Contractor: Approve button */}
      {isProposed && isContractor && (
        <TouchableOpacity
          onPress={handleApprove}
          disabled={isApproving}
          style={[styles.approveButton, isApproving && styles.approveButtonDisabled]}
        >
          {isApproving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.approveButtonText}>Approve Time Slot</Text>
          )}
        </TouchableOpacity>
      )}

      {/* User: waiting message */}
      {isProposed && !isContractor && (
        <Text style={styles.waitingText}>Waiting for contractor approval…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 10,
    padding: 12,
    maxWidth: 280,
    gap: 6,
  },
  approvedCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontWeight: "600",
    fontSize: 14,
    color: "#1e3a8a",
    flex: 1,
  },
  approvedTitle: {
    color: "#14532d",
  },
  detail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#374151",
  },
  approvedAt: {
    fontSize: 11,
    color: "#16a34a",
    marginTop: 4,
  },
  waitingText: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#bfdbfe",
    paddingTop: 6,
  },
  approveButton: {
    backgroundColor: "#2563eb",
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 8,
  },
  approveButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  approveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});

