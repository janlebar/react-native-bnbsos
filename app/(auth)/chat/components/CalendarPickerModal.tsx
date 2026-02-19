import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getContractorByUserId,
  getContractorAvailability,
} from "../../../../api/chatapi";

interface CalendarPickerModalProps {
  onClose: () => void;
  onSend: (slot: { startTime: Date; endTime: Date }) => void;
  receiverId?: string; // User ID of the contractor
}

interface TimeSlot {
  startTime: Date;
  endTime: Date;
}

const WORKING_HOURS = { start: 9, end: 17 };
const SLOT_INTERVAL_MINUTES = 30;

function generateSlots(date: Date, startHour: number, endHour: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const current = new Date(date);
  current.setHours(startHour, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(endHour, 0, 0, 0);

  while (current < endOfDay) {
    const startTime = new Date(current);
    const endTime = new Date(current.getTime() + SLOT_INTERVAL_MINUTES * 60000);
    slots.push({ startTime, endTime });
    current.setMinutes(current.getMinutes() + SLOT_INTERVAL_MINUTES);
  }
  return slots;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export default function CalendarPickerModal({
  onClose,
  onSend,
  receiverId,
}: CalendarPickerModalProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookedSlots, setBookedSlots] = useState<{ startTime: Date; endTime: Date }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (receiverId) {
      loadAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiverId]);

  const loadAvailability = async () => {
    if (!receiverId) return;
    setIsLoading(true);
    try {
      const contractorRes = await getContractorByUserId(receiverId);
      if (contractorRes.success && contractorRes.contractorId) {
        const availRes = await getContractorAvailability(contractorRes.contractorId);
        if (availRes.success) {
          const parsed = availRes.availabilitySlots.map((s) => ({
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
          }));
          setBookedSlots(parsed);
        }
      }
    } catch (err) {
      console.error("[CalendarPickerModal] Failed to load availability:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableSlots = (date: Date): TimeSlot[] => {
    const all = generateSlots(date, WORKING_HOURS.start, WORKING_HOURS.end);
    const bookedForDay = bookedSlots.filter((b) => isSameDay(b.startTime, date));
    return all.filter(
      (slot) =>
        !bookedForDay.some(
          (booked) =>
            slot.startTime < booked.endTime && slot.endTime > booked.startTime
        )
    );
  };

  const availableSlots = selectedDate ? getAvailableSlots(selectedDate) : [];

  // Calendar rendering
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  };

  const handleSend = () => {
    if (selectedSlot) {
      onSend(selectedSlot);
    }
  };

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose a Time Slot</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Loading availability…</Text>
            </View>
          )}

          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {DAYS.map((d) => (
              <Text key={d} style={styles.dayHeader}>
                {d}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {/* Empty cells for day offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {daysInMonth.map((day) => {
              const isPast = day < todayMidnight;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const slots = getAvailableSlots(day);
              const hasSlots = slots.length > 0;

              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    (isPast || !hasSlots) && styles.dayCellUnavailable,
                  ]}
                  onPress={() => {
                    if (!isPast && hasSlots) {
                      setSelectedDate(day);
                      setSelectedSlot(null);
                    }
                  }}
                  disabled={isPast || !hasSlots}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      (isPast || !hasSlots) && styles.dayTextUnavailable,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time slot grid */}
          {selectedDate && (
            <View style={styles.slotsSection}>
              <Text style={styles.slotsTitle}>
                Available times on{" "}
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              {availableSlots.length === 0 ? (
                <Text style={styles.noSlots}>No available times on this day.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.slotRow}>
                    {availableSlots.map((slot, i) => {
                      const isSelected =
                        selectedSlot &&
                        slot.startTime.getTime() === selectedSlot.startTime.getTime();
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.slotChip,
                            isSelected && styles.slotChipSelected,
                          ]}
                          onPress={() => setSelectedSlot(slot)}
                        >
                          <Text
                            style={[
                              styles.slotText,
                              isSelected && styles.slotTextSelected,
                            ]}
                          >
                            {formatTime(slot.startTime)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* Send button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!selectedSlot}
            style={[styles.sendButton, !selectedSlot && styles.sendButtonDisabled]}
          >
            <Text style={styles.sendButtonText}>
              {selectedSlot
                ? `Propose ${formatTime(selectedSlot.startTime)}`
                : "Select a time slot"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const CELL_SIZE = 38;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: "700", color: "#111827" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  loadingText: { fontSize: 12, color: "#6b7280" },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  navBtn: { padding: 4 },
  monthLabel: { fontSize: 15, fontWeight: "600", color: "#111827" },
  dayHeaders: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  dayHeader: {
    width: CELL_SIZE,
    textAlign: "center",
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
  },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: CELL_SIZE / 2,
    margin: 1,
  },
  dayCellSelected: { backgroundColor: "#2563eb" },
  dayCellUnavailable: { opacity: 0.3 },
  dayText: { fontSize: 13, color: "#111827" },
  dayTextSelected: { color: "#fff", fontWeight: "700" },
  dayTextUnavailable: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  slotsSection: { marginTop: 16 },
  slotsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  noSlots: { fontSize: 12, color: "#9ca3af" },
  slotRow: { flexDirection: "row", gap: 8, paddingBottom: 8 },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  slotChipSelected: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  slotText: { fontSize: 13, color: "#374151" },
  slotTextSelected: { color: "#fff", fontWeight: "600" },
  sendButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  sendButtonDisabled: { backgroundColor: "#93c5fd" },
  sendButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

