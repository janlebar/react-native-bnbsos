import { testChatEndpoints } from "./apiDebugger";

// Debug script to test API endpoints
export const runDebugScript = async () => {
  console.log("🔍 Starting API Debug Script...");
  console.log("=====================================");

  try {
    const results = await testChatEndpoints();

    console.log("\n📊 Debug Results Summary:");
    console.log("=====================================");

    // Check session
    const sessionResult = results.session;
    if ("status" in sessionResult && sessionResult.status === 200) {
      console.log("✅ Session: Authenticated");
      console.log("   User:", sessionResult.data?.user);
    } else {
      console.log("❌ Session: Not authenticated");
      console.log(
        "   Error:",
        "error" in sessionResult ? sessionResult.error : "Unknown error"
      );
    }

    // Check conversations
    const conversationsResult = results.conversations;
    if ("status" in conversationsResult && conversationsResult.status === 200) {
      const conversations = conversationsResult.data;
      console.log(`✅ Conversations: ${conversations?.length || 0} found`);
      if (conversations?.length > 0) {
        console.log("   Sample conversation:", conversations[0]);
      }
    } else {
      console.log("❌ Conversations: Failed to load");
      console.log(
        "   Status:",
        "status" in conversationsResult ? conversationsResult.status : "Error"
      );
      console.log(
        "   Error:",
        "error" in conversationsResult
          ? conversationsResult.error
          : "Unknown error"
      );
    }

    // Check contacts
    const contactsResult = results.contacts;
    if ("status" in contactsResult && contactsResult.status === 200) {
      const contacts = contactsResult.data;
      console.log(`✅ Contacts: ${contacts?.length || 0} found`);
      if (contacts?.length > 0) {
        console.log("   Sample contact:", contacts[0]);
      }
    } else {
      console.log("❌ Contacts: Failed to load");
      console.log(
        "   Status:",
        "status" in contactsResult ? contactsResult.status : "Error"
      );
      console.log(
        "   Error:",
        "error" in contactsResult ? contactsResult.error : "Unknown error"
      );
    }

    // Check unread count
    const unreadResult = results.unreadCount;
    if ("status" in unreadResult && unreadResult.status === 200) {
      console.log(`✅ Unread Count: ${unreadResult.data?.count || 0}`);
    } else {
      console.log("❌ Unread Count: Failed to load");
      console.log(
        "   Status:",
        "status" in unreadResult ? unreadResult.status : "Error"
      );
      console.log(
        "   Error:",
        "error" in unreadResult ? unreadResult.error : "Unknown error"
      );
    }

    console.log("\n🔧 Troubleshooting Tips:");
    console.log("=====================================");

    if ("status" in sessionResult && sessionResult.status !== 200) {
      console.log("1. Authentication Issue:");
      console.log("   - Check if user is properly signed in");
      console.log("   - Verify session cookies are being sent");
      console.log("   - Check NextAuth configuration");
    }

    if (
      "status" in conversationsResult &&
      conversationsResult.status === 200 &&
      conversationsResult.data?.length === 0
    ) {
      console.log("2. No Conversations Found:");
      console.log(
        "   - Check if conversations exist in database for current user"
      );
      console.log("   - Verify user ID matches conversations in database");
      console.log("   - Check database connection and queries");
    }

    if ("status" in conversationsResult && conversationsResult.status !== 200) {
      console.log("3. API Endpoint Issue:");
      console.log("   - Check if Next.js server is running on localhost:3000");
      console.log("   - Verify API route handlers are working");
      console.log("   - Check server logs for errors");
    }

    console.log("\n📝 Next Steps:");
    console.log("=====================================");
    console.log("1. Check the console above for detailed error messages");
    console.log("2. Verify your Next.js server is running");
    console.log("3. Check database for conversations data");
    console.log("4. Test API endpoints directly in browser/Postman");
    console.log("5. Check network tab in browser dev tools");
  } catch (error: any) {
    console.error("💥 Debug script failed:", error);
  }
};

// Export for use in components
export default runDebugScript;
