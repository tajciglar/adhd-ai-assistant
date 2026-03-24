import { useState, useCallback } from "react";
import type { TestQueryResult } from "../../types/admin";

interface TestQueryModalProps {
  results: TestQueryResult | null;
  querying: boolean;
  onTest: (query: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function scoreColor(score: number): string {
  if (score >= 0.7) return "bg-green-500";
  if (score >= 0.5) return "bg-yellow-500";
  return "bg-red-400";
}

function scoreLabel(score: number): string {
  if (score >= 0.7) return "text-green-700";
  if (score >= 0.5) return "text-yellow-700";
  return "text-red-500";
}

export default function TestQueryModal({
  results,
  querying,
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
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-harbor-text/10">
          <h3 className="text-lg font-semibold text-harbor-text">Check AI Answer</h3>
          <p className="text-xs text-harbor-text/40 mt-0.5">
            Preview Harbor&apos;s draft answer and the knowledge it used
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
              className="flex-1 px-4 py-2.5 rounded-xl border border-harbor-text/15 text-sm focus:outline-none focus:border-harbor-accent/40 placeholder:text-harbor-text/30"
            />
            <button
              onClick={handleTest}
              disabled={querying || !query.trim()}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {querying ? "Checking..." : "Check"}
            </button>
          </div>

          {results && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-harbor-bg px-3 py-1 text-xs font-medium text-harbor-text/60">
                    {results.totalRetrieved} {results.totalRetrieved === 1 ? "source" : "sources"}
                  </span>
                  <span className="rounded-full bg-harbor-bg px-3 py-1 text-xs font-medium text-harbor-text/60">
                    Retrieval {results.retrievalMs}ms
                  </span>
                  <span className="rounded-full bg-harbor-bg px-3 py-1 text-xs font-medium text-harbor-text/60">
                    {results.cacheHit ? "Cache hit" : "Fresh search"}
                  </span>
                  {results.answerMetadata?.model && (
                    <span className="rounded-full bg-harbor-bg px-3 py-1 text-xs font-medium text-harbor-text/60">
                      {results.answerMetadata.model}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClear}
                  className="text-xs text-harbor-text/40 hover:text-harbor-text cursor-pointer"
                >
                  Clear
                </button>
              </div>

              <section className="rounded-2xl border border-harbor-text/10 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-harbor-text">Draft answer</h4>
                  {results.answerMetadata?.providerMs !== undefined && (
                    <span className="text-xs text-harbor-text/35">
                      Model time {results.answerMetadata.providerMs}ms
                    </span>
                  )}
                </div>
                {results.answerPreview ? (
                  <div className="rounded-xl bg-harbor-bg/45 p-4 text-sm leading-7 text-harbor-text whitespace-pre-wrap">
                    {results.answerPreview}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-harbor-text/10 p-4 text-sm text-harbor-text/40">
                    No answer preview available.
                  </div>
                )}
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-harbor-text">Retrieved sources</h4>
                  {results.answerMetadata?.sourceCount !== undefined && (
                    <p className="text-xs text-harbor-text/35">
                      Answer used {results.answerMetadata.sourceCount} source
                      {results.answerMetadata.sourceCount === 1 ? "" : "s"}
                    </p>
                  )}
                </div>

                {results.sources.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-harbor-text/10 rounded-xl">
                    <p className="text-harbor-text/40 text-sm">No matching content found</p>
                    <p className="text-harbor-text/25 text-xs mt-1">
                      Add AI answers about this topic to improve Harbor&apos;s response
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.sources.map((source, i) => (
                      <div
                        key={`${source.entryId}-${source.chunkIndex}`}
                        className="border border-harbor-text/10 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-harbor-text/30">
                                #{i + 1}
                              </span>
                              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-harbor-accent/10 text-harbor-accent font-medium">
                                {source.category}
                              </span>
                            </div>
                            <h4 className="text-sm font-medium text-harbor-text">{source.title}</h4>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs font-semibold ${scoreLabel(source.score)}`}>
                              {(source.score * 100).toFixed(0)}%
                            </span>
                            <div className="w-16 h-1.5 bg-harbor-text/5 rounded-full mt-1">
                              <div
                                className={`h-full rounded-full ${scoreColor(source.score)}`}
                                style={{
                                  width: `${Math.min(source.score * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-harbor-text/50 line-clamp-3">{source.text}</p>
                        <p className="text-xs text-harbor-text/20 mt-1.5">
                          Chunk {source.chunkIndex + 1}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {!results && !querying && (
            <div className="text-center py-12">
              <p className="text-harbor-text/30 text-sm">
                Enter a real parent question to preview Harbor&apos;s answer
              </p>
              <p className="text-harbor-text/20 text-xs mt-1">
                This lets you review the answer draft and the supporting knowledge together
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
