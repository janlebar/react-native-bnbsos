// types.ts - Updated for new chat system

// Legacy interfaces - kept for backward compatibility with API
export interface ChatMessage {
  id: number | string;
  text: string;
  date: string;
  subject?: string;
  read?: boolean;
  sender?: {
    id: string;
    name: string;
  };
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
}

// New chat system uses the interfaces from api/types.ts and the components handle their own local types
// The ChatMessage interface above is kept for compatibility with the current mock API structure
