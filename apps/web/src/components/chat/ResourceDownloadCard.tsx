import { useEffect, useState } from "react";
import { api } from "../../lib/api";

interface ResourceMeta {
  title: string;
  category: string;
  description: string;
  sizeBytes: number;
}

interface ResourceDownloadCardProps {
  resourceId: string;
  filename: string;
}

export default function ResourceDownloadCard({
  resourceId,
  filename,
}: ResourceDownloadCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [meta, setMeta] = useState<ResourceMeta | null>(null);

  const displayName = filename
    .replace(/\.pdf$/i, "")
    .replace(/[-_]/g, " ");

  useEffect(() => {
    api
      .get(`/api/resources/${resourceId}`)
      .then((data) => {
        const d = data as { resource: ResourceMeta };
        setMeta(d.resource);
      })
      .catch(() => {
        // Silently fail — displayName fallback is fine
      });
  }, [resourceId]);

  const handleDownload = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = (await api.get(
        `/api/resources/${resourceId}/download`,
      )) as { url: string; filename: string };
      window.open(data.url, "_blank");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const title = meta?.title ?? displayName;
  const category = meta?.category ?? null;

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`flex items-center gap-3 w-full my-2 px-4 py-3 rounded-xl border shadow-sm transition-all cursor-pointer text-left group ${
        error
          ? "bg-red-50/50 border-red-200"
          : "bg-white border-harbor-primary/15 hover:shadow-md hover:border-harbor-primary/25"
      }`}
    >
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${error ? "bg-red-100" : "bg-rose-50"}`}>
        <span
          className={`material-symbols-outlined text-[22px] ${error ? "text-red-400" : "text-rose-500"}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {error ? "error" : "picture_as_pdf"}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-harbor-text truncate">
          {title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {category && !error && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-harbor-primary/70 bg-harbor-primary/8 px-1.5 py-0.5 rounded-md">
              {category}
            </span>
          )}
          <p className="text-[11px] text-slate-400">
            {loading ? "Opening..." : error ? "Resource not available — it may have been removed" : "PDF · tap to view"}
          </p>
        </div>
      </div>
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
        error ? "bg-red-100" : "bg-harbor-orange/10 group-hover:bg-harbor-orange/20"
      }`}>
        <span className={`material-symbols-outlined text-[18px] ${error ? "text-red-400" : "text-harbor-orange"}`}>
          {loading ? "hourglass_empty" : error ? "warning" : "download"}
        </span>
      </div>
    </button>
  );
}
