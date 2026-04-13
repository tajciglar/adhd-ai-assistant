import { useState, useRef } from "react";
import Modal from "../shared/Modal";

interface ResourceUploadModalProps {
  uploading: boolean;
  categories: string[];
  onUpload: (formData: FormData) => Promise<void>;
  onClose: () => void;
}

export default function ResourceUploadModal({
  uploading,
  categories,
  onUpload,
  onClose,
}: ResourceUploadModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Downloadable Resources");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const effectiveCategory = isCustom ? customCategory.trim() : category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a PDF file");
      return;
    }
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!effectiveCategory) {
      setError("Category is required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", effectiveCategory);
    formData.append("file", file);

    try {
      await onUpload(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        return;
      }
      setFile(selected);
      setError("");
      if (!title) {
        setTitle(selected.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
      }
    }
  };

  return (
    <Modal onClose={onClose} ariaLabel="Upload PDF Resource">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b border-harbor-text/10">
          <h2 className="text-lg font-bold text-harbor-primary font-display">
            Upload PDF Resource
          </h2>
          <p className="text-xs text-harbor-text/50 mt-0.5">
            Upload a checklist, worksheet, or guide for parents
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File picker */}
          <div>
            <label htmlFor="resource-file" className="block text-sm font-medium text-harbor-text mb-1">
              PDF File
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-harbor-text/15 rounded-xl px-4 py-6 text-center cursor-pointer hover:border-harbor-orange/30 transition-colors"
            >
              {file ? (
                <p className="text-sm text-harbor-text">
                  {file.name}{" "}
                  <span className="text-harbor-text/40">
                    ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </p>
              ) : (
                <p className="text-sm text-harbor-text/40">
                  Click to select a PDF file (max 20 MB)
                </p>
              )}
            </button>
            <input
              ref={fileRef}
              id="resource-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label htmlFor="resource-title" className="block text-sm font-medium text-harbor-text mb-1">
              Title
            </label>
            <input
              id="resource-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Routine Checklist"
              className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/40"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="resource-description" className="block text-sm font-medium text-harbor-text mb-1">
              Description{" "}
              <span className="font-normal text-harbor-text/40">
                (helps the AI recommend this resource)
              </span>
            </label>
            <textarea
              id="resource-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g., Step-by-step morning routine checklist for ADHD children ages 5-10"
              className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/40 resize-none"
            />
          </div>

          {/* Category — dropdown with "create new" option */}
          <div>
            <label htmlFor="resource-category" className="block text-sm font-medium text-harbor-text mb-1">
              Folder / Category
            </label>
            {isCustom ? (
              <div className="flex gap-2">
                <input
                  id="resource-category"
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="New folder name..."
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/40"
                />
                <button
                  type="button"
                  onClick={() => { setIsCustom(false); setCustomCategory(""); }}
                  className="px-3 py-2 text-xs text-harbor-text/50 hover:text-harbor-text rounded-lg hover:bg-harbor-border"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                id="resource-category"
                value={category}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setIsCustom(true);
                  } else {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/40 bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {categories.length === 0 && (
                  <option value="Downloadable Resources">Downloadable Resources</option>
                )}
                <option value="__new__">+ Create new folder...</option>
              </select>
            )}
          </div>

          {error && (
            <p className="text-sm text-harbor-error">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-harbor-text/60 hover:bg-harbor-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !title.trim() || !effectiveCategory}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-harbor-primary text-white hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
