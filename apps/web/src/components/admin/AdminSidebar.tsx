import { useState, useRef } from "react";

export type AdminSection =
  | "overview"
  | "knowledge"
  | "resources"
  | "templates"
  | "analytics"
  | "token-usage"
  | "insights"
  | "feedback"
  | "users";

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  totalResources: number;
  totalTemplates: number;
  onAddTemplate: () => void;
  onBackToChat: () => void;
}

const sectionLabels: Record<AdminSection, string> = {
  overview: "Overview",
  knowledge: "AI Answers",
  resources: "Parent Downloads",
  templates: "Quiz Reports",
  analytics: "Quiz Funnel",
  "token-usage": "AI Costs",
  insights: "Parent Needs",
  feedback: "Answer Ratings",
  users: "Invite Clients",
};

const sectionIcons: Record<AdminSection, string> = {
  overview: "dashboard",
  knowledge: "psychology",
  resources: "folder_open",
  templates: "assignment",
  analytics: "bar_chart",
  "token-usage": "monitoring",
  insights: "insights",
  feedback: "thumb_down",
  users: "person_add",
};

function SidebarContent({
  activeSection,
  onSectionChange,
  totalResources,
  totalTemplates,
  onAddTemplate,
  onBackToChat,
  onCloseMobile,
}: AdminSidebarProps & { onCloseMobile?: () => void }) {
  const handleSectionClick = (section: AdminSection) => {
    onSectionChange(section);
    onCloseMobile?.();
  };

  const sections: { key: AdminSection; count?: number }[] = [
    { key: "overview" },
    { key: "knowledge" },
    { key: "resources", count: totalResources },
    { key: "templates", count: totalTemplates },
    { key: "analytics" },
    { key: "token-usage" },
    { key: "insights" },
    { key: "feedback" },
    { key: "users" },
  ];

  return (
    <div className="bg-white border-r border-harbor-text/10 flex flex-col h-full w-full shrink-0">
      <div className="p-4 border-b border-harbor-text/10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-harbor-primary font-display mb-1">
            Harbor Admin
          </h2>
          <p className="text-xs text-harbor-text/40">Manage content, files, and AI quality</p>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-lg text-harbor-text/40 hover:text-harbor-text hover:bg-harbor-bg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      <div className="p-3 pt-2 space-y-1">
        {sections.map(({ key, count }) => (
          <button
            key={key}
            onClick={() => handleSectionClick(key)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2.5 ${
              activeSection === key
                ? "bg-harbor-accent/10 text-harbor-accent font-medium"
                : "text-harbor-text/70 hover:bg-harbor-bg"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {sectionIcons[key]}
            </span>
            <span className="flex-1">{sectionLabels[key]}</span>
            {count !== undefined && (
              <span className="text-xs text-harbor-text/30">{count}</span>
            )}
          </button>
        ))}
      </div>

      {activeSection === "templates" && (
        <div className="p-3">
          <button
            onClick={onAddTemplate}
            className="w-full py-2.5 rounded-xl bg-harbor-primary text-white text-sm font-medium hover:opacity-90 transition-colors cursor-pointer"
          >
            + Add Report Template
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {activeSection === "overview" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              Start here for the main admin tasks. Use the sections below when you need to manage
              a specific part of Harbor.
            </p>
          </div>
        ) : activeSection === "knowledge" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              Write titles the way a parent would ask the question. Harbor uses these answers during chat.
            </p>
          </div>
        ) : activeSection === "resources" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              Upload PDF checklists, worksheets, and guides that Harbor can recommend to parents.
            </p>
          </div>
        ) : activeSection === "templates" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              Edit the templates used to generate post-quiz child reports.
            </p>
          </div>
        ) : activeSection === "analytics" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              View quiz completion, drop-off points, archetype distribution, and recent submissions.
            </p>
          </div>
        ) : activeSection === "token-usage" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              Monitor Gemini token usage and estimated spend across Harbor responses.
            </p>
          </div>
        ) : activeSection === "insights" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              See recurring parent needs, identify content gaps, and review topic trends.
            </p>
          </div>
        ) : activeSection === "feedback" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              Review liked and disliked answers to understand where Harbor is helping or missing.
            </p>
          </div>
        ) : null}
      </div>

      <div className="p-4 border-t border-harbor-text/10">
        <button
          onClick={onBackToChat}
          className="w-full py-2 rounded-lg text-sm text-harbor-text/50 hover:text-harbor-text hover:bg-harbor-bg transition-colors cursor-pointer"
        >
          Back to Chat
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar(props: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const dragging = useRef(false);

  const handleMouseDown = () => {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const newWidth = Math.max(200, Math.min(480, e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded-xl bg-white shadow-lg border border-harbor-text/10 text-harbor-primary hover:bg-harbor-bg transition-colors cursor-pointer"
        aria-label="Open admin menu"
      >
        <span className="material-symbols-outlined text-xl">menu</span>
      </button>

      {/* Desktop sidebar — resizable */}
      <div className="hidden md:flex relative" style={{ width: sidebarWidth }}>
        <div className="flex-1 overflow-hidden">
          <SidebarContent {...props} />
        </div>
        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-harbor-orange/30 active:bg-harbor-orange/50 transition-colors z-10"
        />
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-10 animate-slide-in-left">
            <SidebarContent
              {...props}
              onCloseMobile={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
