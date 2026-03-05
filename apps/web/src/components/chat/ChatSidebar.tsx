import type { Conversation } from "../../types/chat";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onReportClick: () => void;
  onAdminClick?: () => void;
  isAdmin: boolean;
  onSignOut: () => void;
}

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onReportClick,
  onAdminClick,
  isAdmin,
  onSignOut,
}: ChatSidebarProps) {
  return (
    <div className="w-72 bg-white border-r border-harbor-text/10 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-harbor-text/10">
        <h2 className="text-lg font-bold text-harbor-primary mb-3">Harbor</h2>
        <button
          onClick={onNew}
          className="w-full py-2.5 rounded-xl border border-harbor-text/15 text-harbor-text text-sm font-medium hover:bg-harbor-bg transition-colors cursor-pointer"
        >
          + New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 && (
          <p className="text-center text-harbor-text/30 text-sm py-8">
            No conversations yet
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center px-4 py-3 cursor-pointer transition-colors ${
              activeId === conv.id
                ? "bg-harbor-accent/10 border-r-2 border-harbor-accent"
                : "hover:bg-harbor-bg"
            }`}
            onClick={() => onSelect(conv.id)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-harbor-text truncate">{conv.title}</p>
              <p className="text-xs text-harbor-text/30 mt-0.5">
                {timeAgo(conv.updatedAt)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 shrink-0 ml-2 p-1 rounded hover:bg-harbor-error/10 text-harbor-text/30 hover:text-harbor-error transition-all cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Footer — aligned with ChatInput bar */}
      <div className="px-4 py-3 border-t border-harbor-text/10 space-y-2 flex flex-col justify-center min-h-[75px]">
        <button
          onClick={onReportClick}
          className="w-full py-2 rounded-lg text-sm text-harbor-text/50 hover:text-harbor-text hover:bg-harbor-bg transition-colors cursor-pointer"
        >
          View Report
        </button>
        {isAdmin && onAdminClick && (
          <button
            onClick={onAdminClick}
            className="w-full py-2 rounded-lg text-sm text-harbor-text/50 hover:text-harbor-text hover:bg-harbor-bg transition-colors cursor-pointer"
          >
            Admin Panel
          </button>
        )}
        <button
          onClick={onSignOut}
          className="w-full py-2 rounded-lg text-sm text-harbor-text/30 hover:text-harbor-error hover:bg-harbor-error/5 transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
