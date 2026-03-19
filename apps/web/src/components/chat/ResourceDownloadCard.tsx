import { useState } from "react";
import { api } from "../../lib/api";

interface ResourceDownloadCardProps {
  resourceId: string;
  filename: string;
}

export default function ResourceDownloadCard({
  resourceId,
  filename,
}: ResourceDownloadCardProps) {
  const [loading, setLoading] = useState(false);

  const displayName = filename
    .replace(/\.pdf$/i, "")
    .replace(/[-_]/g, " ");

  const handleDownload = async () => {
    setLoading(true);
    try {
      const data = (await api.get(
        `/api/resources/${resourceId}/download`,
      )) as { url: string; filename: string };
      window.open(data.url, "_blank");
    } catch {
      // silently fail — resource may have been deleted
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-3 w-full my-2 px-4 py-3 bg-white rounded-xl border border-harbor-primary/15 shadow-sm hover:shadow-md hover:border-harbor-primary/25 transition-all cursor-pointer text-left group"
    >
      <div className="flex-shrink-0 w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center">
        <span
          className="material-symbols-outlined text-rose-500 text-[22px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          picture_as_pdf
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-harbor-text truncate">
          {displayName}
        </p>
        <p className="text-[11px] text-slate-400">
          {loading ? "Opening..." : "PDF Resource — tap to view"}
        </p>
      </div>
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-harbor-orange/10 flex items-center justify-center group-hover:bg-harbor-orange/20 transition-colors">
        <span className="material-symbols-outlined text-harbor-orange text-[18px]">
          {loading ? "hourglass_empty" : "download"}
        </span>
      </div>
    </button>
  );
}
