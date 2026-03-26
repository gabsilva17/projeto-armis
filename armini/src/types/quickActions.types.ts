export type QuickActionType = 'navigate' | 'chat-prompt' | 'open-chat';

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  type: QuickActionType;
  /** Rota destino quando type === 'navigate' */
  route?: string;
  /** Prompt a enviar ao chat quando type === 'chat-prompt' */
  chatPrompt?: string;
}
