import { useState, useRef } from "react";

interface ResourceUploadModalProps {
  uploading: boolean;
  onUpload: (formData: FormData) => Promise<void>;
  onClose: () => void;
}

export default function ResourceUploadModal({
  uploading,
  onUpload,
  onClose,
}: ResourceUploadModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Downloadable Resources");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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

    const formData = new FormData();
    // Text fields MUST be appended before the file — @fastify/multipart
    // with request.file() only exposes fields that precede the file part.
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category.trim() || "Downloadable Resources");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b border-harbor-text/10">
          <h2 className="text-lg font-bold text-harbor-primary">
            Upload PDF Resource
          </h2>
          <p className="text-xs text-harbor-text/50 mt-0.5">
            Upload a checklist, worksheet, or guide for parents
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-harbor-text mb-1">
              PDF File
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-harbor-text/15 rounded-xl px-4 py-6 text-center cursor-pointer hover:border-harbor-accent/30 transition-colors"
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
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-harbor-text mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Routine Checklist"
              className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:border-harbor-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-harbor-text mb-1">
              Description{" "}
              <span className="font-normal text-harbor-text/40">
                (helps the AI recommend this resource)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g., Step-by-step morning routine checklist for ADHD children ages 5-10"
              className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:border-harbor-accent resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-harbor-text mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Downloadable Resources"
              className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:border-harbor-accent"
            />
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
              disabled={uploading || !file || !title.trim()}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
