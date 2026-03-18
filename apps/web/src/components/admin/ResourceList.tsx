import type { Resource } from "../../types/admin";

interface ResourceListProps {
  resources: Resource[];
  loading: boolean;
  onUpload: () => void;
  onBulkUpload: () => void;
  onDelete: (id: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ResourceList({
  resources,
  loading,
  onUpload,
  onBulkUpload,
  onDelete,
}: ResourceListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-harbor-text/40">
        Loading resources...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-harbor-text/10">
        <h3 className="text-sm font-semibold text-harbor-text">
          {resources.length} {resources.length === 1 ? "resource" : "resources"}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onBulkUpload}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-harbor-accent/30 text-harbor-accent hover:bg-harbor-accent/5 transition-colors cursor-pointer"
          >
            Bulk Upload
          </button>
          <button
            onClick={onUpload}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors cursor-pointer"
          >
            Upload PDF
          </button>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-harbor-text/40">
          <p className="text-lg font-medium mb-1">No resources yet</p>
          <p className="text-sm">
            Upload PDF checklists, worksheets, or guides for parents
          </p>
        </div>
      ) : (
        <div className="divide-y divide-harbor-text/5">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="px-6 py-4 hover:bg-harbor-bg/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 bg-harbor-accent/10 rounded-lg flex items-center justify-center mt-0.5">
                    <svg
                      width="18"
                      height="18"
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
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-harbor-text truncate">
                      {resource.title}
                    </p>
                    {resource.description && (
                      <p className="text-xs text-harbor-text/50 mt-0.5 line-clamp-1">
                        {resource.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-harbor-text/40">
                      <span className="bg-harbor-accent/10 text-harbor-accent px-2 py-0.5 rounded-full">
                        {resource.category}
                      </span>
                      <span>{resource.originalName}</span>
                      <span>{formatSize(resource.sizeBytes)}</span>
                      <span>{formatDate(resource.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(resource.id)}
                  className="text-xs text-harbor-error/60 hover:text-harbor-error transition-colors cursor-pointer flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
