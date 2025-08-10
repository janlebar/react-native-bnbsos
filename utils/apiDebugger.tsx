import { chatService } from "../api/chatapi";
import { useAuth } from "../lib/auth-context";

export interface DebugInfo {
  authContext: {
    user: any;
    isLoading: boolean;
  };
  apiConnection: {
    connected: boolean;
    authenticated: boolean;
    user?: any;
    error?: string;
  };
  sessionCheck: {
    success: boolean;
    user?: any;
    error?: string;
  };
  endpointTests: {
    conversations: any;
    contacts: any;
    unreadCount: any;
  };
}

export const useApiDebugger = () => {
  const auth = useAuth();

  const getDebugInfo = async (): Promise<DebugInfo> => {
    const debugInfo: DebugInfo = {
      authContext: {
        user: auth.user,
        isLoading: auth.isLoading,
      },
      apiConnection: {
        connected: false,
        authenticated: false,
      },
      sessionCheck: {
        success: false,
      },
      endpointTests: {
        conversations: null,
        contacts: null,
        unreadCount: null,
      },
    };

    try {
      // Test API connection
      const apiTest = await chatService.testApiConnection();
      debugInfo.apiConnection = apiTest;

      // Test session directly
      try {
        const sessionUser = await chatService.getCurrentUser();
        debugInfo.sessionCheck = {
          success: true,
          user: sessionUser,
        };
      } catch (error: any) {
        debugInfo.sessionCheck = {
          success: false,
          error: error.message,
        };
      }

      // Test specific endpoints
      try {
        const conversations = await chatService.getConversations();
        debugInfo.endpointTests.conversations = {
          success: true,
          count: conversations.length,
          data: conversations,
        };
      } catch (error: any) {
        debugInfo.endpointTests.conversations = {
          success: false,
          error: error.message,
        };
      }

      try {
        const contacts = await chatService.getContacts();
        debugInfo.endpointTests.contacts = {
          success: true,
          count: contacts.length,
          data: contacts,
        };
      } catch (error: any) {
        debugInfo.endpointTests.contacts = {
          success: false,
          error: error.message,
        };
      }

      try {
        const unreadCount = await chatService.getUnreadCount();
        debugInfo.endpointTests.unreadCount = {
          success: true,
          count: unreadCount,
        };
      } catch (error: any) {
        debugInfo.endpointTests.unreadCount = {
          success: false,
          error: error.message,
        };
      }
    } catch (error: any) {
      debugInfo.apiConnection.error = error.message;
    }

    return debugInfo;
  };

  const logDebugInfo = async () => {
    const info = await getDebugInfo();
    console.log("=== API Debug Info ===");
    console.log("Auth Context:", info.authContext);
    console.log("API Connection:", info.apiConnection);
    console.log("Session Check:", info.sessionCheck);
    console.log("Endpoint Tests:", info.endpointTests);
    console.log("=====================");
    return info;
  };

  return {
    getDebugInfo,
    logDebugInfo,
  };
};

// Helper function to test specific API endpoints
export const testApiEndpoint = async (
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any
) => {
  try {
    const response = await fetch(`http://localhost:3000/api${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for session cookies
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: await response.json().catch(() => null),
    };

    console.log(`API Test - ${method} ${endpoint}:`, result);
    return result;
  } catch (error: any) {
    console.error(`API Test Error - ${method} ${endpoint}:`, error);
    return {
      error: error.message,
    };
  }
};

// Test specific chat endpoints with detailed logging
export const testChatEndpoints = async () => {
  console.log("=== Testing Chat Endpoints ===");

  // Test session endpoint
  console.log("\n1. Testing /auth/session");
  const sessionResult = await testApiEndpoint("/auth/session");

  // Test conversations endpoint
  console.log("\n2. Testing /chat/conversations");
  const conversationsResult = await testApiEndpoint("/chat/conversations");

  // Test contacts endpoint
  console.log("\n3. Testing /chat/contacts");
  const contactsResult = await testApiEndpoint("/chat/contacts");

  // Test contacts with conversations endpoint
  console.log("\n4. Testing /chat/contacts/with-conversations");
  const contactsWithConvResult = await testApiEndpoint(
    "/chat/contacts/with-conversations"
  );

  // Test unread count endpoint
  console.log("\n5. Testing /chat/unread-count");
  const unreadResult = await testApiEndpoint("/chat/unread-count");

  console.log("\n=== Chat Endpoints Test Summary ===");
  console.log(
    "Session:",
    "status" in sessionResult ? sessionResult.status : "error",
    "data" in sessionResult ? sessionResult.data : sessionResult.error
  );
  console.log(
    "Conversations:",
    "status" in conversationsResult ? conversationsResult.status : "error",
    "data" in conversationsResult
      ? conversationsResult.data
      : conversationsResult.error
  );
  console.log(
    "Contacts:",
    "status" in contactsResult ? contactsResult.status : "error",
    "data" in contactsResult ? contactsResult.data : contactsResult.error
  );
  console.log(
    "Contacts with Conversations:",
    "status" in contactsWithConvResult
      ? contactsWithConvResult.status
      : "error",
    "data" in contactsWithConvResult
      ? contactsWithConvResult.data
      : contactsWithConvResult.error
  );
  console.log(
    "Unread Count:",
    "status" in unreadResult ? unreadResult.status : "error",
    "data" in unreadResult ? unreadResult.data : unreadResult.error
  );

  return {
    session: sessionResult,
    conversations: conversationsResult,
    contacts: contactsResult,
    contactsWithConversations: contactsWithConvResult,
    unreadCount: unreadResult,
  };
};

// Common API tests
export const runCommonApiTests = async () => {
  console.log("Running common API tests...");

  // Test session endpoint
  await testApiEndpoint("/auth/session");

  // Test chat endpoints (these will fail if not authenticated, which is expected)
  await testApiEndpoint("/chat/conversations");
  await testApiEndpoint("/chat/contacts");
  await testApiEndpoint("/chat/unread-count");

  console.log("Common API tests completed");
};
