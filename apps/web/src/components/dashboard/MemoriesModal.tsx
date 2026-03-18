import { useState } from "react";
import { useMemories, type Memory } from "../../hooks/useMemories";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function MemoryCard({
  memory,
  onDelete,
  isDeleting,
}: {
  memory: Memory;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
        confirmDelete
          ? "border-rose-200 bg-rose-50/50"
          : "border-slate-100 bg-white hover:border-slate-200"
      }`}
    >
      <div className="shrink-0 mt-0.5">
        <span className="material-symbols-outlined text-slate-300 text-[18px]">
          lightbulb
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 leading-relaxed">{memory.fact}</p>
        <p className="text-[11px] text-slate-400 mt-1">{timeAgo(memory.createdAt)}</p>
      </div>

      <div className="shrink-0">
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(memory.id)}
              disabled={isDeleting}
              className="text-[11px] text-rose-600 font-medium hover:bg-rose-100 px-1.5 py-0.5 rounded disabled:opacity-50"
            >
              {isDeleting ? "..." : "Delete"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-500 p-0.5 rounded"
            title="Remove memory"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function MemoriesModal({ onClose }: { onClose: () => void }) {
  const { memories, loading, deleting, deleteMemory, clearAll } = useMemories();
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-slate-400"
                style={{ fontSize: "22px" }}
              >
                psychology
              </span>
              Harbor's Memory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading
                ? "Loading..."
                : `${memories.length} thing${memories.length !== 1 ? "s" : ""} remembered about your family`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12 px-4">
              <span
                className="material-symbols-outlined text-slate-200 mb-3 block"
                style={{
                  fontSize: "48px",
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                psychology
              </span>
              <p className="text-sm font-medium text-slate-500">
                No memories yet
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                As you chat with Harbor, it will remember important details
                about your family to personalize future conversations.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {memories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onDelete={deleteMemory}
                  isDeleting={deleting === memory.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {memories.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 shrink-0">
            {confirmClearAll ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-rose-600">
                  Delete all {memories.length} memories? This can't be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmClearAll(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      clearAll();
                      setConfirmClearAll(false);
                    }}
                    disabled={deleting === "all"}
                    className="text-xs text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
                  >
                    {deleting === "all" ? "Clearing..." : "Yes, Clear All"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClearAll(true)}
                className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
              >
                Clear all memories
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
