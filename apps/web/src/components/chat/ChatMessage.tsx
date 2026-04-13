import { memo } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "../../types/chat";
import ResourceDownloadCard from "./ResourceDownloadCard";
import Mascot from "../shared/Mascot";

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Matches [download:id:filename] markers injected by the AI
// Permissive ID pattern to catch both UUIDs and any other ID format
const DOWNLOAD_MARKER_RE = /\[download:([^\]:]+):([^\]]+)\]/g;

function renderContentWithResources(content: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  const re = new RegExp(DOWNLOAD_MARKER_RE.source, "g");
  while ((match = re.exec(content)) !== null) {
    const textBefore = content.slice(lastIndex, match.index);
    if (textBefore) {
      parts.push(
        <ReactMarkdown key={`md-${i}`}>{textBefore}</ReactMarkdown>,
      );
    }
    parts.push(
      <ResourceDownloadCard
        key={`dl-${i}`}
        resourceId={match[1]}
        filename={match[2]}
      />,
    );
    lastIndex = match.index + match[0].length;
    i++;
  }

  const remaining = content.slice(lastIndex);
  if (remaining) {
    parts.push(
      <ReactMarkdown key={`md-${i}`}>{remaining}</ReactMarkdown>,
    );
  }

  return parts;
}

function hasDownloadMarker(content: string): boolean {
  return /\[download:[^\]:]+:[^\]]+\]/.test(content);
}

interface ChatMessageProps {
  message: Message;
  streaming?: boolean;
  onFeedback?: (messageId: string, rating: number) => void;
}

function ChatMessage({ message, streaming, onFeedback }: ChatMessageProps) {
  const isUser = message.role === "USER";
  const isOptimistic = message.id.startsWith("optimistic-");
  const currentRating = message.feedback?.rating ?? null;

  // Hide empty assistant messages (streaming hasn't sent content yet)
  if (!isUser && !message.content && streaming) return null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {/* Mascot avatar for assistant messages */}
      {!isUser && (
        <div className="shrink-0 mr-2.5 mt-1">
          <Mascot size={36} mood={streaming ? "thinking" : "default"} />
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 ${
          isUser
            ? "bg-harbor-primary text-white rounded-[20px] rounded-br-md"
            : "bg-white text-harbor-text rounded-2xl rounded-bl-md border border-slate-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap" style={{ lineHeight: 1.6 }}>
            {message.content}
          </p>
        ) : (
          <div className="chat-markdown" style={{ lineHeight: 1.6 }}>
            {hasDownloadMarker(message.content)
              ? renderContentWithResources(message.content)
              : <ReactMarkdown>{message.content}</ReactMarkdown>}
          </div>
        )}
        {!streaming && (
          <div className={`flex items-center justify-between mt-1 ${isUser ? "" : "gap-3"}`}>
            <p
              className={`text-xs ${
                isUser ? "text-white/50" : "text-harbor-text/30"
              }`}
            >
              {formatTime(message.createdAt)}
            </p>
            {!isUser && !isOptimistic && onFeedback && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onFeedback(message.id, 1)}
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors ${
                    currentRating === 1
                      ? "text-harbor-primary"
                      : "text-harbor-text/25 hover:text-harbor-text/50"
                  }`}
                  aria-label="Helpful"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={currentRating === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth={currentRating === 1 ? 0 : 1.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                  </svg>
                </button>
                <button
                  onClick={() => onFeedback(message.id, -1)}
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors ${
                    currentRating === -1
                      ? "text-red-400"
                      : "text-harbor-text/25 hover:text-harbor-text/50"
                  }`}
                  aria-label="Not helpful"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={currentRating === -1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth={currentRating === -1 ? 0 : 1.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.367 13.75c-.806 0-1.533.446-2.031 1.08a9.041 9.041 0 0 1-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 0 0-.322 1.672V21a.75.75 0 0 1-.75.75 2.25 2.25 0 0 1-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282m0 0H4.372c-1.026 0-1.945-.694-2.054-1.715A12.137 12.137 0 0 1 2.25 12c0-2.848.992-5.464 2.649-7.521C5.287 3.997 5.886 3.75 6.504 3.75h2.497c.483 0 .964.078 1.423.23l3.114 1.04a4.501 4.501 0 0 0 1.423.23h1.294M7.498 15.25h2.252m8.346-8.75c-.083-.205-.173-.405-.27-.602-.197-.4.078-.898.523-.898h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 1.302-4.665 8.95 8.95 0 0 0-.654-3.375Z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Parent avatar for user messages */}
      {isUser && (
        <div className="shrink-0 ml-2.5 mt-1 w-8 h-8 rounded-full bg-harbor-primary/15 flex items-center justify-center">
          <span className="material-symbols-outlined text-harbor-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        </div>
      )}
    </div>
  );
}

export default memo(ChatMessage, (prev, next) => {
  // Re-render only when the message content/feedback changes or streaming flips on the last message
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.feedback?.rating === next.message.feedback?.rating &&
    prev.streaming === next.streaming &&
    prev.onFeedback === next.onFeedback
  );
});
