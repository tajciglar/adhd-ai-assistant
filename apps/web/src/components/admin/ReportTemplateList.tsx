import type { ReportTemplateRecord } from "../../types/admin";

interface ReportTemplateListProps {
  templates: ReportTemplateRecord[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (template: ReportTemplateRecord) => void;
}

export default function ReportTemplateList({
  templates,
  loading,
  onCreate,
  onEdit,
}: ReportTemplateListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-harbor-text/40 text-sm">Loading report templates...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-harbor-text/10">
        <h3 className="text-sm font-semibold text-harbor-text">
          {templates.length} {templates.length === 1 ? "template" : "templates"}
        </h3>
        <button
          onClick={onCreate}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors cursor-pointer"
        >
          + Add Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-harbor-text/30 text-sm">No report templates yet</p>
          <p className="text-harbor-text/20 text-xs mt-1">
            Add your first archetype template
          </p>
        </div>
      ) : (
        <div className="divide-y divide-harbor-text/5">
          {templates.map((record) => (
            <button
              key={record.id}
              onClick={() => onEdit(record)}
              className="w-full text-left px-6 py-4 hover:bg-harbor-bg/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-harbor-accent/10 text-harbor-accent font-medium mb-1.5">
                    {record.archetypeId}
                  </span>
                  <h4 className="text-sm font-medium text-harbor-text truncate">
                    {record.template.title}
                  </h4>
                </div>
                <span className="text-xs text-harbor-text/30 shrink-0">
                  {new Date(record.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
