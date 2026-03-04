import { useState } from "react";
import type { KnowledgeEntry } from "../../types/admin";

interface EntryEditorProps {
  entry: KnowledgeEntry | null; // null = create new
  categories: string[];
  saving: boolean;
  onSave: (data: { category: string; title: string; content: string }) => void;
  onCancel: () => void;
}

export default function EntryEditor({
  entry,
  categories,
  saving,
  onSave,
  onCancel,
}: EntryEditorProps) {
  const [category, setCategory] = useState(entry?.category ?? "");
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");

  const isValid = category.trim() && title.trim() && content.trim();

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-harbor-text/10">
          <h3 className="text-lg font-semibold text-harbor-text">
            {entry ? "Edit Entry" : "New Entry"}
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-harbor-text/70 mb-1.5">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="category-suggestions"
              placeholder="e.g. Executive Function Skills"
              className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 text-harbor-text placeholder:text-harbor-text/30 focus:outline-none focus:border-harbor-accent transition-colors"
            />
            <datalist id="category-suggestions">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-harbor-text/70 mb-1.5">
              Title / Question
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How do I help my child stay organized?"
              className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 text-harbor-text placeholder:text-harbor-text/30 focus:outline-none focus:border-harbor-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-harbor-text/70 mb-1.5">
              Content
            </label>
            <textarea
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
    </div>
  );
}
