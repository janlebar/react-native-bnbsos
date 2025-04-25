// Assuming something like this for ChatGroup:

// types.ts

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

// Hook return (you might need to refine this depending on your actual hook)
type ChatState = {
  selected?: string | number;
};

type SetChat = (chat: ChatState) => void;

declare function useChat(): [ChatState, SetChat];
