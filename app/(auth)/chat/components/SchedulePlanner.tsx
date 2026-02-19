import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getUserAppointments,
  ScheduledAppointment,
} from "../../../../api/chatapi";

interface SchedulePlannerProps {
  onViewConversation?: (conversationId: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SchedulePlanner({ onViewConversation }: SchedulePlannerProps) {
  const [appointments, setAppointments] = useState<ScheduledAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUserAppointments();
      if (result.success) {
        setAppointments(result.appointments);
      } else {
        setError("Failed to load appointments.");
      }
    } catch {
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading schedule…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchAppointments} style={styles.retryButton}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.startTime) > now);
  const past = appointments.filter((a) => new Date(a.startTime) <= now);

  if (appointments.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No scheduled appointments yet.</Text>
        <Text style={styles.emptySubText}>
          Book appointments with contractors to see them here.
        </Text>
      </View>
    );
  }

  const AppointmentCard = ({
    appt,
    isPast,
  }: {
    appt: ScheduledAppointment;
    isPast: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.card, isPast && styles.cardPast]}
      onPress={() => onViewConversation?.(appt.conversationId)}
    >
      <View style={styles.cardRow}>
        <Ionicons name="person-circle-outline" size={20} color="#6b7280" />
        <Text style={styles.contractorName}>{appt.contractor.name}</Text>
        <View style={[styles.badge, isPast ? styles.badgePast : styles.badgeConfirmed]}>
          <Text style={[styles.badgeText, isPast && styles.badgeTextPast]}>
            {isPast ? "Completed" : "Confirmed"}
          </Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
        <Text style={styles.detailText}>{formatDate(appt.startTime)}</Text>
      </View>

      <View style={styles.cardRow}>
        <Ionicons name="time-outline" size={14} color="#9ca3af" />
        <Text style={styles.detailText}>
          {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
        </Text>
      </View>

      {appt.contractor.specializations.length > 0 && (
        <View style={styles.specsRow}>
          {appt.contractor.specializations.slice(0, 3).map((spec) => (
            <View key={spec} style={styles.specChip}>
              <Text style={styles.specText}>{spec}</Text>
            </View>
          ))}
          {appt.contractor.specializations.length > 3 && (
            <Text style={styles.moreSpecs}>
              +{appt.contractor.specializations.length - 3} more
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {upcoming.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={16} color="#16a34a" />
            <Text style={[styles.sectionTitle, { color: "#16a34a" }]}>
              Upcoming ({upcoming.length})
            </Text>
          </View>
          {upcoming.map((a) => (
            <AppointmentCard key={a.id} appt={a} isPast={false} />
          ))}
        </View>
      )}

      {past.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={[styles.sectionTitle, { color: "#6b7280" }]}>
              Past ({past.length})
            </Text>
          </View>
          {past.map((a) => (
            <AppointmentCard key={a.id} appt={a} isPast={true} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 8 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#6b7280", marginTop: 8 },
  errorText: { fontSize: 14, color: "#ef4444", textAlign: "center" },
  retryButton: {
    borderWidth: 1,
    borderColor: "#3b82f6",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: "#3b82f6", fontSize: 13 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#374151", marginTop: 8 },
  emptySubText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },
  section: { gap: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPast: { opacity: 0.7 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contractorName: { flex: 1, fontSize: 14, fontWeight: "600", color: "#111827" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
  },
  badgePast: { backgroundColor: "#f3f4f6" },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#16a34a" },
  badgeTextPast: { color: "#6b7280" },
  detailText: { fontSize: 13, color: "#6b7280" },
  specsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  specChip: {
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  specText: { fontSize: 11, color: "#374151" },
  moreSpecs: { fontSize: 11, color: "#9ca3af", alignSelf: "center" },
});

