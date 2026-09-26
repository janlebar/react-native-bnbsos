// app/(auth)/schedule.tsx
// Standalone schedule — mirrors the web app/[locale]/schedule page.
//
// Ownership: the web page scopes to `Conversation.userId` (the customer's
// appointments), while the mobile `/api/user/appointments` endpoint returns
// appointments for BOTH sides. This screen therefore works for both roles and
// filters to the active role:
//   - user mode      → appointments where the user is the customer
//   - contractor mode → appointments where the user is the contractor
// The card always shows the counterpart (contractor for a customer, customer
// for a contractor).

import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FooterMenu, { FOOTER_HEIGHT } from "../user/footerMenu";
import { useAuth } from "../../lib/auth-context";
import {
  getUserAppointments,
  type ScheduledAppointment,
} from "../../api/chatapi";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<ScheduledAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isContractorMode = user?.isContractor === true;
  const myContractorId = user?.contractorId ?? user?.contractor?.id ?? null;

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUserAppointments();
      if (result.success) {
        setAppointments(result.appointments || []);
      } else {
        setError("Failed to load your schedule.");
      }
    } catch (err) {
      console.error("[Schedule] Error loading appointments:", err);
      setError("Failed to load your schedule.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAppointments();
    }, [loadAppointments])
  );

  // Only show appointments for the active role side.
  const relevantAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const isContractorSide =
        myContractorId != null && appt.contractor.id === myContractorId;
      return isContractorMode ? isContractorSide : !isContractorSide;
    });
  }, [appointments, isContractorMode, myContractorId]);

  const now = Date.now();
  const upcoming = relevantAppointments.filter(
    (a) => new Date(a.startTime).getTime() > now
  );
  const past = relevantAppointments.filter(
    (a) => new Date(a.startTime).getTime() <= now
  );

  const counterpartName = (appt: ScheduledAppointment) => {
    const isContractorSide =
      myContractorId != null && appt.contractor.id === myContractorId;
    if (isContractorSide) {
      return appt.customer?.name || "Customer";
    }
    return appt.contractor.name || "Contractor";
  };

  const handleViewConversation = (appt: ScheduledAppointment) => {
    router.push(
      `/(auth)/chat/${appt.contractor.id}/${appt.conversationId}`
    );
  };

  const renderCard = (appt: ScheduledAppointment, isPast: boolean) => (
    <TouchableOpacity
      key={appt.id}
      style={[styles.card, isPast && styles.cardPast]}
      onPress={() => handleViewConversation(appt)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons
            name="person-circle-outline"
            size={20}
            color={isPast ? "#6b7280" : "#2563eb"}
          />
          <Text style={styles.cardTitle} numberOfLines={1}>
            {counterpartName(appt)}
          </Text>
        </View>
        <View style={[styles.badge, isPast && styles.badgePast]}>
          <Text style={[styles.badgeText, isPast && styles.badgeTextPast]}>
            {isPast ? "Completed" : "Confirmed"}
          </Text>
        </View>
      </View>

      {!isContractorSide(appt) &&
        appt.contractor.specializations.length > 0 && (
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

      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
        <Text style={styles.detailText}>{formatDate(appt.startTime)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="time-outline" size={14} color="#9ca3af" />
        <Text style={styles.detailText}>
          {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
        </Text>
      </View>

      <View style={styles.viewChatRow}>
        <Ionicons name="chatbubble-outline" size={14} color="#2563eb" />
        <Text style={styles.viewChatText}>View chat</Text>
      </View>
    </TouchableOpacity>
  );

  function isContractorSide(appt: ScheduledAppointment) {
    return myContractorId != null && appt.contractor.id === myContractorId;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading && relevantAppointments.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your schedule…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAppointments}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : relevantAppointments.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={56} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No scheduled appointments</Text>
          <Text style={styles.emptySubtitle}>
            {isContractorMode
              ? "Approved timeslots on your jobs will appear here."
              : "Book appointments with contractors to see them here."}
          </Text>
          {!isContractorMode && (
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push("/(auth)/home")}
            >
              <Text style={styles.browseButtonText}>Browse Contractors</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: "#dcfce7" }]}>
                <Ionicons name="time-outline" size={20} color="#16a34a" />
              </View>
              <Text style={styles.summaryValue}>{upcoming.length}</Text>
              <Text style={styles.summaryLabel}>Upcoming</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: "#dbeafe" }]}>
                <Ionicons name="calendar-outline" size={20} color="#2563eb" />
              </View>
              <Text style={styles.summaryValue}>
                {relevantAppointments.length}
              </Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: "#f3f4f6" }]}>
                <Ionicons name="checkmark-done-outline" size={20} color="#6b7280" />
              </View>
              <Text style={styles.summaryValue}>{past.length}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
          </View>

          {upcoming.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={16} color="#16a34a" />
                <Text style={[styles.sectionTitle, { color: "#16a34a" }]}>
                  Upcoming appointments
                </Text>
              </View>
              {upcoming.map((a) => renderCard(a, false))}
            </View>
          )}

          {past.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={[styles.sectionTitle, { color: "#6b7280" }]}>
                  Past appointments
                </Text>
              </View>
              {past.map((a) => renderCard(a, true))}
            </View>
          )}
        </ScrollView>
      )}

      <FooterMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: { paddingVertical: 4 },
  backBtnText: { color: "#3b82f6", fontSize: 15, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  headerSpacer: { width: 48 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: FOOTER_HEIGHT + 16, gap: 16 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: FOOTER_HEIGHT,
    gap: 10,
  },
  loadingText: { fontSize: 15, color: "#6b7280" },
  errorText: { fontSize: 15, color: "#ef4444", textAlign: "center" },
  retryButton: {
    borderWidth: 1,
    borderColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryText: { color: "#3b82f6", fontSize: 14, fontWeight: "600" },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  browseButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  browseButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  summaryRow: { flexDirection: "row", gap: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  summaryValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  summaryLabel: { fontSize: 12, color: "#6b7280" },
  section: { gap: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPast: { opacity: 0.72 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#111827" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
  },
  badgePast: { backgroundColor: "#f3f4f6" },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#16a34a" },
  badgeTextPast: { color: "#6b7280" },
  specsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  specChip: {
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  specText: { fontSize: 11, color: "#374151" },
  moreSpecs: { fontSize: 11, color: "#9ca3af", alignSelf: "center" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  detailText: { fontSize: 13, color: "#6b7280" },
  viewChatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  viewChatText: { fontSize: 13, fontWeight: "600", color: "#2563eb" },
});
