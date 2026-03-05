interface AdminSidebarProps {
  activeSection: "knowledge" | "templates";
  onSectionChange: (section: "knowledge" | "templates") => void;
  categories: string[];
  entriesByCategory: Record<string, number>;
  activeFilter: string | null;
  totalEntries: number;
  totalTemplates: number;
  onFilterChange: (filter: string | null) => void;
  onAddEntry: () => void;
  onAddTemplate: () => void;
  onBackToChat: () => void;
  backToLabel?: string;
}

export default function AdminSidebar({
  activeSection,
  onSectionChange,
  categories,
  entriesByCategory,
  activeFilter,
  totalEntries,
  totalTemplates,
  onFilterChange,
  onAddEntry,
  onAddTemplate,
  onBackToChat,
  backToLabel = "Back to Chat",
}: AdminSidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-harbor-text/10 flex flex-col h-full">
      <div className="p-4 border-b border-harbor-text/10">
        <h2 className="text-lg font-bold text-harbor-primary mb-1">
          Admin Panel
        </h2>
        <p className="text-xs text-harbor-text/40">Knowledge Base</p>
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
      </div>

      <div className="p-3">
        {activeSection === "knowledge" ? (
          <button
            onClick={onAddEntry}
            className="w-full py-2.5 rounded-xl bg-harbor-accent text-white text-sm font-medium hover:bg-harbor-accent-light transition-colors cursor-pointer"
          >
            + Add Entry
          </button>
        ) : (
          <button
            onClick={onAddTemplate}
            className="w-full py-2.5 rounded-xl bg-harbor-accent text-white text-sm font-medium hover:bg-harbor-accent-light transition-colors cursor-pointer"
          >
            + Add Template
          </button>
        )}
      </div>

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
              <button
                key={cat}
                onClick={() => onFilterChange(cat)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                  activeFilter === cat
                    ? "bg-harbor-accent/10 text-harbor-accent font-medium"
                    : "text-harbor-text/70 hover:bg-harbor-bg"
                }`}
              >
                <span className="truncate block pr-8">{cat}</span>
                <span className="float-right text-xs text-harbor-text/30 -mt-5">
                  {entriesByCategory[cat] || 0}
                </span>
              </button>
            ))}
          </>
        ) : (
          <div className="px-4 py-2">
            <p className="text-xs text-harbor-text/50 leading-relaxed">
              Edit archetype report templates used by the report page and PDF/email generation.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-harbor-text/10">
        <button
          onClick={onBackToChat}
          className="w-full py-2 rounded-lg text-sm text-harbor-text/50 hover:text-harbor-text hover:bg-harbor-bg transition-colors cursor-pointer"
        >
          {backToLabel}
        </button>
      </div>
    </div>
  );
}
