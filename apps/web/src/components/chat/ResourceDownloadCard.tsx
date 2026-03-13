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
      className="flex items-center gap-3 w-full my-2 px-4 py-3 bg-harbor-bg rounded-xl border border-harbor-accent/20 hover:border-harbor-accent/40 transition-colors cursor-pointer text-left"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-harbor-accent/10 rounded-lg flex items-center justify-center">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-harbor-accent"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <polyline points="9 15 12 18 15 15" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-harbor-text truncate">
          {filename}
        </p>
        <p className="text-xs text-harbor-text/40">
          {loading ? "Opening..." : "PDF — tap to download"}
        </p>
      </div>
    </button>
  );
}
