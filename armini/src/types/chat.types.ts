export type Sender = 'user' | 'ai';

export interface Message {
  id: string;
  content: string;
  sender: Sender;
  timestamp: Date;
}

export interface SuggestionChip {
  id: string;
  label: string;
  prompt: string;
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
