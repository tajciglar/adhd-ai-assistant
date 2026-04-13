import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import type { AdminImportJob } from "../../types/admin";
import Modal from "../shared/Modal";

interface ParsedRow {
  category: string;
  title: string;
  content: string;
}

function normalizeHeader(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickValue(
  row: Record<string, string>,
  normalizedAliases: string[],
): string {
  for (const [rawKey, rawValue] of Object.entries(row)) {
    if (!normalizedAliases.includes(normalizeHeader(rawKey))) {
      continue;
    }
    const value = String(rawValue ?? "").trim();
    if (value.length > 0) return value;
  }
  return "";
}

/** Derive a human-readable category name from a filename */
function categoryFromFilename(name: string): string {
  return name
    .replace(/\.(xlsx|xls|csv)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface BulkImportModalProps {
  saving: boolean;
  importJob: AdminImportJob | null;
  onImport: (
    entries: { category: string; title: string; content: string }[],
  ) => Promise<boolean>;
  onClearJob: () => void;
  onClose: () => void;
}

export default function BulkImportModal({
  saving,
  importJob,
  onImport,
  onClearJob,
  onClose,
}: BulkImportModalProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [categoryRenameValue, setCategoryRenameValue] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parseSpreadsheet = useCallback(
    (data: ArrayBuffer, filename: string): ParsedRow[] => {
      const bytes = new Uint8Array(data);
      const workbook = XLSX.read(bytes, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      const fallbackCategory = categoryFromFilename(filename);
      const parsed: ParsedRow[] = [];
      let lastCategory = "";

      for (const row of json) {
        const category =
          pickValue(row, ["topic", "category"]) || lastCategory || fallbackCategory;
        const title = pickValue(row, [
          "questionissue",
          "question",
          "title",
        ]);
        const rawContent = pickValue(row, [
          "content",
          "answer",
          "response",
          "body",
        ]);
        const content = rawContent || title;

        if (category && title && content) {
          lastCategory = category;
          parsed.push({ category, title, content });
        }
      }
      return parsed;
    },
    [],
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setError("");

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const buffer = evt.target?.result as ArrayBuffer;
          const parsed = parseSpreadsheet(buffer, file.name);

          if (parsed.length === 0) {
            setError(
              "No valid rows found. Expected columns: Topic and Question/Issue (Content optional).",
            );
            return;
          }

          setRows(parsed);
        } catch {
          setError("Failed to parse file. Please use .xlsx or .csv format.");
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [parseSpreadsheet],
  );

  const updateCategory = useCallback(
    (index: number, newCategory: string) => {
      setRows((prev) =>
        prev.map((row, i) => (i === index ? { ...row, category: newCategory } : row)),
      );
    },
    [],
  );

  const updateAllCategories = useCallback(
    (oldCategory: string, newCategory: string) => {
      setRows((prev) =>
        prev.map((row) =>
          row.category === oldCategory ? { ...row, category: newCategory } : row,
        ),
      );
    },
    [],
  );

  const handleImport = useCallback(async () => {
    const success = await onImport(rows);
    if (!success) return;
  }, [rows, onImport]);

  // Get unique categories for the summary chips
  const uniqueCategories = [...new Set(rows.map((r) => r.category))];
  const isImportActive = !!importJob;
  const isImportDone =
    importJob?.status === "completed" ||
    importJob?.status === "completed_with_errors" ||
    importJob?.status === "failed";
  const progressPercent = importJob
    ? Math.min(100, Math.round((importJob.processed / Math.max(importJob.total, 1)) * 100))
    : 0;

  return (
    <Modal onClose={onClose} ariaLabel="Import AI Answers" className="p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-harbor-text/10">
          <h3 className="text-lg font-semibold text-harbor-text">
            Import AI Answers
          </h3>
          <p className="text-xs text-harbor-text/40 mt-0.5">
            Upload a spreadsheet, review the rows, then publish them into Harbor
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {isImportActive ? (
            <div className="mx-auto max-w-xl py-8">
              <div className="rounded-2xl border border-harbor-text/10 bg-harbor-bg/40 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-harbor-text/40">
                      Import Status
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-harbor-text">
                      {importJob.status === "queued"
                        ? "Queued for processing"
                        : importJob.status === "processing"
                          ? "Import in progress"
                          : importJob.status === "completed"
                            ? "Import completed"
                            : importJob.status === "completed_with_errors"
                              ? "Completed with issues"
                              : "Import failed"}
                    </h4>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-harbor-text/50 border border-harbor-text/10">
                    {importJob.processed}/{importJob.total}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full transition-all ${
                      importJob.status === "failed"
                        ? "bg-harbor-error"
                        : importJob.status === "completed_with_errors"
                          ? "bg-harbor-orange"
                          : "bg-harbor-primary"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-harbor-text/35">Processed</p>
                    <p className="mt-1 text-lg font-semibold text-harbor-text">{importJob.processed}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-harbor-text/35">Added</p>
                    <p className="mt-1 text-lg font-semibold text-harbor-primary">{importJob.succeeded}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-harbor-text/35">Failed</p>
                    <p className="mt-1 text-lg font-semibold text-harbor-error">{importJob.failed}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-harbor-text/35">Total Rows</p>
                    <p className="mt-1 text-lg font-semibold text-harbor-text">{importJob.total}</p>
                  </div>
                </div>

                {importJob.error && (
                  <div className="mt-4 rounded-xl border border-harbor-error/15 bg-harbor-error/5 p-3 text-sm text-harbor-error">
                    {importJob.error}
                  </div>
                )}

                {!isImportDone && (
                  <p className="mt-4 text-sm text-harbor-text/55">
                    You can keep this window open while Harbor processes the import.
                  </p>
                )}

                {isImportDone && (
                  <div className="mt-4 rounded-xl border border-harbor-text/10 bg-white p-4 text-sm text-harbor-text/60">
                    {importJob.status === "completed"
                      ? "All rows were imported successfully."
                      : importJob.status === "completed_with_errors"
                        ? "Some rows were imported, but at least one row failed. Review the results before closing."
                        : "The import did not complete. Please review the error and try again."}
                  </div>
                )}
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="px-8 py-4 rounded-2xl border-2 border-dashed border-harbor-text/15 hover:border-harbor-accent/40 transition-colors cursor-pointer"
              >
                <div className="text-harbor-text/50 text-sm">
                  {fileName || "Click to select a file"}
                </div>
                <div className="text-harbor-text/25 text-xs mt-1">
                  .xlsx or .csv with category, title/question, and content/answer columns
                </div>
              </button>

              {error && (
                <p className="text-harbor-error text-sm mt-4">{error}</p>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-harbor-text/70">
                  <span className="font-medium">{rows.length}</span> AI answer
                  {rows.length === 1 ? "" : "s"} ready to import from{" "}
                  <span className="font-medium">{fileName}</span>
                </p>
                <button
                  onClick={() => {
                    setRows([]);
                    setFileName("");
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="text-xs text-harbor-text/40 hover:text-harbor-text cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {/* Category chips — click to rename all entries in that category */}
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="text-xs text-harbor-text/40 self-center mr-1">Categories:</span>
                {uniqueCategories.map((cat) => {
                  const count = rows.filter((r) => r.category === cat).length;
                  return (
                    <div key={cat}>
                      {editingCategoryName === cat ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-harbor-accent/20 bg-white px-2 py-1">
                          <input
                            autoFocus
                            value={categoryRenameValue}
                            onChange={(e) => setCategoryRenameValue(e.target.value)}
                            aria-label={`Rename category ${cat}`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const next = categoryRenameValue.trim();
                                if (next && next !== cat) {
                                  updateAllCategories(cat, next);
                                }
                                setEditingCategoryName(null);
                              }
                              if (e.key === "Escape") {
                                setEditingCategoryName(null);
                              }
                            }}
                            className="w-36 bg-transparent text-xs text-harbor-text focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const next = categoryRenameValue.trim();
                              if (next && next !== cat) {
                                updateAllCategories(cat, next);
                              }
                              setEditingCategoryName(null);
                            }}
                            className="text-harbor-accent cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingIdx(null);
                            setEditingCategoryName(cat);
                            setCategoryRenameValue(cat);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-harbor-bg text-xs text-harbor-text/70 hover:bg-harbor-accent/10 hover:text-harbor-accent transition-colors cursor-pointer"
                          title={`Rename "${cat}" (${count} rows)`}
                        >
                          <span className="material-symbols-outlined text-[12px]">edit</span>
                          {cat}
                          <span className="text-harbor-text/30">({count})</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border border-harbor-text/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-harbor-bg">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-harbor-text/50">
                        Category
                      </th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-harbor-text/50">
                        Title
                      </th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-harbor-text/50">
                        Content
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-harbor-text/5">
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">
                          {editingIdx === i ? (
                            <input
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => {
                                if (editValue.trim()) {
                                  updateCategory(i, editValue.trim());
                                }
                                setEditingIdx(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (editValue.trim()) {
                                    updateCategory(i, editValue.trim());
                                  }
                                  setEditingIdx(null);
                                } else if (e.key === "Escape") {
                                  setEditingIdx(null);
                                }
                              }}
                              className="w-full px-1.5 py-0.5 text-sm border border-harbor-accent/40 rounded focus:outline-none focus:border-harbor-accent"
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingIdx(i);
                                setEditValue(row.category);
                              }}
                              className="text-harbor-text/70 hover:text-harbor-accent cursor-pointer text-left"
                              title="Click to edit category"
                            >
                              {row.category}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-2 text-harbor-text truncate max-w-[200px]">
                          {row.title}
                        </td>
                        <td className="px-4 py-2 text-harbor-text/50 truncate max-w-[200px]">
                          {row.content}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && (
                  <div className="px-4 py-2 text-xs text-harbor-text/30 bg-harbor-bg text-center">
                    ... and {rows.length - 20} more rows
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-harbor-text/10 flex justify-end gap-3">
          <button
            onClick={() => {
              if (isImportDone) {
                onClearJob();
              }
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-harbor-text/50 hover:text-harbor-text hover:bg-harbor-bg transition-colors cursor-pointer"
          >
            {isImportDone ? "Close" : "Cancel"}
          </button>
          {!isImportActive && rows.length > 0 && (
            <button
              onClick={handleImport}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? "Starting..." : `Start Import`}
            </button>
          )}
          {isImportDone && (
            <button
              onClick={onClearJob}
              className="px-6 py-2.5 rounded-xl text-sm font-medium border border-harbor-text/15 text-harbor-text/60 hover:bg-harbor-bg transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
