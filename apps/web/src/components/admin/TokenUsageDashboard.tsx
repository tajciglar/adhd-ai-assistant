import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";

interface DailyTokenUsage {
  date: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  messageCount: number;
}

interface TokenUsageData {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalMessages: number;
  estimatedCost: number;
  avgTokensPerResponse: number;
  daily: DailyTokenUsage[];
  days: number;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function TokenUsageDashboard() {
  const [data, setData] = useState<TokenUsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const fetchData = useCallback(async (numDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = (await api.get(
        `/api/admin/token-usage?days=${numDays}`,
      )) as TokenUsageData;
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch token usage",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(days);
  }, [days, fetchData]);

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-harbor-text/40">Loading token usage...</p>
      </div>
    );
  }

  const maxDailyTokens = Math.max(
    ...(data?.daily.map((d) => d.totalTokens) ?? [1]),
  );

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-harbor-primary">
              Token Usage
            </h1>
            <p className="text-sm text-harbor-text/50">
              Gemini API usage &amp; cost estimates
            </p>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  days === d
                    ? "bg-harbor-primary text-white"
                    : "bg-white text-harbor-text/60 border border-harbor-text/10 hover:border-harbor-primary/30"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-harbor-text/10 p-5 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-harbor-text/40">
                Total Tokens
              </p>
              <p className="text-3xl font-bold text-harbor-primary">
                {formatNumber(data.totalTokens)}
              </p>
              <p className="text-sm text-harbor-text/50">
                in {data.days} days
              </p>
            </div>

            <div className="bg-white rounded-xl border border-harbor-text/10 p-5 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-harbor-text/40">
                Estimated Cost
              </p>
              <p className="text-3xl font-bold text-green-600">
                ${data.estimatedCost.toFixed(4)}
              </p>
              <p className="text-sm text-harbor-text/50">
                Gemini 2.5 Flash pricing
              </p>
            </div>

            <div className="bg-white rounded-xl border border-harbor-text/10 p-5 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-harbor-text/40">
                AI Responses
              </p>
              <p className="text-3xl font-bold text-harbor-accent">
                {data.totalMessages.toLocaleString()}
              </p>
              <p className="text-sm text-harbor-text/50">
                assistant messages
              </p>
            </div>

            <div className="bg-white rounded-xl border border-harbor-text/10 p-5 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-harbor-text/40">
                Avg Tokens/Response
              </p>
              <p className="text-3xl font-bold text-harbor-primary-light">
                {data.avgTokensPerResponse.toLocaleString()}
              </p>
              <p className="text-sm text-harbor-text/50">
                tokens per message
              </p>
            </div>
          </div>
        )}

        {/* Input vs Output Breakdown */}
        {data && data.totalTokens > 0 && (
          <div className="bg-white rounded-xl border border-harbor-text/10 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-harbor-primary">
              Token Breakdown
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-harbor-text/50 mb-1">
                  Prompt (Input)
                </p>
                <p className="text-2xl font-bold text-harbor-primary">
                  {formatNumber(data.totalPromptTokens)}
                </p>
                <div className="w-full h-2 bg-harbor-text/5 rounded mt-2 overflow-hidden">
                  <div
                    className="h-full bg-harbor-primary rounded"
                    style={{
                      width: `${(data.totalPromptTokens / data.totalTokens) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-harbor-text/30 mt-1">
                  {((data.totalPromptTokens / data.totalTokens) * 100).toFixed(
                    1,
                  )}
                  % &middot; ~$
                  {((data.totalPromptTokens / 1_000_000) * 0.15).toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-sm text-harbor-text/50 mb-1">
                  Completion (Output)
                </p>
                <p className="text-2xl font-bold text-harbor-accent">
                  {formatNumber(data.totalCompletionTokens)}
                </p>
                <div className="w-full h-2 bg-harbor-text/5 rounded mt-2 overflow-hidden">
                  <div
                    className="h-full bg-harbor-accent rounded"
                    style={{
                      width: `${(data.totalCompletionTokens / data.totalTokens) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-harbor-text/30 mt-1">
                  {(
                    (data.totalCompletionTokens / data.totalTokens) *
                    100
                  ).toFixed(1)}
                  % &middot; ~$
                  {((data.totalCompletionTokens / 1_000_000) * 0.6).toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Daily Usage Chart */}
        {data?.daily.length ? (
          <div className="bg-white rounded-xl border border-harbor-text/10 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-harbor-primary">
              Daily Token Usage
            </h2>
            <div className="space-y-1.5">
              {data.daily.map((day) => {
                const width =
                  maxDailyTokens > 0
                    ? (day.totalTokens / maxDailyTokens) * 100
                    : 0;
                return (
                  <div key={day.date} className="flex items-center gap-3 text-sm">
                    <span className="w-24 text-right text-harbor-text/50 tabular-nums text-xs">
                      {day.date}
                    </span>
                    <div className="flex-1 h-6 bg-harbor-text/5 rounded overflow-hidden relative">
                      <div
                        className="h-full rounded bg-harbor-accent/70 transition-all"
                        style={{ width: `${width}%` }}
                      />
                      <span className="absolute inset-y-0 left-2 flex items-center text-xs text-harbor-text/70">
                        {formatNumber(day.totalTokens)}
                      </span>
                    </div>
                    <span className="w-12 text-right text-xs text-harbor-text/40 tabular-nums">
                      {day.messageCount}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-harbor-text/30 text-right">
              Right column = number of AI responses
            </p>
          </div>
        ) : data ? (
          <div className="bg-white rounded-xl border border-harbor-text/10 p-6 text-center">
            <p className="text-harbor-text/40 text-sm">
              No token usage data for this period
            </p>
          </div>
        ) : null}

        {/* Daily Detail Table */}
        {data?.daily.length ? (
          <div className="bg-white rounded-xl border border-harbor-text/10 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-harbor-primary">
              Daily Detail
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-harbor-text/10">
                    <th className="text-left py-2 pr-4 text-harbor-text/50 font-medium">
                      Date
                    </th>
                    <th className="text-right py-2 px-4 text-harbor-text/50 font-medium">
                      Prompt
                    </th>
                    <th className="text-right py-2 px-4 text-harbor-text/50 font-medium">
                      Completion
                    </th>
                    <th className="text-right py-2 px-4 text-harbor-text/50 font-medium">
                      Total
                    </th>
                    <th className="text-right py-2 px-4 text-harbor-text/50 font-medium">
                      Messages
                    </th>
                    <th className="text-right py-2 pl-4 text-harbor-text/50 font-medium">
                      Est. Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily.map((day) => {
                    const dayCost =
                      (day.promptTokens / 1_000_000) * 0.15 +
                      (day.completionTokens / 1_000_000) * 0.6;
                    return (
                      <tr
                        key={day.date}
                        className="border-b border-harbor-text/5"
                      >
                        <td className="py-2 pr-4 text-harbor-text/70">
                          {day.date}
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums">
                          {formatNumber(day.promptTokens)}
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums text-harbor-accent">
                          {formatNumber(day.completionTokens)}
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums font-medium">
                          {formatNumber(day.totalTokens)}
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums text-harbor-text/50">
                          {day.messageCount}
                        </td>
                        <td className="py-2 pl-4 text-right tabular-nums text-green-600">
                          ${dayCost.toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
