## Expo Chat - \"Invalid contractor ID\" Issue (Send Message from Contractor Detail)

### Summary
When the Expo app user taps **\"Send message\"** on a contractor detail page and then sends the first chat message, the backend returns:

```text
POST /api/chat/messages → 400 Bad Request
Error: "Invalid contractor ID"
```

The frontend is correctly calling the existing chat API (`POST /api/chat/messages`) with `sender_id` and `receiver_id`. The error is coming from the **Next.js backend**, specifically the `/api/chat/messages` handler that validates/derives the contractor ID.

This document explains **what the Expo app sends**, **what the Next.js API should do**, and **what needs to be implemented/adjusted in Next.js** to fix the issue.

---

## 1. What the Expo App Is Doing

### 1.1 From Contractor Detail → Chat

**File (Expo):** `app/(auth)/contractors/[id].tsx`

When the user taps the sticky **Send Message** button and is signed in, we navigate to `/chat` with these params:

- `receiverId = contractor.uid` (the contractor’s `User.id` from Better Auth / Next.js)
- `receiverName = contractor.name`
- `contractorId = contractor.id` (numeric contractor profile ID, sent as string in the route)

Conceptually:

```ts
router.push({
  pathname: "/chat",
  params: {
    receiverId: contractor.uid,      // contractor's user id (User.id)
    receiverName: contractor.name,
    contractorId: contractor.id.toString(), // numeric Contractor.id
  },
});
```

### 1.2 Chat Screen Behavior

**Files (Expo):**
- `app/(auth)/chat/index.tsx` (ChatPage)
- `app/(auth)/chat/components/ChatLayout.tsx`
- `app/(auth)/chat/components/RightPanel.tsx`
- `app/(auth)/chat/components/MessageInput.tsx`

Flow:

1. **ChatPage** reads route params:
   - `receiverId`, `receiverName`, `contractorId`
   - `contactId`, `conversationId` (when coming from contacts list)
2. If `contractorId` is present and there is already a conversation for that contractor, it jumps into that conversation (`/chat/[contactId]/[conversationId]`).
3. If no existing conversation is found, it enters **new chat mode**, passing:
   - `initialReceiverId = receiverId`  
   - `initialReceiverName = receiverName`  
   - `initialContractorId = contractorId`  
   into `ChatLayout` → `RightPanel` → `MessageInput`.
4. **MessageInput** is configured so that:
   - If `conversationId` is **undefined** and `receiverId` is set, calling `sendMessage` will create a **new conversation + first message**.

### 1.3 Payload Sent to `/api/chat/messages`

**File (Expo):** `api/chatapi.tsx` (`chatService.sendMessage`)  
**File (Expo):** `app/(auth)/chat/components/MessageInput.tsx`

When starting a new conversation:

```ts
// MessageInput.tsx
const message = await sendMessage(currentUserId, receiverId, content);
```

```ts
// chatapi.tsx (simplified)
async sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  conversationId?: string
) {
  const body: any = {
    text: content,
    sender_id: senderId,
    receiver_id: receiverId,
  };

  if (conversationId) {
    body.conversationId = conversationId;
  }

  // POST /api/chat/messages
  const response = await api.post("/api/chat/messages", body);
  return response.data;
}
```

So a **new chat** request from Expo looks like:

```json
{
  "text": "Hello!",
  "sender_id": "CURRENT_USER_ID",
  "receiver_id": "CONTRACTOR_USER_ID"
}
```

The backend then returns `400 { error: "Invalid contractor ID" }`.

---

## 2. What the Next.js API Needs to Do

### 2.1 Current Back-End Expectation (Inferred)

Based on the error message, the Next.js handler for `POST /api/chat/messages` is likely doing one of the following:

1. **Expecting a `contractorId` field** in the body and validating it, OR  
2. **Deriving `contractorId` from `receiver_id`**, and failing when it cannot find a matching contractor.

Since Expo only sends `sender_id` and `receiver_id`, the handler must be updated to **reliably map `receiver_id` to a contractor** (or accept an additional `contractorId` field from the client).

### 2.2 Required Back-End Logic

For `POST /api/chat/messages` (Next.js):

1. **Identify sender and receiver users** via `sender_id` and `receiver_id`.\n2. **Map the receiver to a contractor profile**:
   - Find a `Contractor` record whose `userId` (or equivalent field) matches `receiver_id`.\n3. **Validate contractor ID**:
   - If no contractor exists for that `receiver_id`, either:\n     - Return `404 { error: \"Contractor not found\" }`, or\n     - Accept that this is a regular user-to-user chat and adjust the logic accordingly.\n   - If a contractor is found, use its numeric `id` as `contractorId` in the conversation.\n4. **Create or reuse a conversation**:\n   - If `conversationId` is provided → append message to that conversation.\n   - If no `conversationId` but `receiver_id` is present →\n     - Search for an existing conversation between `sender_id` and that contractor.\n     - If found, append message.\n     - If not found, create a new conversation and then create the message.\n5. **Return a message object with `conversationId`** so the Expo app can update UI.\n\n---\n\n## 3. Concrete Changes to Implement in Next.js\n\n### 3.1 Update `/api/chat/messages` Handler\n\n**File (Next.js):** _something like_ `app/api/chat/messages/route.ts`\n\nKey implementation steps (pseudo-code):\n\n```ts\n// app/api/chat/messages/route.ts\n\nexport async function POST(req: NextRequest) {\n  try {\n    const { text, sender_id, receiver_id, conversationId } = await req.json();\n\n    if (!text || !sender_id || !receiver_id) {\n      return NextResponse.json(\n        { error: \"Missing required fields\" },\n        { status: 400 }\n      );\n    }\n\n    // 1) Resolve current user (sender) from auth\n    const currentUser = await getCurrentAuthUser(req);\n    if (!currentUser || currentUser.id !== sender_id) {\n      return NextResponse.json(\n        { error: \"Unauthorized\" },\n        { status: 401 }\n      );\n    }\n\n    // 2) Resolve contractor from receiver_id\n    const contractor = await prisma.contractor.findFirst({\n      where: {\n        user: { id: receiver_id }, // or where: { uid: receiver_id } depending on schema\n      },\n      include: {\n        user: true,\n      },\n    });\n\n    if (!contractor) {\n      // Either treat this as a regular user chat or return a clear error\n      return NextResponse.json(\n        { error: \"Contractor not found for given receiver_id\" },\n        { status: 400 }\n      );\n    }\n\n    const contractorId = contractor.id; // numeric Contractor.id\n\n    // 3) Determine or create conversation\n    let conversation;\n\n    if (conversationId) {\n      conversation = await prisma.conversation.findUnique({\n        where: { id: conversationId },\n      });\n\n      if (!conversation) {\n        return NextResponse.json(\n          { error: \"Conversation not found\" },\n          { status: 404 }\n        );\n      }\n    } else {\n      // No conversationId → try to find existing conversation between sender & contractor\n      conversation = await prisma.conversation.findFirst({\n        where: {\n          userId: sender_id,\n          contractorId,\n        },\n      });\n\n      if (!conversation) {\n        // Create new conversation\n        conversation = await prisma.conversation.create({\n          data: {\n            userId: sender_id,\n            contractorId,\n            subject: `Message to ${contractor.name ?? \"contractor\"}`,\n          },\n        });\n      }\n    }\n\n    // 4) Create chat message\n    const message = await prisma.chat.create({\n      data: {\n        text,\n        sender_id,\n        conversationId: conversation.id,\n      },\n    });\n\n    return NextResponse.json(\n      {\n        id: message.id,\n        text: message.text,\n        date: message.date,\n        sender_id: message.sender_id,\n        deleted: message.deleted,\n        read: message.read,\n        conversationId: conversation.id,\n      },\n      { status: 200 }\n    );\n  } catch (error) {\n    console.error(\"Error in POST /api/chat/messages:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n```\n\n**Important:** Adjust the Prisma model/field names to match your real schema:\n- Whether contractor links to `user` via `userId`, `uid`, etc.\n- The actual conversation and chat models.\n\n### 3.2 Stop Throwing Generic \"Invalid contractor ID\" for This Path\n\nIf the current implementation does something like:\n\n```ts\nif (!contractorId || isNaN(contractorId)) {\n  throw new Error(\"Invalid contractor ID\");\n}\n```\n\nand expects `contractorId` directly from the body, you have two options:\n\n1. **Preferred:** Use `receiver_id` to resolve the contractor as shown above.  
2. **Alternative:** Let the client send both `receiver_id` and `contractorId` in the body and validate them together:\n   - Confirm that the contractor with `id = contractorId` has a `user.id` equal to `receiver_id`.\n\nBut since the Expo client already provides `receiver_id` and the backend knows how to link users ↔ contractors, the first option is cleaner and matches how the web app (`chattwo`) works.\n\n### 3.3 Align Error Responses\n\nTo keep the Expo app error-handling friendly, standardize error shapes:\n\n- On invalid contractor lookup:\n  ```json\n  { \"error\": \"Contractor not found for given receiver_id\" }\n  ```\n- On missing required fields:\n  ```json\n  { \"error\": \"Missing required fields\" }\n  ```\n- On internal errors:\n  ```json\n  { \"error\": \"Internal server error\" }\n  ```\n\nThe Expo app already logs `error.response.data.error`, so keeping the `error` field consistent is helpful.\n\n---\n\n## 4. Checklist for Fix\n\n- [ ] Open `app/api/chat/messages/route.ts` (or equivalent) in the Next.js app.\n- [ ] Ensure the POST handler accepts and parses `text`, `sender_id`, and `receiver_id` from the body.\n- [ ] Implement contractor lookup based on `receiver_id` → `Contractor` (joining through User if needed).\n- [ ] Remove or adjust any strict `contractorId` parsing that doesn’t consider `receiver_id`.\n- [ ] Implement conversation resolution/creation logic as described.\n- [ ] Return a message JSON object that includes `conversationId` so the Expo client can update the UI.\n- [ ] Ensure error responses follow a consistent `{ error: string }` format.\n- [ ] Test with the Expo app:\n+  - Start a new chat from contractor detail and send a first message.\n+  - Verify the conversation is created and no longer returns `Invalid contractor ID`.\n+  - Send follow-up messages using the existing conversation.\n\n---\n\n## 5. Summary\n\n- The Expo app correctly calls `POST /api/chat/messages` with `sender_id` and `receiver_id`.\n- The **Next.js API currently rejects the request with `Invalid contractor ID`** because its contractor-resolution logic does not align with the mobile payload.\n- To fix this, **update the `/api/chat/messages` handler** to:\n+  - Resolve the contractor by `receiver_id` (contractor user id).\n+  - Create or reuse a conversation using that contractor.\n+  - Stop requiring a raw `contractorId` in the payload for the mobile flow, or derive it from `receiver_id`.\n- Once implemented, the Expo \"Send message\" button from contractor detail will start behaving exactly like the Next.js `SendMessageButton` on web, using the same chat backend.*** End Patch```}"/>