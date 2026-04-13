import { useState, useCallback } from "react";
import type { KnowledgeEntry } from "../../types/admin";
import Modal from "../shared/Modal";

interface EntryEditorProps {
  entry: KnowledgeEntry | null; // null = create new
  categories?: string[];
  saving: boolean;
  defaultCategory?: string;
  onSave: (data: { category: string; title: string; content: string }) => void;
  onCancel: () => void;
  onClassify?: (
    title: string,
    content: string,
  ) => Promise<{ category: string; isNew: boolean } | null>;
}

export default function EntryEditor({
  entry,
  saving,
  defaultCategory = "",
  onSave,
  onCancel,
  onClassify,
}: EntryEditorProps) {
  const [category, setCategory] = useState(entry?.category ?? defaultCategory);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [classifying, setClassifying] = useState(false);

  const isValid = title.trim() && content.trim();
  const canClassify = title.trim().length > 0 && content.trim().length > 0;

  // Auto-classify when both title and content are filled and no category yet
  const handleClassify = useCallback(async () => {
    if (!onClassify || !canClassify) return;
    setClassifying(true);
    try {
      const result = await onClassify(title.trim(), content.trim());
      if (result) setCategory(result.category);
    } finally {
      setClassifying(false);
    }
  }, [onClassify, canClassify, title, content]);

  return (
    <Modal onClose={onCancel} ariaLabel={entry ? "Edit Entry" : "New Entry"} className="p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-harbor-text/10">
          <h3 className="text-lg font-semibold text-harbor-text">
            {entry ? "Edit Entry" : "New Entry"}
          </h3>
        </div>

        <div className="p-6 space-y-4">
          {/* Category shown as read-only chip if set; hidden when editing existing entry */}
          {category && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-harbor-text/50">Category:</span>
              <span className="text-xs font-medium bg-harbor-accent/10 text-harbor-accent px-2.5 py-1 rounded-full">
                {category}
              </span>
              {onClassify && !entry && (
                <button
                  onClick={handleClassify}
                  disabled={!canClassify || classifying}
                  className="text-xs text-harbor-text/40 hover:text-harbor-accent transition-colors disabled:opacity-30 cursor-pointer"
                  title="Re-classify with AI"
                >
                  {classifying ? "classifying…" : "re-classify"}
                </button>
              )}
            </div>
          )}

          <div>
            <label htmlFor="entry-title" className="block text-sm font-medium text-harbor-text/70 mb-1.5">
              Title / Question
            </label>
            <input
              id="entry-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How do I help my child stay organized?"
              className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 text-harbor-text placeholder:text-harbor-text/30 focus:outline-none focus:border-harbor-accent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="entry-content" className="block text-sm font-medium text-harbor-text/70 mb-1.5">
              Content
            </label>
            <textarea
              id="entry-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="The detailed content or answer..."
              rows={10}
              className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 text-harbor-text placeholder:text-harbor-text/30 focus:outline-none focus:border-harbor-accent transition-colors resize-y"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-harbor-text/10 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-harbor-text/50 hover:text-harbor-text hover:bg-harbor-bg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                category: category.trim(),
                title: title.trim(),
                content: content.trim(),
              })
            }
            disabled={!isValid || saving}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? "Saving..." : entry ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
