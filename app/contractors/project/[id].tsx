// app/contractors/project/[id].tsx
// Project Detail Screen with Bid Submission

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ContractorRouteGuard } from "../../../components/ContractorRouteGuard";
import { getProject, submitEstimate } from "../../../api/contractorApi";
import { Project, ProjectEstimate } from "../../../api/types";
import { useAuth } from "../../../lib/auth-context";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [timeline, setTimeline] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProject = async () => {
    if (!id) {
      setError("Invalid project ID");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await getProject(id);
      setProject(result.project);

      // Pre-fill existing estimate if available
      const contractorId = user?.contractor?.id;
      if (contractorId && result.project.estimates) {
        const myEstimate = result.project.estimates.find(
          (e) => e.contractorId === contractorId
        );
        if (myEstimate) {
          setAmount((myEstimate.amount / 100).toString());
          setNotes(myEstimate.notes || "");
          setTimeline(myEstimate.estimatedTimeline || "");
        }
      }
    } catch (err: any) {
      console.error("Error loading project:", err);
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleSubmitBid = async () => {
    if (!amount || isNaN(parseFloat(amount)) || !id) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const amountInCents = Math.round(parseFloat(amount) * 100);
      await submitEstimate(id, {
        amount: amountInCents,
        notes: notes || undefined,
        estimatedTimeline: timeline || undefined,
      });
      Alert.alert("Success", "Bid submitted successfully");
      loadProject(); // Reload to show updated estimate
    } catch (err: any) {
      console.error("Error submitting bid:", err);
      setError(err.message || "Failed to submit bid");
      Alert.alert("Error", err.message || "Failed to submit bid");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ContractorRouteGuard>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading project...</Text>
        </View>
      </ContractorRouteGuard>
    );
  }

  if (error && !project) {
    return (
      <ContractorRouteGuard>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProject}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ContractorRouteGuard>
    );
  }

  if (!project) {
    return null;
  }

  const contractorId = user?.contractor?.id;
  const myEstimate =
    contractorId && project.estimates
      ? project.estimates.find((e) => e.contractorId === contractorId)
      : null;

  return (
    <ContractorRouteGuard>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.title}>{project.title}</Text>
          {project.description && (
            <Text style={styles.description}>{project.description}</Text>
          )}
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Location:</Text>
            <Text style={styles.metaValue}>
              {project.city || "TBD"} {project.address || ""}
            </Text>
          </View>
          {project.budgetMin && project.budgetMax && (
            <View style={styles.meta}>
              <Text style={styles.metaLabel}>Budget:</Text>
              <Text style={styles.metaValue}>
                ${(project.budgetMin / 100).toLocaleString()} - $
                {(project.budgetMax / 100).toLocaleString()}
              </Text>
            </View>
          )}
          {project.deadline && (
            <View style={styles.meta}>
              <Text style={styles.metaLabel}>Deadline:</Text>
              <Text style={styles.metaValue}>
                {new Date(project.deadline).toLocaleDateString()}
              </Text>
            </View>
          )}
          {project.requiredSpecializations.length > 0 && (
            <View style={styles.meta}>
              <Text style={styles.metaLabel}>Required:</Text>
              <Text style={styles.metaValue}>
                {project.requiredSpecializations.join(", ")}
              </Text>
            </View>
          )}
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{project.status}</Text>
          </View>
        </View>

        {project.status === "OPEN" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {myEstimate ? "Update Your Bid" : "Submit Your Bid"}
            </Text>
            {myEstimate && (
              <View style={styles.existingBid}>
                <Text style={styles.existingBidText}>
                  You have an existing bid: ${(myEstimate.amount / 100).toLocaleString()}
                </Text>
              </View>
            )}
            <Text style={styles.label}>Amount ($)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="15000"
            />
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholder="Include materials, timeline, etc."
            />
            <Text style={styles.label}>Estimated Timeline (optional)</Text>
            <TextInput
              style={styles.input}
              value={timeline}
              onChangeText={setTimeline}
              placeholder="4-6 weeks"
            />
            {error && <Text style={styles.errorTextSmall}>{error}</Text>}
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitBid}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {myEstimate ? "Update Bid" : "Submit Bid"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {project.estimates && project.estimates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              All Bids ({project.estimates.length})
            </Text>
            {project.estimates
              .sort((a, b) => a.amount - b.amount)
              .map((estimate) => (
                <View
                  key={estimate.id}
                  style={[
                    styles.estimateCard,
                    estimate.contractorId === contractorId &&
                      styles.myEstimateCard,
                  ]}
                >
                  <Text style={styles.estimateAmount}>
                    ${(estimate.amount / 100).toLocaleString()}
                  </Text>
                  {estimate.contractor && (
                    <Text style={styles.estimateContractor}>
                      {estimate.contractor.name}
                      {estimate.contractorId === contractorId && " (You)"}
                    </Text>
                  )}
                  {estimate.notes && (
                    <Text style={styles.estimateNotes}>{estimate.notes}</Text>
                  )}
                  {estimate.estimatedTimeline && (
                    <Text style={styles.estimateTimeline}>
                      Timeline: {estimate.estimatedTimeline}
                    </Text>
                  )}
                  {estimate.accepted && (
                    <View style={styles.acceptedBadge}>
                      <Text style={styles.acceptedText}>ACCEPTED</Text>
                    </View>
                  )}
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </ContractorRouteGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
    padding: 24,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1f2937",
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 16,
  },
  meta: {
    flexDirection: "row",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
    color: "#374151",
  },
  metaValue: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e40af",
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1f2937",
  },
  existingBid: {
    backgroundColor: "#dbeafe",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  existingBidText: {
    fontSize: 14,
    color: "#1e40af",
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  errorTextSmall: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  estimateCard: {
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 12,
  },
  myEstimateCard: {
    backgroundColor: "#dbeafe",
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  estimateAmount: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1f2937",
  },
  estimateContractor: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  estimateNotes: {
    fontSize: 14,
    marginBottom: 4,
    color: "#374151",
  },
  estimateTimeline: {
    fontSize: 14,
    color: "#6b7280",
  },
  acceptedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  acceptedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
