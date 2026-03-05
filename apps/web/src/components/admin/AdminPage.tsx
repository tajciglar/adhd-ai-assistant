import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../hooks/useAdmin";
import { useReportTemplatesAdmin } from "../../hooks/useReportTemplatesAdmin";
import AdminSidebar from "./AdminSidebar";
import EntryList from "./EntryList";
import EntryEditor from "./EntryEditor";
import BulkImportModal from "./BulkImportModal";
import TestQueryModal from "./TestQueryModal";
import ReportTemplateList from "./ReportTemplateList";
import ReportTemplateEditor from "./ReportTemplateEditor";
import type { KnowledgeEntry, ReportTemplateRecord } from "../../types/admin";

export default function AdminPage() {
  const {
    stats,
    loading,
    saving,
    filter,
    filteredEntries,
    categories,
    setFilter,
    setActiveEntry,
    activeEntry,
    createEntry,
    updateEntry,
    deleteEntry,
    bulkImport,
    testQuery,
    clearTestResults,
    testQueryResults,
    testQuerying,
  } = useAdmin();

  const navigate = useNavigate();
  const {
    templates,
    loading: templatesLoading,
    saving: templatesSaving,
    createTemplate,
    updateTemplate,
  } = useReportTemplatesAdmin();

  const [activeSection, setActiveSection] = useState<"knowledge" | "templates">(
    "knowledge",
  );
  const [showEditor, setShowEditor] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showTestQuery, setShowTestQuery] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<ReportTemplateRecord | null>(
    null,
  );

  const handleAddEntry = useCallback(() => {
    setActiveEntry(null);
    setShowEditor(true);
  }, [setActiveEntry]);

  const handleEditEntry = useCallback(
    (entry: KnowledgeEntry) => {
      setActiveEntry(entry);
      setShowEditor(true);
    },
    [setActiveEntry],
  );

  const handleSave = useCallback(
    async (data: { category: string; title: string; content: string }) => {
      if (activeEntry) {
        await updateEntry(activeEntry.id, data);
      } else {
        await createEntry(data);
      }
      setShowEditor(false);
    },
    [activeEntry, updateEntry, createEntry],
  );

  const handleAddTemplate = useCallback(() => {
    setActiveTemplate(null);
    setShowTemplateEditor(true);
  }, []);

  const handleEditTemplate = useCallback((template: ReportTemplateRecord) => {
    setActiveTemplate(template);
    setShowTemplateEditor(true);
  }, []);

  const handleSaveTemplate = useCallback(
    async (templatePayload: ReportTemplateRecord["template"]) => {
      if (activeTemplate) {
        return updateTemplate(activeTemplate.id, templatePayload);
      }
      return createTemplate(templatePayload);
    },
    [activeTemplate, createTemplate, updateTemplate],
  );

  if (loading) {
    return (
      <div className="h-screen bg-harbor-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-harbor-primary mb-2">
            Harbor
          </h1>
          <p className="text-harbor-text/40">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-harbor-bg">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        categories={categories}
        entriesByCategory={stats?.entriesByCategory ?? {}}
        activeFilter={filter}
        totalEntries={stats?.totalEntries ?? 0}
        totalTemplates={templates.length}
        onFilterChange={setFilter}
        onAddEntry={handleAddEntry}
        onAddTemplate={handleAddTemplate}
        onBackToChat={() => navigate("/chat")}
      />

      <div className="flex-1 flex flex-col">
        {/* Stats bar */}
        <div className="px-6 py-4 bg-white border-b border-harbor-text/10 flex items-center gap-6">
          {activeSection === "knowledge" ? (
            <>
              <div>
                <span className="text-2xl font-bold text-harbor-primary">
                  {stats?.totalEntries ?? 0}
                </span>
                <span className="text-xs text-harbor-text/40 ml-1.5">entries</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-harbor-accent">
                  {categories.length}
                </span>
                <span className="text-xs text-harbor-text/40 ml-1.5">
                  categories
                </span>
              </div>
              <div>
                <span className="text-2xl font-bold text-harbor-primary-light">
                  {stats?.totalUsers ?? 0}
                </span>
                <span className="text-xs text-harbor-text/40 ml-1.5">users</span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-2xl font-bold text-harbor-primary">
                  {templates.length}
                </span>
                <span className="text-xs text-harbor-text/40 ml-1.5">templates</span>
              </div>
              <div>
                <span className="text-sm text-harbor-text/60">
                  Templates are loaded by archetype ID and override shared defaults.
                </span>
              </div>
            </>
          )}
        </div>

        {activeSection === "knowledge" ? (
          <EntryList
            entries={filteredEntries}
            onEdit={handleEditEntry}
            onDelete={deleteEntry}
            onBulkImport={() => setShowBulkImport(true)}
            onTestQuery={() => setShowTestQuery(true)}
          />
        ) : (
          <ReportTemplateList
            templates={templates}
            loading={templatesLoading}
            onCreate={handleAddTemplate}
            onEdit={handleEditTemplate}
          />
        )}
      </div>

      {showEditor && (
        <EntryEditor
          key={activeEntry?.id ?? "new"}
          entry={activeEntry}
          categories={categories}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setShowEditor(false)}
        />
      )}

      {showBulkImport && (
        <BulkImportModal
          saving={saving}
          onImport={bulkImport}
          onClose={() => setShowBulkImport(false)}
        />
      )}

      {showTestQuery && (
        <TestQueryModal
          results={testQueryResults}
          querying={testQuerying}
          onTest={testQuery}
          onClear={clearTestResults}
          onClose={() => {
            setShowTestQuery(false);
            clearTestResults();
          }}
        />
      )}

      {showTemplateEditor && (
        <ReportTemplateEditor
          key={activeTemplate?.id ?? "new-template"}
          template={activeTemplate}
          saving={templatesSaving}
          onSave={handleSaveTemplate}
          onCancel={() => setShowTemplateEditor(false)}
        />
      )}
    </div>
  );
}
