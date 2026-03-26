import { useState, useMemo } from "react";
import type { Resource } from "../../types/admin";

interface ResourceListProps {
  resources: Resource[];
  loading: boolean;
  onUpload: () => void;
  onBulkUpload: () => void;
  onDelete: (id: string) => void;
  onUpdate: (
    id: string,
    updates: { title?: string; description?: string; category?: string },
  ) => Promise<void>;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ALL_FOLDERS = "__all__";

function EditModal({
  resource,
  categories,
  onSave,
  onClose,
}: {
  resource: Resource;
  categories: string[];
  onSave: (updates: {
    title: string;
    description: string;
    category: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(resource.title);
  const [description, setDescription] = useState(resource.description);
  const [category, setCategory] = useState(resource.category);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCategoryChange = (value: string) => {
    if (value === "__create_new__") {
      setIsCreatingNew(true);
      setNewCategory("");
    } else {
      setIsCreatingNew(false);
      setCategory(value);
    }
  };

  const handleNewCategoryConfirm = () => {
    if (newCategory.trim()) {
      setCategory(newCategory.trim());
      setIsCreatingNew(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (isCreatingNew && !newCategory.trim()) {
      setError("Please enter a category name");
      return;
    }
    const finalCategory = isCreatingNew ? newCategory.trim() : category.trim();
    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        category: finalCategory,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b border-harbor-text/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-harbor-text">
              Edit Resource
            </h2>
            <p className="text-xs text-harbor-text/50 mt-0.5">
              {resource.originalName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-harbor-text/40 hover:text-harbor-text/70 p-1 rounded-lg hover:bg-harbor-bg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-harbor-text/70 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:ring-2 focus:ring-harbor-accent/30 focus:border-harbor-accent/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-harbor-text/70 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:ring-2 focus:ring-harbor-accent/30 focus:border-harbor-accent/40 resize-none"
              placeholder="Helps AI recommend this resource to parents"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-harbor-text/70 mb-1.5">
              Category
            </label>
            {isCreatingNew ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNewCategoryConfirm();
                    }
                  }}
                  placeholder="New category name"
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:ring-2 focus:ring-harbor-accent/30 focus:border-harbor-accent/40"
                />
                <button
                  type="button"
                  onClick={handleNewCategoryConfirm}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setCategory(resource.category);
                  }}
                  className="px-3 py-2 rounded-lg text-sm text-harbor-text/60 hover:bg-harbor-bg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:ring-2 focus:ring-harbor-accent/30 focus:border-harbor-accent/40 bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__create_new__">+ Create new...</option>
              </select>
            )}
          </div>

          {error && <p className="text-xs text-harbor-error">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-harbor-text/60 hover:bg-harbor-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FolderSidebar({
  categories,
  selectedFolder,
  resourceCountByCategory,
  totalCount,
  onSelectFolder,
  onCreateFolder,
  onDrop,
  dragOverFolder,
  onDragOver,
  onDragLeave,
  isCreatingFolder,
  newFolderName,
  onNewFolderNameChange,
  onNewFolderSave,
  onNewFolderCancel,
}: {
  categories: string[];
  selectedFolder: string;
  resourceCountByCategory: Record<string, number>;
  totalCount: number;
  onSelectFolder: (folder: string) => void;
  onCreateFolder: () => void;
  onDrop: (folder: string) => void;
  dragOverFolder: string | null;
  onDragOver: (folder: string) => void;
  onDragLeave: () => void;
  isCreatingFolder: boolean;
  newFolderName: string;
  onNewFolderNameChange: (name: string) => void;
  onNewFolderSave: () => void;
  onNewFolderCancel: () => void;
}) {
  return (
    <div className="w-[200px] flex-shrink-0 border-r border-harbor-text/10 flex flex-col bg-harbor-bg/30">
      <div className="px-3 py-3 border-b border-harbor-text/10">
        <p className="text-[10px] font-semibold text-harbor-text/40 uppercase tracking-wider">
          Folders
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {/* All Resources */}
        <button
          onClick={() => onSelectFolder(ALL_FOLDERS)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
            selectedFolder === ALL_FOLDERS
              ? "bg-harbor-accent/10 text-harbor-accent font-medium"
              : "text-harbor-text/70 hover:bg-harbor-bg hover:text-harbor-text"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            folder_open
          </span>
          <span className="flex-1 truncate">All Resources</span>
          <span
            className={`text-xs tabular-nums ${
              selectedFolder === ALL_FOLDERS
                ? "text-harbor-accent/70"
                : "text-harbor-text/40"
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Category folders */}
        {categories.map((cat) => {
          const isActive = selectedFolder === cat;
          const isDragOver = dragOverFolder === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectFolder(cat)}
              onDragOver={(e) => {
                e.preventDefault();
                onDragOver(cat);
              }}
              onDragLeave={onDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(cat);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                isDragOver
                  ? "bg-harbor-accent/20 ring-2 ring-harbor-accent/40 ring-inset"
                  : isActive
                    ? "bg-harbor-accent/10 text-harbor-accent font-medium"
                    : "text-harbor-text/70 hover:bg-harbor-bg hover:text-harbor-text"
              }`}
            >
              <span className="material-symbols-outlined text-lg">folder</span>
              <span className="flex-1 truncate">{cat}</span>
              <span
                className={`text-xs tabular-nums ${
                  isActive ? "text-harbor-accent/70" : "text-harbor-text/40"
                }`}
              >
                {resourceCountByCategory[cat] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Create Folder area */}
      <div className="px-3 py-3 border-t border-harbor-text/10">
        {isCreatingFolder ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => onNewFolderNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onNewFolderSave();
                if (e.key === "Escape") onNewFolderCancel();
              }}
              placeholder="Folder name..."
              autoFocus
              className="w-full px-2 py-1.5 rounded-lg border border-harbor-text/15 text-xs focus:outline-none focus:ring-2 focus:ring-harbor-accent/30 focus:border-harbor-accent/40 bg-white"
            />
            <div className="flex gap-1.5">
              <button
                onClick={onNewFolderSave}
                disabled={!newFolderName.trim()}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">
                  check
                </span>
                Save
              </button>
              <button
                onClick={onNewFolderCancel}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs text-harbor-text/60 hover:bg-harbor-bg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">
                  close
                </span>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onCreateFolder}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-harbor-accent/70 hover:text-harbor-accent hover:bg-harbor-accent/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">
              create_new_folder
            </span>
            <span>Create Folder</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function ResourceList({
  resources,
  loading,
  onUpload,
  onBulkUpload,
  onDelete,
  onUpdate,
}: ResourceListProps) {
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>(ALL_FOLDERS);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [draggingResourceId, setDraggingResourceId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    resources.forEach((r) => {
      if (r.category) cats.add(r.category);
    });
    return Array.from(cats).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [resources]);

  const resourceCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [resources]);

  const filteredResources = useMemo(() => {
    let result = resources;
    if (selectedFolder !== ALL_FOLDERS) {
      result = result.filter((r) => r.category === selectedFolder);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }
    return result;
  }, [resources, selectedFolder, searchQuery]);

  const handleCreateFolder = () => {
    setIsCreatingFolder(true);
    setNewFolderName("");
  };

  const handleNewFolderSave = () => {
    if (!newFolderName.trim()) return;
    // We don't persist empty folders -- they exist only when resources are in them.
    // So we just switch to the new name for UX continuity.
    setSelectedFolder(newFolderName.trim());
    setIsCreatingFolder(false);
    setNewFolderName("");
  };

  const handleNewFolderCancel = () => {
    setIsCreatingFolder(false);
    setNewFolderName("");
  };

  const handleFolderDrop = (targetCategory: string) => {
    setDragOverFolder(null);
    if (!draggingResourceId) return;
    const resource = resources.find((r) => r.id === draggingResourceId);
    if (!resource || resource.category === targetCategory) {
      setDraggingResourceId(null);
      return;
    }
    onUpdate(draggingResourceId, { category: targetCategory });
    setDraggingResourceId(null);
  };

  const isPdf = (filename: string) =>
    filename.toLowerCase().endsWith(".pdf");

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-harbor-text/40">
        Loading resources...
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Folder Sidebar */}
      <FolderSidebar
        categories={categories}
        selectedFolder={selectedFolder}
        resourceCountByCategory={resourceCountByCategory}
        totalCount={resources.length}
        onSelectFolder={setSelectedFolder}
        onCreateFolder={handleCreateFolder}
        onDrop={handleFolderDrop}
        dragOverFolder={dragOverFolder}
        onDragOver={setDragOverFolder}
        onDragLeave={() => setDragOverFolder(null)}
        isCreatingFolder={isCreatingFolder}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        onNewFolderSave={handleNewFolderSave}
        onNewFolderCancel={handleNewFolderCancel}
      />

      {/* Resource List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-harbor-text/10">
          <h3 className="text-sm font-semibold text-harbor-text">
            {selectedFolder === ALL_FOLDERS
              ? `All Resources (${resources.length})`
              : `${selectedFolder} (${filteredResources.length})`}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={onBulkUpload}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-harbor-accent/30 text-harbor-accent hover:bg-harbor-accent/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">
                  drive_folder_upload
                </span>
                Bulk Upload
              </span>
            </button>
            <button
              onClick={onUpload}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-harbor-orange text-white hover:bg-harbor-orange/90 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">
                  upload_file
                </span>
                Upload PDF
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
              placeholder="Search resources by title..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:ring-2 focus:ring-harbor-accent/30 focus:border-harbor-accent/40 bg-white placeholder:text-harbor-text/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-harbor-text/30 hover:text-harbor-text/60 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">
                  close
                </span>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-harbor-text/40 mt-1.5">
              {filteredResources.length} result
              {filteredResources.length !== 1 ? "s" : ""} for "{searchQuery}"
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredResources.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-harbor-text/40">
              <span className="material-symbols-outlined text-4xl mb-3 text-harbor-text/20">
                {searchQuery ? "search_off" : "folder_open"}
              </span>
              <p className="text-lg font-medium mb-1">
                {searchQuery
                  ? "No resources match your search"
                  : resources.length === 0
                    ? "No resources yet"
                    : "No resources in this folder"}
              </p>
              <p className="text-sm">
                {searchQuery
                  ? "Try a different search term"
                  : resources.length === 0
                    ? "Upload PDF checklists, worksheets, or guides for parents"
                    : "Drag resources here or upload new ones"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-harbor-text/5">
              {filteredResources.map((resource) => (
                <div key={resource.id}>
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDraggingResourceId(resource.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", resource.id);
                    }}
                    onDragEnd={() => {
                      setDraggingResourceId(null);
                      setDragOverFolder(null);
                    }}
                    className={`px-6 py-4 hover:bg-harbor-bg/50 transition-colors ${
                      draggingResourceId === resource.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Drag handle */}
                        <span className="material-symbols-outlined text-harbor-text/25 hover:text-harbor-text/50 cursor-grab active:cursor-grabbing mt-2.5 text-lg flex-shrink-0">
                          drag_indicator
                        </span>

                        {/* File icon */}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-0.5 ${
                            isPdf(resource.filename)
                              ? "bg-rose-50"
                              : "bg-harbor-accent/10"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-xl ${
                              isPdf(resource.filename)
                                ? "text-rose-500"
                                : "text-harbor-accent"
                            }`}
                          >
                            picture_as_pdf
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-medium text-harbor-text truncate">
                            {resource.title}
                          </p>
                          {resource.description && (
                            <p className="text-xs text-harbor-text/50 mt-0.5 line-clamp-1">
                              {resource.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-harbor-text/40">
                            <span className="bg-harbor-accent/10 text-harbor-accent px-2 py-0.5 rounded-full">
                              {resource.category}
                            </span>
                            <span>{resource.originalName}</span>
                            <span>{formatSize(resource.sizeBytes)}</span>
                            <span>{formatDate(resource.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setEditingResource(resource)}
                          className="p-1.5 rounded-lg text-harbor-accent/50 hover:text-harbor-accent hover:bg-harbor-accent/5 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => setConfirmingDeleteId(resource.id)}
                          className="p-1.5 rounded-lg text-harbor-error/50 hover:text-harbor-error hover:bg-harbor-error/5 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline delete confirmation */}
                  {confirmingDeleteId === resource.id && (
                    <div className="px-6 py-3 bg-harbor-error/5 border-t border-harbor-error/10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-harbor-error">
                        <span className="material-symbols-outlined text-lg">
                          warning
                        </span>
                        <span>
                          Delete this topic? Harbor won't be able to reference
                          it anymore.
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
                            onDelete(resource.id);
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
      </div>

      {/* Edit Modal */}
      {editingResource && (
        <EditModal
          resource={editingResource}
          categories={categories}
          onSave={(updates) => onUpdate(editingResource.id, updates)}
          onClose={() => setEditingResource(null)}
        />
      )}
    </div>
  );
}
