import { useState, useRef, useCallback } from "react";
import { api } from "../../lib/api";

export type AdminSection = "knowledge" | "resources" | "templates" | "analytics" | "token-usage" | "insights";

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  categories: string[];
  entriesByCategory: Record<string, number>;
  activeFilter: string | null;
  totalEntries: number;
  totalResources: number;
  totalTemplates: number;
  onFilterChange: (filter: string | null) => void;
  onAddEntry: () => void;
  onAddTemplate: () => void;
  onBackToChat: () => void;
  onCategoryRenamed?: (oldName: string, newName: string) => void;
}

function EditableCategory({
  name,
  count,
  isActive,
  onClick,
  onRename,
}: {
  name: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  onRename: (oldName: string, newName: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setValue(name);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onRename(name, trimmed);
      setEditing(false);
    } catch {
      setValue(name);
      setEditing(false);
    }
    setSaving(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 px-4 py-1.5">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setValue(name);
              setEditing(false);
            }
          }}
          onBlur={handleSave}
          disabled={saving}
          className="flex-1 text-sm px-2 py-1 rounded-lg border border-harbor-orange/30 focus:ring-2 focus:ring-harbor-orange/20 outline-none bg-white min-w-0"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="group flex items-center">
      <button
        onClick={onClick}
        className={`flex-1 text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
          isActive
            ? "bg-harbor-accent/10 text-harbor-accent font-medium"
            : "text-harbor-text/70 hover:bg-harbor-bg"
        }`}
      >
        <span className="truncate block pr-8">{name}</span>
        <span className="float-right text-xs text-harbor-text/30 -mt-5">
          {count}
        </span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 mr-2 text-harbor-text/30 hover:text-harbor-orange transition-all cursor-pointer rounded"
        title="Rename category"
      >
        <span className="material-symbols-outlined text-[14px]">edit</span>
      </button>
    </div>
  );
}

export default function AdminSidebar({
  activeSection,
  onSectionChange,
  categories,
  entriesByCategory,
  activeFilter,
  totalEntries,
  totalResources,
  totalTemplates,
  onFilterChange,
  onAddEntry,
  onAddTemplate,
  onBackToChat,
  onCategoryRenamed,
}: AdminSidebarProps) {
  const [width, setWidth] = useState(256);
  const dragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    dragging.current = true;
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const newWidth = Math.max(200, Math.min(480, e.clientX));
      setWidth(newWidth);
    };
    const handleMouseUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleRenameCategory = async (oldName: string, newName: string) => {
    await api.patch("/api/admin/entries/rename-category", { oldName, newName });
    onCategoryRenamed?.(oldName, newName);
  };

  return (
    <div
      className="bg-white border-r border-harbor-text/10 flex flex-col h-full relative shrink-0"
      style={{ width }}
    >
      <div className="p-4 border-b border-harbor-text/10">
        <h2 className="text-lg font-bold text-harbor-primary font-display mb-1">
          Admin Panel
        </h2>
        <p className="text-xs text-harbor-text/40">Manage content & resources</p>
      </div>

      <div className="p-3 pt-2 space-y-2">
        <button
          onClick={() => onSectionChange("knowledge")}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
            activeSection === "knowledge"
              ? "bg-harbor-accent/10 text-harbor-accent font-medium"
              : "text-harbor-text/70 hover:bg-harbor-bg"
          }`}
        >
          Knowledge Entries
        </button>
        <button
          onClick={() => onSectionChange("resources")}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
            activeSection === "resources"
              ? "bg-harbor-accent/10 text-harbor-accent font-medium"
              : "text-harbor-text/70 hover:bg-harbor-bg"
          }`}
        >
          PDF Resources
          <span className="float-right text-xs text-harbor-text/30">
            {totalResources}
          </span>
        </button>
        <button
          onClick={() => onSectionChange("templates")}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
            activeSection === "templates"
              ? "bg-harbor-accent/10 text-harbor-accent font-medium"
              : "text-harbor-text/70 hover:bg-harbor-bg"
          }`}
        >
          Report Templates
          <span className="float-right text-xs text-harbor-text/30">
            {totalTemplates}
          </span>
        </button>
        <button
          onClick={() => onSectionChange("analytics")}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
            activeSection === "analytics"
              ? "bg-harbor-accent/10 text-harbor-accent font-medium"
              : "text-harbor-text/70 hover:bg-harbor-bg"
          }`}
        >
          Quiz Analytics
        </button>
        <button
          onClick={() => onSectionChange("token-usage")}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
            activeSection === "token-usage"
              ? "bg-harbor-accent/10 text-harbor-accent font-medium"
              : "text-harbor-text/70 hover:bg-harbor-bg"
          }`}
        >
          Token Usage
        </button>
        <button
          onClick={() => onSectionChange("insights")}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
            activeSection === "insights"
              ? "bg-harbor-accent/10 text-harbor-accent font-medium"
              : "text-harbor-text/70 hover:bg-harbor-bg"
          }`}
        >
          Conversation Insights
        </button>
      </div>

      {(activeSection === "knowledge" || activeSection === "templates") && (
        <div className="p-3">
          {activeSection === "knowledge" ? (
            <button
              onClick={onAddEntry}
              className="w-full py-2.5 rounded-xl bg-harbor-primary text-white text-sm font-medium hover:opacity-90 transition-colors cursor-pointer"
            >
              + Add Entry
            </button>
          ) : (
            <button
              onClick={onAddTemplate}
              className="w-full py-2.5 rounded-xl bg-harbor-primary text-white text-sm font-medium hover:opacity-90 transition-colors cursor-pointer"
            >
              + Add Template
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {activeSection === "knowledge" ? (
          <>
            <button
              onClick={() => onFilterChange(null)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                activeFilter === null
                  ? "bg-harbor-accent/10 text-harbor-accent font-medium"
                  : "text-harbor-text/70 hover:bg-harbor-bg"
              }`}
            >
              All Categories
              <span className="float-right text-xs text-harbor-text/30">
                {totalEntries}
              </span>
            </button>

            {categories.map((cat) => (
              <EditableCategory
                key={cat}
                name={cat}
                count={entriesByCategory[cat] || 0}
                isActive={activeFilter === cat}
                onClick={() => onFilterChange(cat)}
                onRename={handleRenameCategory}
              />
            ))}
          </>
        ) : activeSection === "resources" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              Upload PDF checklists, worksheets, and guides. The AI will recommend them to parents when relevant.
            </p>
          </div>
        ) : activeSection === "templates" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              Edit archetype report templates used by the report page and PDF/email generation.
            </p>
          </div>
        ) : activeSection === "analytics" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              View quiz funnel analytics, step dropoff rates, archetype distribution, and recent submissions.
            </p>
          </div>
        ) : activeSection === "token-usage" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              Monitor Gemini API token usage and estimated costs across all AI assistant responses.
            </p>
          </div>
        ) : activeSection === "insights" ? (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              See what parents ask about most, identify content gaps, and view patterns by archetype.
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

      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-harbor-orange/20 transition-colors"
      />
    </div>
  );
}
