import { useCallback, useEffect, useReducer, useRef } from "react";
import { api } from "../lib/api";
import type {
  Conversation,
  Message,
  UserInfo,
} from "../types/chat";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  streaming: boolean;
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
      type: "STREAM_PREAMBLE";
      conversationId: string;
      userMessage: Message;
      assistantMessageId: string;
      isNew: boolean;
    }
  | { type: "STREAM_DELTA"; text: string }
  | { type: "STREAM_DONE"; metadata: Message["metadata"] }
  | { type: "SEND_FAILED"; optimisticId: string }
  | { type: "REMOVE_CONVERSATION"; id: string }
  | { type: "UPDATE_FEEDBACK"; messageId: string; feedback: { rating: number } | null }
  | { type: "LOADED" };

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  loading: true,
  sending: false,
  streaming: false,
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
      // Don't overwrite messages while streaming or sending — the active
      // session has fresher data than the initial fetch / conversation reload.
      if (state.sending || state.streaming) return state;
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

    case "STREAM_PREAMBLE": {
      // Replace optimistic user message with real one, add empty assistant message
      const withoutOptimistic = state.messages.filter(
        (m) => !m.id.startsWith("optimistic-"),
      );
      const assistantMessage: Message = {
        id: action.assistantMessageId,
        role: "ASSISTANT",
        content: "",
        createdAt: new Date().toISOString(),
      };

      let conversations = state.conversations;
      if (action.isNew) {
        const newConv: Conversation = {
          id: action.conversationId,
          title: action.userMessage.content.substring(0, 60),
          createdAt: action.userMessage.createdAt,
          updatedAt: action.userMessage.createdAt,
        };
        conversations = [newConv, ...conversations];
      } else {
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
        messages: [...withoutOptimistic, action.userMessage, assistantMessage],
        conversations,
        sending: false,
        streaming: true,
      };
    }

    case "STREAM_DELTA": {
      // Append text to the last (assistant) message
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "ASSISTANT") {
        msgs[msgs.length - 1] = {
          ...last,
          content: last.content + action.text,
        };
      }
      return { ...state, messages: msgs };
    }

    case "STREAM_DONE": {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "ASSISTANT") {
        msgs[msgs.length - 1] = { ...last, metadata: action.metadata };
      }
      return { ...state, messages: msgs, streaming: false };
    }

    case "SEND_FAILED":
      return {
        ...state,
        messages: state.messages.filter(
          (m) => m.id !== action.optimisticId,
        ),
        sending: false,
        streaming: false,
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
    case "UPDATE_FEEDBACK":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.messageId ? { ...m, feedback: action.feedback } : m,
        ),
      };
    case "LOADED":
      return { ...state, loading: false };
    default:
      return state;
  }
}

const STORAGE_KEY = "harbor_active_conversation";

export function useChat() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const activeConvRef = useRef(state.activeConversationId);
  activeConvRef.current = state.activeConversationId;

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get("/api/user/me") as Promise<UserInfo>,
      api.get("/api/conversations") as Promise<{
        conversations: Conversation[];
      }>,
    ])
      .then(async ([userInfo, convData]) => {
        if (cancelled) return;

        dispatch({ type: "SET_USER_INFO", userInfo });
        dispatch({
          type: "SET_CONVERSATIONS",
          conversations: convData.conversations,
        });

        const savedId = localStorage.getItem(STORAGE_KEY);
        if (
          savedId &&
          convData.conversations.some((c) => c.id === savedId)
        ) {
          try {
            const data = (await api.get(
              `/api/conversations/${savedId}/messages`,
            )) as { messages: Message[] };
            if (!cancelled) {
              dispatch({ type: "SET_ACTIVE", id: savedId, messages: data.messages });
            }
          } catch {
            // Conversation may have been deleted
          }
        }

        if (!cancelled) {
          dispatch({ type: "LOADED" });
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({ type: "LOADED" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.loading) return;
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
      const optimisticId = `optimistic-${Date.now()}`;
      const isNew = !activeConvRef.current;
      let preambleReceived = false;

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
        // Try SSE streaming first
        let streamed = false;
        try {
          const res = await api.stream("/api/chat/stream", {
            message: text,
            conversationId: activeConvRef.current ?? undefined,
          });

          if (!res.body) throw new Error("No response body");

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === "[DONE]") continue;

              try {
                const event = JSON.parse(jsonStr);

                if (event.type === "preamble") {
                  preambleReceived = true;
                  dispatch({
                    type: "STREAM_PREAMBLE",
                    conversationId: event.data.conversationId,
                    userMessage: {
                      id: event.data.userMessageId,
                      role: "USER",
                      content: text,
                      createdAt: new Date().toISOString(),
                    },
                    assistantMessageId: event.data.assistantMessageId,
                    isNew,
                  });
                } else if (event.type === "delta") {
                  dispatch({ type: "STREAM_DELTA", text: event.text });
                } else if (event.type === "done") {
                  dispatch({ type: "STREAM_DONE", metadata: event.metadata });
                } else if (event.type === "error") {
                  dispatch({ type: "STREAM_DONE", metadata: undefined });
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }

          streamed = preambleReceived;
        } catch {
          // Streaming failed (CORS / network) — fall back below
        }

        // Fallback: non-streaming endpoint
        if (!streamed) {
          const data = (await api.post("/api/chat", {
            message: text,
            conversationId: activeConvRef.current ?? undefined,
          })) as {
            conversationId: string;
            userMessage: { id: string; role: string; content: string; createdAt: string };
            assistantMessage: { id: string; role: string; content: string; createdAt: string; metadata?: Message["metadata"] };
          };

          preambleReceived = true;
          dispatch({
            type: "STREAM_PREAMBLE",
            conversationId: data.conversationId,
            userMessage: {
              id: data.userMessage.id,
              role: "USER",
              content: text,
              createdAt: data.userMessage.createdAt,
            },
            assistantMessageId: data.assistantMessage.id,
            isNew,
          });
          dispatch({ type: "STREAM_DELTA", text: data.assistantMessage.content });
          dispatch({ type: "STREAM_DONE", metadata: data.assistantMessage.metadata });
        }

        if (!preambleReceived) {
          dispatch({ type: "SENDING", sending: false });
        }
      } catch {
        dispatch({ type: "SEND_FAILED", optimisticId });
      }
    },
    [],
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

  const submitFeedback = useCallback(
    async (messageId: string, rating: number) => {
      const currentMsg = state.messages.find((m) => m.id === messageId);
      const currentRating = currentMsg?.feedback?.rating;

      if (currentRating === rating) {
        dispatch({ type: "UPDATE_FEEDBACK", messageId, feedback: null });
        try {
          await api.delete(`/api/messages/${messageId}/feedback`);
        } catch {
          dispatch({ type: "UPDATE_FEEDBACK", messageId, feedback: { rating } });
        }
        return;
      }

      dispatch({ type: "UPDATE_FEEDBACK", messageId, feedback: { rating } });
      try {
        await api.post(`/api/messages/${messageId}/feedback`, { rating });
      } catch {
        dispatch({
          type: "UPDATE_FEEDBACK",
          messageId,
          feedback: currentRating ? { rating: currentRating } : null,
        });
      }
    },
    [state.messages],
  );

  return {
    ...state,
    selectConversation,
    sendMessage,
    deleteConversation,
    newConversation,
    submitFeedback,
  };
}
