// src/api/chat.ts

export type Message = {
  id: string;
  senderId: string;
  sender: { name: string };
  receiverId: string;
  receiver: { name: string };
  content: string;
  createdAt: string;
  read: boolean;
};

// Fake messages database (in-memory)
const fakeUsers = [
  { id: "user-123", name: "Test User" },
  { id: "user-456", name: "Alice" },
  { id: "user-789", name: "Bob" },
];

const fakeMessages: Message[] = [
  {
    id: "msg-1",
    senderId: "user-123",
    sender: { name: "Test User" },
    receiverId: "user-456",
    receiver: { name: "Alice" },
    content: "Hey Alice, how’s it going?",
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
    read: true,
  },
  {
    id: "msg-2",
    senderId: "user-456",
    sender: { name: "Alice" },
    receiverId: "user-123",
    receiver: { name: "Test User" },
    content: "All good! What about you?",
    createdAt: new Date(Date.now() - 1800 * 1000).toISOString(), // 30 mins ago
    read: false,
  },
  {
    id: "msg-3",
    senderId: "user-789",
    sender: { name: "Bob" },
    receiverId: "user-123",
    receiver: { name: "Test User" },
    content: "Hey, are we still on for tomorrow?",
    createdAt: new Date(Date.now() - 600 * 1000).toISOString(), // 10 mins ago
    read: false,
  },
];

// Mock getMessages function
export const getMessages = async (userId: string): Promise<Message[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate latency

  // Return all messages where the user is either sender or receiver
  return fakeMessages.filter(
    (msg) => msg.senderId === userId || msg.receiverId === userId
  );
};
