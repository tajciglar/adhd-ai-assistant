import { useState, useCallback, useRef } from "react";
import Modal from "../shared/Modal";

interface ParsedEntry {
  category: string;
  title: string;
  content: string;
}

type DupStatus = "new" | "duplicate" | "similar";

interface DupResult {
  index: number;
  status: DupStatus;
  existingEntryId?: string;
  existingTitle?: string;
  existingCategory?: string;
}

interface SmartImportModalProps {
  saving: boolean;
  onParse: (
    documentText: string,
    moduleName?: string,
  ) => Promise<ParsedEntry[]>;
  onImport: (entries: ParsedEntry[]) => Promise<boolean>;
  onCheckDuplicates: (
    entries: { title: string; content?: string }[],
  ) => Promise<DupResult[]>;
  onClose: () => void;
}

type DupFilter = "all" | "new" | "duplicate" | "similar";

export default function SmartImportModal({
  saving,
  onParse,
  onImport,
  onCheckDuplicates,
  onClose,
}: SmartImportModalProps) {
  const [documentText, setDocumentText] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"input" | "review">("input");
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Duplicate detection state
  const [dupResults, setDupResults] = useState<DupResult[]>([]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [checkingDups, setCheckingDups] = useState(false);
  const [dupFilter, setDupFilter] = useState<DupFilter>("all");

  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(md|txt|text|markdown)$/i)) {
      setError("Unsupported file type. Use .md or .txt files.");
      return;
    }
    if (file.size > 500_000) {
      setError("File too large (max 500KB).");
      return;
    }
    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setDocumentText(text);
      // Auto-fill module name from filename if empty
      if (!moduleName) {
        const name = file.name
          .replace(/\.(md|txt|text|markdown)$/i, "")
          .replace(/[-_]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        setModuleName(name);
      }
    };
    reader.readAsText(file);
  }, [moduleName]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleParse = useCallback(async () => {
    if (!documentText.trim()) return;
    setParsing(true);
    setError("");
    try {
      const parsed = await onParse(
        documentText.trim(),
        moduleName.trim() || undefined,
      );
      if (parsed.length === 0) {
        setError(
          "No Q&A entries found. Make sure the document contains clear questions and answers.",
        );
        return;
      }
      setEntries(parsed);
      setStep("review");

      // Run duplicate check
      setCheckingDups(true);
      try {
        const results = await onCheckDuplicates(
          parsed.map((e) => ({ title: e.title, content: e.content })),
        );
        setDupResults(results);
        // Auto-exclude duplicates
        const autoExclude = new Set<number>();
        for (const r of results) {
          if (r.status === "duplicate") {
            autoExclude.add(r.index);
          }
        }
        setExcluded(autoExclude);
      } catch {
        // If dedup check fails, continue without it — entries default to "new"
      } finally {
        setCheckingDups(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to parse document. Try a shorter or more structured document.",
      );
    } finally {
      setParsing(false);
    }
  }, [documentText, moduleName, onParse, onCheckDuplicates]);

  const handleRemoveEntry = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setDupResults((prev) =>
      prev
        .filter((r) => r.index !== index)
        .map((r) => (r.index > index ? { ...r, index: r.index - 1 } : r)),
    );
    setExcluded((prev) => {
      const next = new Set<number>();
      for (const idx of prev) {
        if (idx < index) next.add(idx);
        else if (idx > index) next.add(idx - 1);
        // skip idx === index (removed)
      }
      return next;
    });
  }, []);

  const toggleExclude = useCallback((index: number) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleImport = useCallback(async () => {
    const toImport = entries.filter((_, i) => !excluded.has(i));
    if (toImport.length === 0) return;
    const success = await onImport(toImport);
    if (success) {
      onClose();
    }
  }, [entries, excluded, onImport, onClose]);

  const getDupStatus = (index: number): DupStatus => {
    const result = dupResults.find((r) => r.index === index);
    return result?.status ?? "new";
  };

  const getDupInfo = (index: number): DupResult | undefined => {
    return dupResults.find((r) => r.index === index);
  };

  const charCount = documentText.length;
  const wordEstimate = documentText.trim()
    ? documentText.trim().split(/\s+/).length
    : 0;

  const importableCount = entries.filter((_, i) => !excluded.has(i)).length;

  // Compute filter counts
  const newCount = entries.filter((_, i) => getDupStatus(i) === "new").length;
  const dupCount = entries.filter(
    (_, i) => getDupStatus(i) === "duplicate",
  ).length;
  const simCount = entries.filter(
    (_, i) => getDupStatus(i) === "similar",
  ).length;

  const filteredEntries = entries
    .map((entry, i) => ({ entry, index: i }))
    .filter(({ index }) => {
      if (dupFilter === "all") return true;
      return getDupStatus(index) === dupFilter;
    });

  return (
    <Modal onClose={onClose} ariaLabel="Smart Import" className="p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-harbor-text/10">
          <h3 className="text-lg font-semibold text-harbor-text">
            Smart Import
          </h3>
          <p className="text-xs text-harbor-text/40 mt-0.5">
            Upload or paste a document — AI splits it into knowledge base entries
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {step === "input" ? (
            <div className="space-y-4">
              {/* File upload zone */}
              <button
                type="button"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload document"
                className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? "border-harbor-accent bg-harbor-accent/5"
                    : fileName
                      ? "border-green-300 bg-green-50/50"
                      : "border-harbor-text/15 hover:border-harbor-text/30 hover:bg-harbor-bg/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.txt,.text,.markdown"
                  onChange={handleFileInput}
                  className="hidden"
                />
                {fileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-green-600 text-xl" aria-hidden="true">
                      description
                    </span>
                    <span className="text-sm font-medium text-harbor-text">
                      {fileName}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Clear selected file"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileName("");
                        setDocumentText("");
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          setFileName("");
                          setDocumentText("");
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }
                      }}
                      className="text-harbor-text/30 hover:text-red-500 ml-1 cursor-pointer"
                    >
                      ×
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-harbor-text/25 text-3xl mb-2" aria-hidden="true">
                      upload_file
                    </span>
                    <p className="text-sm text-harbor-text/50">
                      Drop a <span className="font-medium">.md</span> or{" "}
                      <span className="font-medium">.txt</span> file here, or
                      click to browse
                    </p>
                    <p className="text-xs text-harbor-text/30 mt-1">
                      Max 500KB — or paste content below
                    </p>
                  </>
                )}
              </button>

              <div>
                <label htmlFor="smart-module-name" className="block text-sm font-medium text-harbor-text/70 mb-1.5">
                  Category / Module Name{" "}
                  <span className="text-harbor-text/30">(optional — AI will auto-classify if empty)</span>
                </label>
                <input
                  id="smart-module-name"
                  type="text"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  placeholder="e.g. Chores & Routines, Discipline & Boundaries"
                  className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 text-harbor-text placeholder:text-harbor-text/30 focus:outline-none focus:border-harbor-accent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="smart-document-text" className="block text-sm font-medium text-harbor-text/70 mb-1.5">
                  Document Content
                </label>
                <textarea
                  id="smart-document-text"
                  value={documentText}
                  onChange={(e) => {
                    setDocumentText(e.target.value);
                    if (fileName) setFileName("");
                  }}
                  placeholder="Or paste your document content here... The AI will split it into sections, extract parent questions, and create knowledge base entries."
                  rows={12}
                  className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 text-harbor-text placeholder:text-harbor-text/30 focus:outline-none focus:border-harbor-accent transition-colors resize-y font-mono text-sm"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-harbor-text/30">
                    {wordEstimate.toLocaleString()} words &middot;{" "}
                    {charCount.toLocaleString()} chars
                  </p>
                  {charCount > 500000 && (
                    <p className="text-xs text-red-500">
                      Document too long (max 500,000 chars)
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-harbor-text/70">
                    <span className="font-medium">{entries.length}</span> Q&A
                    entries found
                    {moduleName && (
                      <>
                        {" "}
                        in module{" "}
                        <span className="font-medium">{moduleName}</span>
                      </>
                    )}
                  </p>
                  {checkingDups && (
                    <p className="text-xs text-harbor-text/40 mt-0.5">
                      Checking for duplicates...
                    </p>
                  )}
                  {!checkingDups && dupResults.length > 0 && (
                    <p className="text-xs text-harbor-text/40 mt-0.5">
                      {newCount} new · {dupCount} duplicate
                      {simCount > 0 && ` · ${simCount} similar`} ·{" "}
                      <span className="font-medium text-harbor-accent">
                        {importableCount} will be imported
                      </span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setStep("input");
                    setEntries([]);
                    setDupResults([]);
                    setExcluded(new Set());
                    setDupFilter("all");
                  }}
                  className="text-xs text-harbor-text/40 hover:text-harbor-text cursor-pointer"
                >
                  Back to edit
                </button>
              </div>

              {/* Filter tabs */}
              {!checkingDups && dupResults.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {(
                    [
                      { key: "all" as DupFilter, label: "All", count: entries.length },
                      { key: "new" as DupFilter, label: "New", count: newCount },
                      { key: "duplicate" as DupFilter, label: "Duplicates", count: dupCount },
                      { key: "similar" as DupFilter, label: "Similar", count: simCount },
                    ] as const
                  )
                    .filter((t) => t.count > 0)
                    .map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setDupFilter(t.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          dupFilter === t.key
                            ? "bg-harbor-accent/10 text-harbor-accent"
                            : "text-harbor-text/40 hover:text-harbor-text/60 hover:bg-harbor-bg"
                        }`}
                      >
                        {t.label}{" "}
                        <span className="opacity-60">({t.count})</span>
                      </button>
                    ))}
                </div>
              )}

              <div className="space-y-3">
                {filteredEntries.map(({ entry, index }) => {
                  const status = getDupStatus(index);
                  const info = getDupInfo(index);
                  const isExcluded = excluded.has(index);

                  return (
                    <div
                      key={index}
                      className={`border rounded-xl p-4 transition-colors ${
                        isExcluded
                          ? "border-harbor-text/5 bg-harbor-bg/50 opacity-50"
                          : "border-harbor-text/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-harbor-accent/10 text-harbor-accent text-xs font-medium">
                              {entry.category}
                            </span>
                            {/* Duplicate status badge */}
                            {!checkingDups && dupResults.length > 0 && (
                              <span
                                className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                                  status === "new"
                                    ? "bg-green-50 text-green-700"
                                    : status === "duplicate"
                                      ? "bg-red-50 text-red-600"
                                      : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {status === "new"
                                  ? "New"
                                  : status === "duplicate"
                                    ? "Duplicate"
                                    : "Similar"}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-medium text-harbor-text truncate">
                            {entry.title}
                          </h4>
                          {/* Show existing entry info for dups/similar */}
                          {info &&
                            (info.status === "duplicate" ||
                              info.status === "similar") &&
                            info.existingTitle && (
                              <p className="text-xs text-harbor-text/40 mt-0.5">
                                Matches:{" "}
                                <span className="italic">
                                  {info.existingTitle}
                                </span>
                                {info.existingCategory && (
                                  <span>
                                    {" "}
                                    in {info.existingCategory}
                                  </span>
                                )}
                              </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Include/exclude toggle for dups and similar */}
                          {!checkingDups &&
                            dupResults.length > 0 &&
                            (status === "duplicate" ||
                              status === "similar") && (
                              <button
                                onClick={() => toggleExclude(index)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                  isExcluded
                                    ? "bg-harbor-bg text-harbor-text/40 hover:bg-harbor-accent/10 hover:text-harbor-accent"
                                    : "bg-harbor-accent/10 text-harbor-accent hover:bg-red-50 hover:text-red-500"
                                }`}
                              >
                                {isExcluded ? "Include" : "Exclude"}
                              </button>
                            )}
                          <button
                            onClick={() => handleRemoveEntry(index)}
                            className="text-harbor-text/25 hover:text-red-500 transition-colors cursor-pointer text-lg leading-none"
                            aria-label="Remove this entry"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-harbor-text/50 line-clamp-3">
                        {entry.content}
                      </p>
                    </div>
                  );
                })}
              </div>

              {entries.length === 0 && (
                <div className="text-center py-8 text-harbor-text/30 text-sm">
                  All entries removed. Go back to re-parse or cancel.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-harbor-text/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-harbor-text/50 hover:text-harbor-text hover:bg-harbor-bg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {step === "input" ? (
            <button
              onClick={handleParse}
              disabled={
                !documentText.trim() || parsing || charCount > 500000
              }
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {parsing ? "Parsing with AI..." : "Parse Document"}
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={saving || importableCount === 0}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving
                ? "Importing..."
                : `Import ${importableCount} ${importableCount === 1 ? "Entry" : "Entries"}`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
