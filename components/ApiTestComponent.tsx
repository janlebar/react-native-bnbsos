import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { chatService } from "../api/chatapi";

const ApiTestComponent = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runApiTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await chatService.testApiConnection();
      setTestResults(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const contacts = await chatService.getContacts();
      setTestResults({ contacts, count: contacts.length });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const conversations = await chatService.getConversations();
      setTestResults({ conversations, count: conversations.length });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testContactsWithConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const contacts = await chatService.getContactsWithConversations();
      setTestResults({ contacts, count: contacts.length });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Test Component</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={runApiTest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test API Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testContacts}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Contacts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testConversations}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Conversations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testContactsWithConversations}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            Test Contacts with Conversations
          </Text>
        </TouchableOpacity>
      </View>

      {loading && <Text style={styles.loading}>Loading...</Text>}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error:</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {testResults && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          <Text style={styles.resultsText}>
            {JSON.stringify(testResults, null, 2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loading: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginVertical: 20,
  },
  errorContainer: {
    backgroundColor: "#FFE5E5",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D32F2F",
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: "#D32F2F",
  },
  resultsContainer: {
    backgroundColor: "#E8F5E8",
    padding: 15,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
  },
  resultsText: {
    fontSize: 12,
    color: "#2E7D32",
    fontFamily: "monospace",
  },
});

export default ApiTestComponent;
