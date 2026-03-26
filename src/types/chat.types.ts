export type Sender = 'user' | 'ai';

export type ExpenseActionType = 'chat-expense' | 'photo-expense';

export interface MessageAction {
  id: string;
  label: string;
  icon: 'chat' | 'camera';
  actionType: ExpenseActionType;
}

export interface Message {
  id: string;
  content: string;
  imageUri?: string;
  sender: Sender;
  timestamp: Date;
  actions?: MessageAction[];
}

export interface SuggestionChip {
  id: string;
  label: string;
  prompt: string;
}

export interface AiResponsePayload {
  message: Message;
  suggestions: SuggestionChip[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR' };
