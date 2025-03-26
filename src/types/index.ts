export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
}

export interface Citation {
  text: string;
  chunkId: string;
  metadata?: {
    fileName?: string;
    timestamp?: string;
  };
}

export interface ChatResponse {
  message: Message;
  success: boolean;
  error?: string;
}

export interface EmbeddingResponse {
  success: boolean;
  error?: string;
} 