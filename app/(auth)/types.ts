// types.ts

export interface Chat {
  id: number;
  text: string;
  date: string;
  subject?: string;
  read?: boolean;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
}

export interface ChatMessage {
  id: number;
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

export interface ChatGroup {
  receiverId: string;
  receiverName: string;
  chats: ChatMessage[];
  lastMessage: ChatMessage;
  unreadCount: number;
}

type ChatState = {
  selected?: string | number;
};

type SetChat = (chat: ChatState) => void;

declare function useChat(): [ChatState, SetChat];

// Default export the useChat hook if needed
export default useChat;
