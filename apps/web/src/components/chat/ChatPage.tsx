import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../hooks/useChat";
import { useAuth } from "../../hooks/useAuth";
import ChatSidebar from "./ChatSidebar";
import ChatWelcome from "./ChatWelcome";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";

export default function ChatPage() {
  const {
    conversations,
    activeConversationId,
    messages,
    loading,
    sending,
    userInfo,
    selectConversation,
    sendMessage,
    deleteConversation,
    newConversation,
  } = useChat();
  const { signOut } = useAuth();
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

  const handleStarterClick = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage],
  );

  if (loading) {
    return (
      <div className="h-screen bg-harbor-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-harbor-primary mb-2">
            Harbor
          </h1>
          <p className="text-harbor-text/40">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-harbor-bg">
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={selectConversation}
        onNew={newConversation}
        onDelete={deleteConversation}
        onReportClick={() => navigate("/report")}
        isAdmin={isAdmin}
        onAdminClick={() => navigate("/admin")}
        onSignOut={signOut}
      />

      <div className="flex-1 flex flex-col">
        {activeConversationId || messages.length > 0 ? (
          <>
            <ChatMessageList messages={messages} sending={sending} />
            <ChatInput
              onSend={sendMessage}
              disabled={sending}
              childName={childName}
            />
          </>
        ) : (
          <>
            <ChatWelcome
              childName={childName}
              onStarterClick={handleStarterClick}
            />
            <ChatInput
              onSend={sendMessage}
              disabled={sending}
              childName={childName}
            />
          </>
        )}
      </div>
    </div>
  );
}
