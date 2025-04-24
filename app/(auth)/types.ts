// Assuming something like this for ChatGroup:

export interface ChatGroup {
  receiverName: string;
  lastMessage?: ChatMessage;
}

// Hook return (you might need to refine this depending on your actual hook)
type ChatState = {
  selected?: string | number;
};

type SetChat = (chat: ChatState) => void;

declare function useChat(): [ChatState, SetChat];

// types.ts
export interface ChatMessage {
  id: number;
  text: string;
  date: string;
  subject?: string;
  sender?: {
    id: string;
    name: string;
  };
}

export interface ChatGroup {
  receiverId: string;
  receiverName: string;
  chats: ChatMessage[];
}
