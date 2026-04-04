export type Sender = 'user' | 'ai';

export type ExpenseActionType = 'chat-expense' | 'photo-expense';

export interface MessageAction {
  id: string;
  label: string;
  icon: 'chat' | 'camera';
  actionType: ExpenseActionType;
}

export interface ToolCallInfo {
  name: string;
  result?: string;
}

export interface Message {
  id: string;
  content: string;
  imageUri?: string;
  sender: Sender;
  timestamp: Date;
  actions?: MessageAction[];
  toolCall?: ToolCallInfo;
}

export interface SuggestionChip {
  id: string;
  label: string;
  prompt: string;
}

export interface ChatDropdownOption {
  label: string;
  value: string;
}

export interface ChatDropdown {
  id: string;
  label: string;
  options: ChatDropdownOption[];
}

export interface AiResponsePayload {
  message: Message;
  suggestions: SuggestionChip[];
  toolCallMessages: Message[];
  dropdown?: ChatDropdown;
}
