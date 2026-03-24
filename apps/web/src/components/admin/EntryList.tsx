import { useState, useMemo } from "react";
import type { KnowledgeEntry } from "../../types/admin";

interface EntryListProps {
  entries: KnowledgeEntry[];
  onEdit: (entry: KnowledgeEntry) => void;
  onDelete: (id: string) => void;
  onBulkImport: () => void;
  onSmartImport: () => void;
  onTestQuery: () => void;
}

export default function EntryList({
  entries,
  onEdit,
  onDelete,
  onBulkImport,
  onSmartImport,
  onTestQuery,
}: EntryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter((entry) =>
      [entry.title, entry.category, entry.content].some((value) =>
        value.toLowerCase().includes(q),
      ),
    );
  }, [entries, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-harbor-text/10">
        <h3 className="text-sm font-semibold text-harbor-text">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onTestQuery}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-harbor-accent/30 text-harbor-accent hover:bg-harbor-accent/5 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">quiz</span>
              Check AI Search
            </span>
          </button>
          <button
            onClick={onSmartImport}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-harbor-primary text-white hover:bg-harbor-primary/90 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">
                auto_awesome
              </span>
              Turn Document Into Answers
            </span>
          </button>
          <button
            onClick={onBulkImport}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-harbor-accent/30 text-harbor-accent hover:bg-harbor-accent/5 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">
                upload_file
              </span>
              Import Spreadsheet
            </span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-6 py-3 border-b border-harbor-text/10">
        <div className="relative">
          <span className="material-symbols-outlined text-lg text-harbor-text/30 absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, category, or answer text..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:ring-2 focus:ring-harbor-accent/30 focus:border-harbor-accent/40 bg-white placeholder:text-harbor-text/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-harbor-text/30 hover:text-harbor-text/60 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-harbor-text/40 mt-1.5">
            {filteredEntries.length} result
            {filteredEntries.length !== 1 ? "s" : ""} for "{searchQuery}"
          </p>
        )}
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-center py-16">
          {searchQuery ? (
            <>
              <span className="material-symbols-outlined text-3xl text-harbor-text/20 mb-2 block">
                search_off
              </span>
              <p className="text-harbor-text/30 text-sm">
                No AI answers match your search
              </p>
              <p className="text-harbor-text/20 text-xs mt-1">
                Try a parent-facing phrase or category name
              </p>
            </>
          ) : (
            <>
              <p className="text-harbor-text/30 text-sm">No AI answers yet</p>
              <p className="text-harbor-text/20 text-xs mt-1">
                Add one manually or import them in bulk
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="divide-y divide-harbor-text/5">
          {filteredEntries.map((entry) => (
            <div key={entry.id}>
              <div
                className="px-6 py-4 hover:bg-harbor-bg/50 transition-colors group cursor-pointer"
                onClick={() => onEdit(entry)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-harbor-accent/10 text-harbor-accent font-medium mb-1.5">
                      {entry.category}
                    </span>
                    <h4 className="text-sm font-medium text-harbor-text truncate">
                      {entry.title}
                    </h4>
                    <p className="text-xs text-harbor-text/40 mt-1 line-clamp-2">
                      {entry.content}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmingDeleteId(entry.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 rounded hover:bg-harbor-error/10 text-harbor-text/30 hover:text-harbor-error transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                  </button>
                </div>
              </div>

              {/* Inline delete confirmation */}
              {confirmingDeleteId === entry.id && (
                <div className="px-6 py-3 bg-harbor-error/5 border-t border-harbor-error/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-harbor-error">
                    <span className="material-symbols-outlined text-lg">
                      warning
                    </span>
                    <span>
                      Delete this AI answer? Harbor won&apos;t be able to reference it
                      anymore.
                    </span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setConfirmingDeleteId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-harbor-text/15 text-harbor-text/60 hover:bg-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onDelete(entry.id);
                        setConfirmingDeleteId(null);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-harbor-error text-white hover:bg-harbor-error/90 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
