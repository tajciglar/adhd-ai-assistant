import type { KnowledgeEntry } from "../../types/admin";

interface EntryListProps {
  entries: KnowledgeEntry[];
  onEdit: (entry: KnowledgeEntry) => void;
  onDelete: (id: string) => void;
  onBulkImport: () => void;
  onTestQuery: () => void;
}

export default function EntryList({
  entries,
  onEdit,
  onDelete,
  onBulkImport,
  onTestQuery,
}: EntryListProps) {
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
            Test Query
          </button>
          <button
            onClick={onBulkImport}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-harbor-text/15 text-harbor-text/70 hover:bg-harbor-bg transition-colors cursor-pointer"
          >
            Bulk Import
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-harbor-text/30 text-sm">No entries yet</p>
          <p className="text-harbor-text/20 text-xs mt-1">
            Add entries or use bulk import
          </p>
        </div>
      ) : (
        <div className="divide-y divide-harbor-text/5">
          {entries.map((entry) => (
            <div
              key={entry.id}
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
                    onDelete(entry.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 rounded hover:bg-harbor-error/10 text-harbor-text/30 hover:text-harbor-error transition-all cursor-pointer"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
