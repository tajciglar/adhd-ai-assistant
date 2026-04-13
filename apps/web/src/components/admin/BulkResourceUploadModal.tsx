import { useState, useRef } from "react";
import { api } from "../../lib/api";
import Modal from "../shared/Modal";

interface PreparedFile {
  filename: string;
  sizeBytes: number;
  title: string;
  description: string;
  category: string;
}

type Stage = "select" | "generating" | "review" | "uploading" | "done";

interface BulkResourceUploadModalProps {
  onClose: () => void;
  onComplete: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BulkResourceUploadModal({
  onClose,
  onComplete,
}: BulkResourceUploadModalProps) {
  const [stage, setStage] = useState<Stage>("select");
  const [files, setFiles] = useState<File[]>([]);
  const [prepared, setPrepared] = useState<PreparedFile[]>([]);
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<
    { filename: string; success: boolean; error?: string }[]
  >([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter(
      (f) => f.type === "application/pdf",
    );
    if (selected.length === 0) {
      setError("Please select PDF files");
      return;
    }
    setFiles(selected);
    setError("");
  };

  const handleGenerate = async () => {
    setStage("generating");
    setError("");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      const res = (await api.upload(
        "/api/admin/resources/bulk-prepare",
        formData,
      )) as { batchId: string; files: PreparedFile[] };

      setBatchId(res.batchId);
      setPrepared(res.files);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process files");
      setStage("select");
    }
  };

  const handleConfirm = async () => {
    setStage("uploading");
    setError("");

    try {
      const res = (await api.post("/api/admin/resources/bulk-confirm", {
        batchId,
        files: prepared.map((f) => ({
          filename: f.filename,
          title: f.title,
          description: f.description,
          category: f.category,
        })),
      })) as {
        results: { filename: string; success: boolean; error?: string }[];
      };

      setResults(res.results);
      setStage("done");
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStage("review");
    }
  };

  const updatePrepared = (
    index: number,
    field: "title" | "description" | "category",
    value: string,
  ) => {
    setPrepared((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const removePrepared = (index: number) => {
    setPrepared((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal onClose={onClose} ariaLabel="Bulk Upload PDFs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-harbor-text/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-harbor-primary">
              Bulk Upload PDFs
            </h2>
            <p className="text-xs text-harbor-text/50 mt-0.5">
              {stage === "select" && "Select multiple PDF files to upload"}
              {stage === "generating" && "AI is generating titles and descriptions..."}
              {stage === "review" && `Review ${prepared.length} files before uploading`}
              {stage === "uploading" && "Uploading and indexing..."}
              {stage === "done" && "Upload complete!"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close bulk upload"
            className="text-harbor-text/40 hover:text-harbor-text/60 p-1 rounded-lg hover:bg-harbor-bg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stage: Select Files */}
          {stage === "select" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Select PDF files"
                className="w-full border-2 border-dashed border-harbor-text/15 rounded-xl px-6 py-10 text-center cursor-pointer hover:border-harbor-accent/30 transition-colors"
              >
                <span className="material-symbols-outlined text-harbor-text/20 text-4xl mb-2 block" aria-hidden="true">
                  upload_file
                </span>
                <p className="text-sm text-harbor-text/60">
                  Click to select PDF files (multiple allowed)
                </p>
                <p className="text-xs text-harbor-text/30 mt-1">
                  Max 20 MB per file
                </p>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-harbor-text/60">
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                  </p>
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 bg-harbor-bg/50 rounded-lg text-sm"
                    >
                      <span className="text-harbor-text truncate">{f.name}</span>
                      <span className="text-harbor-text/40 text-xs shrink-0 ml-2">
                        {formatSize(f.size)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stage: Generating */}
          {stage === "generating" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-harbor-text/60">
                AI is analyzing {files.length} file{files.length !== 1 ? "s" : ""}...
              </p>
              <p className="text-xs text-harbor-text/30 mt-1">
                Generating titles, descriptions, and categories
              </p>
            </div>
          )}

          {/* Stage: Review */}
          {stage === "review" && (
            <div className="space-y-4">
              {prepared.map((file, i) => (
                <div
                  key={i}
                  className="border border-harbor-text/10 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-harbor-accent text-[18px]">
                        picture_as_pdf
                      </span>
                      <span className="text-xs text-harbor-text/40">
                        {file.filename} · {formatSize(file.sizeBytes)}
                      </span>
                    </div>
                    <button
                      onClick={() => removePrepared(i)}
                      className="text-xs text-harbor-error/60 hover:text-harbor-error cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-harbor-text/60 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={file.title}
                      onChange={(e) => updatePrepared(i, "title", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:border-harbor-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-harbor-text/60 mb-1">
                      Description
                    </label>
                    <textarea
                      value={file.description}
                      onChange={(e) =>
                        updatePrepared(i, "description", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-1.5 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:border-harbor-accent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-harbor-text/60 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={file.category}
                      onChange={(e) => updatePrepared(i, "category", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-harbor-text/15 text-sm focus:outline-none focus:border-harbor-accent"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stage: Uploading */}
          {stage === "uploading" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-harbor-text/60">
                Uploading {prepared.length} files and indexing for search...
              </p>
            </div>
          )}

          {/* Stage: Done */}
          {stage === "done" && (
            <div className="space-y-3">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    r.success
                      ? "bg-harbor-success/10 text-harbor-success"
                      : "bg-harbor-error/10 text-harbor-error"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {r.success ? "check_circle" : "error"}
                  </span>
                  <span className="text-sm flex-1">{r.filename}</span>
                  {r.error && (
                    <span className="text-xs opacity-70">{r.error}</span>
                  )}
                </div>
              ))}
              <p className="text-xs text-harbor-text/40 text-center mt-2">
                {results.filter((r) => r.success).length} of {results.length}{" "}
                uploaded successfully
              </p>
            </div>
          )}

          {error && <p className="text-sm text-harbor-error mt-3">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-harbor-text/10 flex justify-end gap-3 shrink-0">
          {stage === "select" && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-harbor-text/60 hover:bg-harbor-bg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={files.length === 0}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Metadata
              </button>
            </>
          )}

          {stage === "review" && (
            <>
              <button
                onClick={() => {
                  setStage("select");
                  setPrepared([]);
                }}
                className="px-4 py-2 rounded-lg text-sm text-harbor-text/60 hover:bg-harbor-bg transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={prepared.length === 0 || prepared.some((p) => !p.title.trim())}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload {prepared.length} File{prepared.length !== 1 ? "s" : ""}
              </button>
            </>
          )}

          {stage === "done" && (
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
