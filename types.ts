
export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
}

export interface LoggedInUser {
  username: string;
  team: string | null;
  isAdmin: boolean;
}

export enum ChatbotStyle {
  DETAILED_ASSISTANT = 'detailed_assistant',
  USER_FRIENDLY_SIMPLE = 'user_friendly_simple',
  STRUCTURED_OUTLINE_STYLE = 'structured_outline_style', // 새로운 스타일 추가
}

export interface UserCredentials {
  username: string;
  password?: string;
  team: string;
  lastLogin?: string; 
}

export interface AdvancedChatSettings {
  temperature: number; // 0.0 to 1.0
  topK: number; // integer, min 1
  topP: number; // 0.0 to 1.0
  maxOutputTokens: number; // integer, min 1
}

export interface DocumentSnapshot {
  id: string; // timestamp or unique id
  timestamp: string; // ISO string
  content: string;
  length: number;
}

export interface FAQEntry {
  id: string;
  keyword: string; // comma-separated keywords or a regex pattern string
  answer: string;
  createdAt: string; // ISO string
}

export const DEFAULT_ADVANCED_SETTINGS: AdvancedChatSettings = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};