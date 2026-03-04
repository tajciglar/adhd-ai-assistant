import { useState, useCallback } from "react";
import type { TestQuerySource } from "../../types/admin";

interface TestQueryModalProps {
  sources: TestQuerySource[];
  loading: boolean;
  onTest: (query: string) => Promise<void>;
  onClear: () => void;
  onClose: () => void;
}

function scoreColor(score: number): string {
  if (score >= 0.7) return "text-green-600 bg-green-50";
  if (score >= 0.5) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

export default function TestQueryModal({
  sources,
  loading,
  onTest,
  onClear,
  onClose,
}: TestQueryModalProps) {
  const [query, setQuery] = useState("");

  const handleTest = useCallback(() => {
    if (query.trim()) {
      onTest(query.trim());
    }
  }, [query, onTest]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleTest();
      }
    },
    [handleTest],
  );

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-harbor-text/10">
          <h3 className="text-lg font-semibold text-harbor-text">
            Test Query
          </h3>
          <p className="text-xs text-harbor-text/40 mt-0.5">
            Test what content the AI retrieves for a given question
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a question a parent might ask..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-harbor-text/15 text-sm focus:outline-none focus:border-harbor-accent/40 transition-colors"
              autoFocus
            />
            <button
              onClick={handleTest}
              disabled={loading || !query.trim()}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Testing..." : "Test"}
            </button>
          </div>

          {sources.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-harbor-text/70">
                  <span className="font-medium">{sources.length}</span>{" "}
                  {sources.length === 1 ? "result" : "results"} found
                </p>
                <button
                  onClick={onClear}
                  className="text-xs text-harbor-text/40 hover:text-harbor-text cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {sources.map((source, i) => (
                <div
                  key={`${source.entryId}-${source.chunkIndex}`}
                  className="border border-harbor-text/10 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-harbor-accent/10 text-harbor-accent font-medium mr-2">
                        {source.category}
                      </span>
                      <span className="text-sm font-medium text-harbor-text">
                        {source.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-harbor-text/30">
                        #{i + 1}
                      </span>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded ${scoreColor(source.score)}`}
                      >
                        {source.score.toFixed(3)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-harbor-text/50 line-clamp-3">
                    {source.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {sources.length === 0 && !loading && query && (
            <div className="text-center py-8">
              <p className="text-harbor-text/30 text-sm">
                No results yet. Click "Test" to search.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-harbor-text/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-harbor-text/50 hover:text-harbor-text hover:bg-harbor-bg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
