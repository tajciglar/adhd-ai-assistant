import ReactMarkdown from "react-markdown";
import type { Message } from "../../types/chat";
import ResourceDownloadCard from "./ResourceDownloadCard";

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Matches [download:uuid:filename] markers injected by the AI
const DOWNLOAD_MARKER_RE = /\[download:([a-f0-9-]+):([^\]]+)\]/g;

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
  return /\[download:[a-f0-9-]+:[^\]]+\]/.test(content);
}

interface ChatMessageProps {
  message: Message;
  streaming?: boolean;
}

export default function ChatMessage({ message, streaming }: ChatMessageProps) {
  const isUser = message.role === "USER";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-harbor-primary text-white rounded-br-md"
            : "bg-white text-harbor-text rounded-bl-md shadow-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        ) : (
          <div className="chat-markdown leading-relaxed">
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
    </div>
  );
}
