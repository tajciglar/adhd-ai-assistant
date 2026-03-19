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
}

export default function ChatMessage({ message, streaming }: ChatMessageProps) {
  const isUser = message.role === "USER";

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
            {streaming && (
              <span className="inline-block w-0.5 h-4 bg-harbor-primary/60 animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        )}
        {!streaming && (
          <p
            className={`text-xs mt-1 ${
              isUser ? "text-white/50" : "text-harbor-text/30"
            }`}
          >
            {formatTime(message.createdAt)}
          </p>
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
