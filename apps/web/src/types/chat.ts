export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  metadata?: {
    model?: string;
    grounded?: boolean;
    latencyMs?: number;
    retrievalMs?: number;
    providerMs?: number;
    sourceCount?: number;
    promptChars?: number;
    errorCode?: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    sources?: Array<{
      entryId: string;
      title: string;
      category: string;
      chunkIndex: number;
      score: number;
    }>;
  };
  createdAt: string;
}

export interface UserInfo {
  id: string;
  email: string;
  role: string;
  profile: {
    childName: string;
    onboardingCompleted: boolean;
  };
}

export interface ChatResponse {
  conversationId: string;
  userMessage: Message;
  assistantMessage: Message;
}
