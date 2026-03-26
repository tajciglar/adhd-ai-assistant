import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import type { KnowledgeEntry } from "../../types/admin";
import { api } from "../../lib/api";

const ALL_CATEGORIES = "__all__";
const MIN_SIDEBAR_WIDTH = 160;
const MAX_SIDEBAR_WIDTH = 360;
const DEFAULT_SIDEBAR_WIDTH = 200;

interface EntryListProps {
  entries: KnowledgeEntry[];
  onEdit: (entry: KnowledgeEntry) => void;
  onDelete: (id: string) => void;
  onBulkImport: () => void;
  onSmartImport: () => void;
  onTestQuery: () => void;
  onRefresh: () => void;
}

export default function EntryList({
  entries,
  onEdit,
  onDelete,
  onBulkImport,
  onSmartImport,
  onTestQuery,
  onRefresh,
}: EntryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Sidebar drag-to-resize
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_SIDEBAR_WIDTH);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, dragStartWidth.current + delta));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Category editing
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState("");
  const [renamingLoading, setRenamingLoading] = useState(false);

  // New category
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const cat = e.category || "Uncategorized";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let list = entries;
    if (selectedCategory !== ALL_CATEGORIES) {
      list = list.filter((e) => (e.category || "Uncategorized") === selectedCategory);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((entry) =>
      [entry.title, entry.category, entry.content].some((value) =>
        value?.toLowerCase().includes(q),
      ),
    );
  }, [entries, searchQuery, selectedCategory]);

  const startEditCategory = (name: string) => {
    setEditingCategory(name);
    setEditCategoryValue(name);
  };

  const saveRenameCategory = async () => {
    if (!editingCategory || !editCategoryValue.trim() || editCategoryValue.trim() === editingCategory) {
      setEditingCategory(null);
      return;
    }
    setRenamingLoading(true);
    try {
      await api.patch("/api/admin/entries/rename-category", {
        from: editingCategory,
        to: editCategoryValue.trim(),
      });
      if (selectedCategory === editingCategory) setSelectedCategory(editCategoryValue.trim());
      onRefresh();
    } finally {
      setRenamingLoading(false);
      setEditingCategory(null);
    }
  };

  const saveNewCategory = () => {
    // A new empty category is just a label in the sidebar — entries get assigned
    // when created/edited. We just switch to it so the user can see it's ready.
    const name = newCategoryName.trim();
    if (!name) { setIsAddingCategory(false); return; }
    setSelectedCategory(name);
    setIsAddingCategory(false);
    setNewCategoryName("");
  };

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* ── Folder Sidebar ── */}
      <div
        className="flex-shrink-0 border-r border-harbor-text/10 flex flex-col bg-harbor-bg/30 relative"
        style={{ width: sidebarWidth }}
      >
        <div className="px-3 py-3 border-b border-harbor-text/10 flex items-center justify-between gap-1">
          <p className="text-[10px] font-semibold text-harbor-text/40 uppercase tracking-wider">Categories</p>
          <button
            onClick={() => { setIsAddingCategory(true); setNewCategoryName(""); }}
            title="Add category"
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-harbor-accent/10 text-harbor-accent/60 hover:text-harbor-accent transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add</span>
          </button>
        </div>

        {/* New category input */}
        {isAddingCategory && (
          <div className="px-2 py-2 border-b border-harbor-text/10 space-y-1.5">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveNewCategory();
                if (e.key === "Escape") setIsAddingCategory(false);
              }}
              placeholder="Category name…"
              autoFocus
              className="w-full px-2 py-1.5 rounded-lg border border-harbor-text/15 text-xs focus:outline-none focus:ring-2 focus:ring-harbor-accent/30 focus:border-harbor-accent/40 bg-white"
            />
            <div className="flex gap-1">
              <button
                onClick={saveNewCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-medium bg-harbor-accent text-white hover:bg-harbor-accent/90 transition-colors cursor-pointer disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm">check</span>Add
              </button>
              <button
                onClick={() => setIsAddingCategory(false)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs text-harbor-text/60 hover:bg-harbor-bg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-1">
          {/* All */}
          <button
            onClick={() => setSelectedCategory(ALL_CATEGORIES)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
              selectedCategory === ALL_CATEGORIES
                ? "bg-harbor-accent/10 text-harbor-accent font-medium"
                : "text-harbor-text/70 hover:bg-harbor-bg hover:text-harbor-text"
            }`}
          >
            <span className="material-symbols-outlined text-lg">folder_open</span>
            <span className="flex-1 truncate">All Answers</span>
            <span className={`text-xs tabular-nums ${selectedCategory === ALL_CATEGORIES ? "text-harbor-accent/70" : "text-harbor-text/40"}`}>
              {entries.length}
            </span>
          </button>

          {/* Category rows */}
          {categories.map(({ name, count }) => (
            <div
              key={name}
              className={`group flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                selectedCategory === name
                  ? "bg-harbor-accent/10 text-harbor-accent font-medium"
                  : "text-harbor-text/70 hover:bg-harbor-bg hover:text-harbor-text"
              }`}
            >
              {editingCategory === name ? (
                <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editCategoryValue}
                    onChange={(e) => setEditCategoryValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRenameCategory();
                      if (e.key === "Escape") setEditingCategory(null);
                    }}
                    autoFocus
                    className="flex-1 min-w-0 px-1.5 py-0.5 rounded border border-harbor-accent/40 text-xs focus:outline-none bg-white text-harbor-text"
                  />
                  <button onClick={saveRenameCategory} disabled={renamingLoading} className="text-harbor-accent hover:text-harbor-accent/70 cursor-pointer">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                  <button onClick={() => setEditingCategory(null)} className="text-harbor-text/40 hover:text-harbor-text cursor-pointer">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined text-lg cursor-pointer flex-shrink-0"
                    onClick={() => setSelectedCategory(name)}
                  >folder</span>
                  <span
                    className="flex-1 truncate cursor-pointer"
                    onClick={() => setSelectedCategory(name)}
                  >{name}</span>
                  <span className={`text-xs tabular-nums ${selectedCategory === name ? "text-harbor-accent/70" : "text-harbor-text/40"}`}>
                    {count}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); startEditCategory(name); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-harbor-accent/10 text-harbor-text/30 hover:text-harbor-accent transition-all cursor-pointer flex-shrink-0"
                    title="Rename"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onDragStart}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-harbor-accent/30 transition-colors"
        />
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-harbor-text/10">
          <h3 className="text-sm font-semibold text-harbor-text">
            {selectedCategory === ALL_CATEGORIES
              ? `All Answers (${entries.length})`
              : `${selectedCategory} (${filteredEntries.length})`}
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
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                Turn Document Into Answers
              </span>
            </button>
            <button
              onClick={onBulkImport}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-harbor-accent/30 text-harbor-accent hover:bg-harbor-accent/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">upload_file</span>
                Import Spreadsheet
              </span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-6 py-3 border-b border-harbor-text/10">
          <div className="relative">
            <span className="material-symbols-outlined text-lg text-harbor-text/30 absolute left-3 top-1/2 -translate-y-1/2">search</span>
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
              {filteredEntries.length} result{filteredEntries.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-16">
            {searchQuery ? (
              <>
                <span className="material-symbols-outlined text-3xl text-harbor-text/20 mb-2 block">search_off</span>
                <p className="text-harbor-text/30 text-sm">No AI answers match your search</p>
                <p className="text-harbor-text/20 text-xs mt-1">Try a parent-facing phrase or category name</p>
              </>
            ) : (
              <>
                <p className="text-harbor-text/30 text-sm">No AI answers yet</p>
                <p className="text-harbor-text/20 text-xs mt-1">Add one manually or import them in bulk</p>
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
                      <h4 className="text-sm font-medium text-harbor-text truncate">{entry.title}</h4>
                      <p className="text-xs text-harbor-text/40 mt-1 line-clamp-2">{entry.content}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmingDeleteId(entry.id); }}
                      className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 rounded hover:bg-harbor-error/10 text-harbor-text/30 hover:text-harbor-error transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>

                {confirmingDeleteId === entry.id && (
                  <div className="px-6 py-3 bg-harbor-error/5 border-t border-harbor-error/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-harbor-error">
                      <span className="material-symbols-outlined text-lg">warning</span>
                      <span>Delete this AI answer? Harbor won&apos;t be able to reference it anymore.</span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setConfirmingDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-harbor-text/15 text-harbor-text/60 hover:bg-white transition-colors cursor-pointer"
                      >Cancel</button>
                      <button
                        onClick={() => { onDelete(entry.id); setConfirmingDeleteId(null); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-harbor-error text-white hover:bg-harbor-error/90 transition-colors cursor-pointer"
                      >Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
