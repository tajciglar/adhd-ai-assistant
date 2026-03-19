import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../hooks/useChat";
import { useAuth } from "../../hooks/useAuth";
import ChatWelcome from "./ChatWelcome";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import BottomNav from "../dashboard/BottomNav";
import DesktopSidebar from "../dashboard/DesktopSidebar";
import LoadingScreen from "../shared/LoadingScreen";
import Mascot from "../shared/Mascot";
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

export default function ChatPage() {
  const {
    conversations,
    activeConversationId,
    messages,
    loading,
    sending,
    streaming,
    userInfo,
    selectConversation,
    sendMessage,
    deleteConversation,
    newConversation,
  } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();

  const rawChildName = userInfo?.profile?.childName ?? "";
  const childName = rawChildName
    ? rawChildName
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "";
  const isAdmin = userInfo?.role === "admin";

  const [showMobileHistory, setShowMobileHistory] = useState(false);

  const handleStarterClick = useCallback(
    (message: string) => sendMessage(message),
    [sendMessage],
  );

  if (loading) {
    return <LoadingScreen />;
  }

  const hasMessages = activeConversationId || messages.length > 0;

  return (
    <div className="h-screen flex bg-harbor-bg">
      {/* ── Desktop Sidebar (shared) with Conversation History ── */}
      <DesktopSidebar active="chat" isAdmin={isAdmin}>
        <div className="px-4 py-2 border-t border-harbor-primary/5 flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-2 px-3">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Conversations
            </h3>
            <button
              onClick={newConversation}
              className="text-slate-500 hover:bg-slate-100 rounded-lg p-1 cursor-pointer transition-colors"
              title="New Chat"
            >
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto flex-1 custom-scrollbar">
            {conversations.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">No conversations yet</p>
            )}
            {conversations.map((conv: Conversation) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
                  activeConversationId === conv.id
                    ? "bg-white text-harbor-primary border border-harbor-primary/25 shadow-sm"
                    : "bg-white/50 text-harbor-text/70 border border-harbor-orange/10 hover:bg-white hover:border-harbor-primary/15"
                }`}
                onClick={() => selectConversation(conv.id)}
              >
                <span className={`material-symbols-outlined text-lg ${activeConversationId === conv.id ? "text-harbor-primary" : "text-harbor-primary/60"}`}>chat_bubble</span>
                <div className="flex flex-col min-w-0 flex-1">
                  <p
                    className={`text-sm truncate ${
                      activeConversationId === conv.id ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {conv.title}
                  </p>
                  <p
                    className={`text-[11px] ${
                      activeConversationId === conv.id ? "text-harbor-primary/60" : "text-slate-400"
                    }`}
                  >
                    {activeConversationId === conv.id ? "Active now" : timeAgo(conv.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </DesktopSidebar>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-4 border-b border-harbor-primary/10 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Mascot size={40} />
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight text-harbor-primary font-display">
                Harbor
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Assistant Active
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={newConversation}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-harbor-primary/10 transition-colors"
              title="New Chat"
            >
              <span className="material-symbols-outlined text-harbor-primary/70 text-[22px]">add</span>
            </button>
            <button
              onClick={() => setShowMobileHistory(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-harbor-primary/10 transition-colors"
              title="Chat History"
            >
              <span className="material-symbols-outlined text-harbor-primary/70 text-[22px]">history</span>
            </button>
          </div>
        </header>

        {/* Mobile Conversation Drawer */}
        {showMobileHistory && (
          <div className="md:hidden fixed inset-0 z-50" onClick={() => setShowMobileHistory(false)}>
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="absolute right-0 top-0 bottom-0 w-72 bg-gradient-to-b from-harbor-bg-alt to-white shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-4 border-b border-harbor-orange/15 flex items-center justify-between">
                <h3 className="text-sm font-bold text-harbor-primary font-display">Conversations</h3>
                <button
                  onClick={() => setShowMobileHistory(false)}
                  className="p-1 rounded-lg hover:bg-harbor-primary/10 text-harbor-primary/60"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {conversations.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No conversations yet</p>
                ) : (
                  conversations.map((conv: Conversation) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        selectConversation(conv.id);
                        setShowMobileHistory(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        activeConversationId === conv.id
                          ? "bg-white text-harbor-primary border border-harbor-primary/20 shadow-sm"
                          : "bg-white/50 text-harbor-text/70 border border-harbor-orange/10 hover:bg-white"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[16px] ${activeConversationId === conv.id ? "text-harbor-primary" : "text-harbor-primary/50"}`}>chat_bubble</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate font-medium">{conv.title}</p>
                        <p className="text-[10px] text-slate-400">{timeAgo(conv.updatedAt)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Header */}
        <header className="hidden md:flex h-16 border-b border-harbor-primary/10 bg-white items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                className="w-full bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                placeholder="Search guides or chats"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">settings</span>
            </button>
            <div className="h-8 w-px bg-harbor-primary/10 mx-1" />
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-tight text-slate-900">
                  {childName ? `${childName}'s Parent` : user?.email?.split("@")[0] ?? "Parent"}
                </p>
                <p className="text-[10px] text-slate-500">Parent Member</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-harbor-primary/10 border-2 border-white shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-harbor-primary text-lg">person</span>
              </div>
            </button>
          </div>
        </header>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-harbor-bg">
          {hasMessages ? (
            <ChatMessageList messages={messages} sending={sending} streaming={streaming} />
          ) : (
            <ChatWelcome childName={childName} onStarterClick={handleStarterClick} />
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={sending || streaming} childName={childName} />

        {/* Mobile bottom spacing for nav */}
        <div className="md:hidden h-16" />
      </div>

      <BottomNav active="chat" isAdmin={isAdmin} />
    </div>
  );
}
