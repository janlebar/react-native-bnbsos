import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { chatService } from "../api/chatapi";
import { useAuth } from "../lib/auth-context";
import { testChatEndpoints } from "../utils/apiDebugger";
import runDebugScript from "../utils/debugScript";

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
}

export default function ApiTestComponent() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const runTest = async (
    testName: string,
    testFunction: () => Promise<any>
  ) => {
    try {
      const result = await testFunction();
      setTestResults((prev) => [
        ...prev,
        {
          test: testName,
          success: true,
          message: "Success",
          data: result,
        },
      ]);
    } catch (error: any) {
      setTestResults((prev) => [
        ...prev,
        {
          test: testName,
          success: false,
          message: error.message || "Test failed",
          data: null,
        },
      ]);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    // Test 1: API Connection and Authentication
    await runTest("API Connection & Auth", async () => {
      return await chatService.testApiConnection();
    });

    // Test 2: Get Current User
    await runTest("Get Current User", async () => {
      return await chatService.getCurrentUser();
    });

    // Test 3: Get Conversations (if authenticated)
    await runTest("Get Conversations", async () => {
      return await chatService.getConversations();
    });

    // Test 4: Get Contacts (if authenticated)
    await runTest("Get Contacts", async () => {
      return await chatService.getContacts();
    });

    // Test 5: Get Unread Count
    await runTest("Get Unread Count", async () => {
      return await chatService.getUnreadCount();
    });

    setIsLoading(false);
  };

  const runDetailedTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      console.log("Running detailed chat endpoint tests...");
      const results = await testChatEndpoints();

      // Add results to test results
      Object.entries(results).forEach(([endpoint, result]) => {
        const success = "status" in result && result.status === 200;
        setTestResults((prev) => [
          ...prev,
          {
            test: `${endpoint} Endpoint`,
            success,
            message: success
              ? "Success"
              : `Status: ${"status" in result ? result.status : "Error"}`,
            data: "data" in result ? result.data : result.error,
          },
        ]);
      });
    } catch (error: any) {
      setTestResults((prev) => [
        ...prev,
        {
          test: "Detailed Tests",
          success: false,
          message: error.message || "Detailed tests failed",
          data: null,
        },
      ]);
    }

    setIsLoading(false);
  };

  const runDebugScript = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      // Run the debug script in console
      await runDebugScript();

      setTestResults((prev) => [
        ...prev,
        {
          test: "Debug Script",
          success: true,
          message:
            "Debug script completed - check console for detailed results",
          data: null,
        },
      ]);
    } catch (error: any) {
      setTestResults((prev) => [
        ...prev,
        {
          test: "Debug Script",
          success: false,
          message: error.message || "Debug script failed",
          data: null,
        },
      ]);
    }

    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Test Component</Text>

      <View style={styles.authInfo}>
        <Text style={styles.subtitle}>Authentication Status:</Text>
        <Text style={styles.text}>
          {user
            ? `Signed in as: ${user.name} (${user.email})`
            : "Not signed in"}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={runAllTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Running Tests..." : "Run Basic Tests"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.detailedButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={runDetailedTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Running Tests..." : "Run Detailed Tests"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.debugButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={runDebugScript}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Running..." : "Run Debug Script"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.subtitle}>Test Results:</Text>
          {testResults.map((result, index) => (
            <View
              key={index}
              style={[
                styles.resultItem,
                result.success ? styles.success : styles.error,
              ]}
            >
              <Text style={styles.testName}>{result.test}</Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
              {result.data && (
                <Text style={styles.resultData}>
                  Data: {JSON.stringify(result.data, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  authInfo: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  detailedButton: {
    backgroundColor: "#34C759",
  },
  debugButton: {
    backgroundColor: "#FF9500",
  },
  clearButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultsContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
  },
  resultItem: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  success: {
    backgroundColor: "#d4edda",
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  error: {
    backgroundColor: "#f8d7da",
    borderLeftWidth: 4,
    borderLeftColor: "#dc3545",
  },
  testName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 5,
  },
  resultData: {
    fontSize: 12,
    fontFamily: "monospace",
    backgroundColor: "#f8f9fa",
    padding: 5,
    borderRadius: 3,
  },
});
