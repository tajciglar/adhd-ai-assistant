import { useState, useCallback } from "react";
import { api } from "../../lib/api";
import type { Resource } from "../../types/admin";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResourcePreviewModal({
  resource,
  onClose,
}: {
  resource: Resource;
  onClose: () => void;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState(false);

  const fetchUrl = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await api.get(`/api/resources/${resource.id}/download`)) as {
        url: string;
        filename: string;
      };
      setPdfUrl(data.url);
      return data.url;
    } catch {
      setPdfUrl(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [resource.id]);

  const handleView = async () => {
    const url = pdfUrl || (await fetchUrl());
    if (url) setViewing(true);
  };

  const handleDownload = async () => {
    const url = pdfUrl || (await fetchUrl());
    if (url) window.open(url, "_blank");
  };

  const cat = (resource.category ?? "").toLowerCase();
  const isPdf = !cat.includes("video") && !cat.includes("article");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40" />

      {viewing && pdfUrl ? (
        <div className="relative z-10 w-full h-full md:w-[90%] md:h-[90%] md:max-w-5xl md:rounded-2xl overflow-hidden bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-b from-harbor-bg-alt to-white">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-harbor-primary font-display truncate">{resource.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-harbor-orange border border-harbor-orange/30 rounded-lg hover:bg-harbor-orange/5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download
              </button>
              <button
                onClick={() => setViewing(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
          <iframe src={pdfUrl} className="flex-1 w-full" title={resource.title} />
        </div>
      ) : (
        <div className="relative z-10 w-full md:w-full md:max-w-md mx-4 bg-white rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-harbor-primary to-harbor-primary/80 px-6 py-8 text-white text-center relative">
            <div className="absolute inset-0 opacity-10 flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontSize: "120px", fontVariationSettings: "'FILL' 1" }}>
                description
              </span>
            </div>
            <div className="relative z-10">
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                {cat.includes("video") ? "Video" : cat.includes("article") ? "Article" : "PDF Resource"}
              </span>
              <h2 className="text-xl font-bold font-display mt-1">{resource.title}</h2>
              {resource.description && (
                <p className="text-white/70 text-sm mt-2 leading-relaxed">{resource.description}</p>
              )}
            </div>
          </div>
          <div className="px-6 py-4 border-b border-slate-50">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{resource.originalName}</span>
              {resource.sizeBytes > 0 && <span>{formatFileSize(resource.sizeBytes)}</span>}
            </div>
          </div>
          <div className="px-6 py-5 flex flex-col gap-2.5">
            {isPdf && (
              <button
                onClick={handleView}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-harbor-primary text-white font-semibold rounded-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">visibility</span>
                {loading ? "Loading..." : "View in App"}
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 border border-harbor-orange/30 text-harbor-orange font-semibold rounded-xl hover:bg-harbor-orange/5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              {loading ? "Loading..." : "Download"}
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
