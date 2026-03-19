import { useEffect, useRef } from "react";
import type { Message } from "../../types/chat";
import ChatMessage from "./ChatMessage";
import Mascot from "../shared/Mascot";

interface ChatMessageListProps {
  messages: Message[];
  sending?: boolean;
  streaming?: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start mb-4">
      <Mascot size={32} mood="thinking" />
      <div className="bg-white text-harbor-text rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
        <p className="text-xs text-slate-400">Harbor is thinking...</p>
      </div>
    </div>
  );
}

export default function ChatMessageList({
  messages,
  sending,
  streaming,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastContent = messages[messages.length - 1]?.content;

  // Auto-scroll on new messages, while sending, and during streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending, lastContent]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} streaming={streaming && msg === messages[messages.length - 1] && msg.role === "ASSISTANT"} />
        ))}
        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
