import { useCallback, useEffect, useReducer } from "react";
import { api } from "../lib/api";
import type {
  Conversation,
  Message,
  UserInfo,
  ChatResponse,
} from "../types/chat";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  userInfo: UserInfo | null;
}

type Action =
  | { type: "SET_USER_INFO"; userInfo: UserInfo }
  | { type: "SET_CONVERSATIONS"; conversations: Conversation[] }
  | { type: "SET_MESSAGES"; messages: Message[] }
  | { type: "SET_ACTIVE"; id: string; messages: Message[] }
  | { type: "NEW_CONVERSATION" }
  | { type: "SENDING"; sending: boolean }
  | { type: "ADD_OPTIMISTIC_USER_MESSAGE"; message: Message }
  | {
      type: "MESSAGE_SENT";
      conversationId: string;
      userMessage: Message;
      assistantMessage: Message;
      isNew: boolean;
    }
  | { type: "SEND_FAILED"; optimisticId: string }
  | { type: "REMOVE_CONVERSATION"; id: string }
  | { type: "LOADED" };

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  loading: true,
  sending: false,
  userInfo: null,
};

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case "SET_USER_INFO":
      return { ...state, userInfo: action.userInfo };
    case "SET_CONVERSATIONS":
      return { ...state, conversations: action.conversations };
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    case "SET_ACTIVE":
      return {
        ...state,
        activeConversationId: action.id,
        messages: action.messages,
      };
    case "NEW_CONVERSATION":
      return { ...state, activeConversationId: null, messages: [] };
    case "SENDING":
      return { ...state, sending: action.sending };
    case "ADD_OPTIMISTIC_USER_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.message],
        sending: true,
      };
    case "MESSAGE_SENT": {
      // Replace the optimistic user message with the real one, add assistant message
      const withoutOptimistic = state.messages.filter(
        (m) => !m.id.startsWith("optimistic-"),
      );
      const newMessages = [
        ...withoutOptimistic,
        action.userMessage,
        action.assistantMessage,
      ];

      let conversations = state.conversations;
      if (action.isNew) {
        // Add the new conversation to the top
        const newConv: Conversation = {
          id: action.conversationId,
          title: action.userMessage.content.substring(0, 60),
          createdAt: action.userMessage.createdAt,
          updatedAt: action.userMessage.createdAt,
        };
        conversations = [newConv, ...conversations];
      } else {
        // Move conversation to top
        conversations = conversations
          .map((c) =>
            c.id === action.conversationId
              ? { ...c, updatedAt: new Date().toISOString() }
              : c,
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() -
              new Date(a.updatedAt).getTime(),
          );
      }

      return {
        ...state,
        activeConversationId: action.conversationId,
        messages: newMessages,
        conversations,
        sending: false,
      };
    }
    case "SEND_FAILED":
      return {
        ...state,
        messages: state.messages.filter(
          (m) => m.id !== action.optimisticId,
        ),
        sending: false,
      };
    case "REMOVE_CONVERSATION": {
      const conversations = state.conversations.filter(
        (c) => c.id !== action.id,
      );
      const isActive = state.activeConversationId === action.id;
      return {
        ...state,
        conversations,
        activeConversationId: isActive ? null : state.activeConversationId,
        messages: isActive ? [] : state.messages,
      };
    }
    case "LOADED":
      return { ...state, loading: false };
    default:
      return state;
  }
}

const STORAGE_KEY = "harbor_active_conversation";

export function useChat() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    Promise.all([
      api.get("/api/user/me") as Promise<UserInfo>,
      api.get("/api/conversations") as Promise<{
        conversations: Conversation[];
      }>,
    ])
      .then(async ([userInfo, convData]) => {
        dispatch({ type: "SET_USER_INFO", userInfo });
        dispatch({
          type: "SET_CONVERSATIONS",
          conversations: convData.conversations,
        });

        // Restore last active conversation from localStorage
        const savedId = localStorage.getItem(STORAGE_KEY);
        if (
          savedId &&
          convData.conversations.some((c) => c.id === savedId)
        ) {
          try {
            const data = (await api.get(
              `/api/conversations/${savedId}/messages`,
            )) as { messages: Message[] };
            dispatch({ type: "SET_ACTIVE", id: savedId, messages: data.messages });
          } catch {
            // Conversation may have been deleted — just show welcome
          }
        }

        dispatch({ type: "LOADED" });
      })
      .catch(() => {
        dispatch({ type: "LOADED" });
      });
  }, []);

  // Persist active conversation to localStorage (only after initial load)
  useEffect(() => {
    if (state.loading) return; // Don't wipe localStorage before restore completes
    if (state.activeConversationId) {
      localStorage.setItem(STORAGE_KEY, state.activeConversationId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.activeConversationId, state.loading]);

  const selectConversation = useCallback(async (id: string) => {
    try {
      const data = (await api.get(
        `/api/conversations/${id}/messages`,
      )) as { messages: Message[] };
      dispatch({ type: "SET_ACTIVE", id, messages: data.messages });
    } catch {
      // conversation may have been deleted
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      // Show the user message immediately (optimistic update)
      const optimisticId = `optimistic-${Date.now()}`;
      dispatch({
        type: "ADD_OPTIMISTIC_USER_MESSAGE",
        message: {
          id: optimisticId,
          role: "USER",
          content: text,
          createdAt: new Date().toISOString(),
        },
      });

      try {
        const data = (await api.post("/api/chat", {
          message: text,
          conversationId: state.activeConversationId ?? undefined,
        })) as ChatResponse;

        dispatch({
          type: "MESSAGE_SENT",
          conversationId: data.conversationId,
          userMessage: data.userMessage,
          assistantMessage: data.assistantMessage,
          isNew: !state.activeConversationId,
        });
      } catch {
        dispatch({ type: "SEND_FAILED", optimisticId });
      }
    },
    [state.activeConversationId],
  );

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/conversations/${id}`);
      dispatch({ type: "REMOVE_CONVERSATION", id });
    } catch {
      // ignore
    }
  }, []);

  const newConversation = useCallback(() => {
    dispatch({ type: "NEW_CONVERSATION" });
  }, []);

  return {
    ...state,
    selectConversation,
    sendMessage,
    deleteConversation,
    newConversation,
  };
}
