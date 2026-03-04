import { useEffect, useRef } from "react";
import type { Message } from "../../types/chat";
import ChatMessage from "./ChatMessage";

interface ChatMessageListProps {
  messages: Message[];
  sending?: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white text-harbor-text rounded-2xl rounded-bl-md shadow-sm px-5 py-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-harbor-accent/40 animate-[bounce_1.2s_ease-in-out_infinite]" />
          <span className="w-2 h-2 rounded-full bg-harbor-accent/40 animate-[bounce_1.2s_ease-in-out_0.2s_infinite]" />
          <span className="w-2 h-2 rounded-full bg-harbor-accent/40 animate-[bounce_1.2s_ease-in-out_0.4s_infinite]" />
        </div>
      </div>
    </div>
  );
}

export default function ChatMessageList({
  messages,
  sending,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
