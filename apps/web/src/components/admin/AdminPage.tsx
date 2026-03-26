import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../hooks/useAdmin";
import { useReportTemplatesAdmin } from "../../hooks/useReportTemplatesAdmin";
import { useResources } from "../../hooks/useResources";
import AdminSidebar from "./AdminSidebar";
import type { AdminSection } from "./AdminSidebar";
import AdminOverview from "./AdminOverview";
import EntryList from "./EntryList";
import EntryEditor from "./EntryEditor";
import BulkImportModal from "./BulkImportModal";
import SmartImportModal from "./SmartImportModal";
import TestQueryModal from "./TestQueryModal";
import ReportTemplateList from "./ReportTemplateList";
import ReportTemplateEditor from "./ReportTemplateEditor";
import ResourceList from "./ResourceList";
import ResourceUploadModal from "./ResourceUploadModal";
import BulkResourceUploadModal from "./BulkResourceUploadModal";
import QuizAnalyticsDashboard from "./QuizAnalyticsDashboard";
import TokenUsageDashboard from "./TokenUsageDashboard";
import ConversationInsights from "./ConversationInsights";
import FeedbackDashboard from "./FeedbackDashboard";
import AdminUsers from "./AdminUsers";
import type { KnowledgeEntry, ReportTemplateRecord } from "../../types/admin";

const helpBanners: Record<AdminSection, string> = {
  overview:
    "Start here if you're not sure where to go. These shortcuts cover the most common admin tasks.",
  knowledge:
    "These are the AI answers Harbor can pull from during chat. Write titles the way a parent would ask the question.",
  resources:
    "These are downloadable files Harbor can recommend to parents when they need a checklist, guide, or worksheet.",
  templates:
    "These templates control the child report generated after the quiz.",
  analytics:
    "Track how parents move through the quiz and where they drop off.",
  "token-usage":
    "Monitor how much the AI is being used and what that usage likely costs.",
  insights:
    "See what parents ask about most so you can spot content gaps.",
  feedback:
    "Review the answers parents liked or disliked to improve Harbor's quality.",
  users:
    "Send email invites to clients so they can set a password and get immediate chat access.",
};


function HelpBanner({
  section,
  onDismiss,
}: {
  section: AdminSection;
  onDismiss: () => void;
}) {
  return (
    <div className="mx-4 md:mx-6 mt-4 px-4 py-3 bg-harbor-bg-alt/50 rounded-xl flex items-start gap-3">
      <span className="material-symbols-outlined text-harbor-orange text-lg mt-0.5 shrink-0">
        lightbulb
      </span>
      <p className="flex-1 text-sm text-harbor-text/70 leading-relaxed">
        {helpBanners[section]}
      </p>
      <button
        onClick={onDismiss}
        className="shrink-0 p-0.5 rounded text-harbor-text/30 hover:text-harbor-text/60 transition-colors cursor-pointer"
        aria-label="Dismiss help banner"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}

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
    classifyEntry,
    parseDocument,
    checkDuplicates,
    importJob,
    clearImportJob,
    refetch,
  } = useAdmin();

  const navigate = useNavigate();
  const {
    templates,
    loading: templatesLoading,
    saving: templatesSaving,
    createTemplate,
    updateTemplate,
  } = useReportTemplatesAdmin();

  const {
    resources,
    loading: resourcesLoading,
    uploading: resourcesUploading,
    uploadResource,
    updateResource,
    deleteResource,
    refreshResources,
  } = useResources();

  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [showEditor, setShowEditor] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [showTestQuery, setShowTestQuery] = useState(false);
  const [showResourceUpload, setShowResourceUpload] = useState(false);
  const [showBulkResourceUpload, setShowBulkResourceUpload] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<ReportTemplateRecord | null>(
    null,
  );
  const [dismissedBanners, setDismissedBanners] = useState<Set<AdminSection>>(
    new Set(),
  );

  const handleDismissBanner = useCallback(
    (section: AdminSection) => {
      setDismissedBanners((prev) => new Set(prev).add(section));
    },
    [],
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
        <div className="text-center space-y-3">
          <img src="/mascot.svg" alt="Harbor" width="64" height="64" className="mx-auto" />
          <p className="text-harbor-text/40 text-sm">Loading admin panel...</p>
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
        totalResources={resources.length}
        totalTemplates={templates.length}
        onFilterChange={setFilter}
        onAddEntry={handleAddEntry}
        onAddTemplate={handleAddTemplate}
        onBackToChat={() => navigate("/chat")}
        onCategoryRenamed={() => refetch()}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Stats bar -- only for knowledge and templates */}
        {(activeSection === "knowledge" || activeSection === "templates") && (
          <div className="px-4 md:px-6 py-4 bg-white border-b border-harbor-text/10 flex items-center gap-6">
            {activeSection === "knowledge" ? (
              <>
                <div>
                  <span className="text-2xl font-bold text-harbor-text">
                    {stats?.totalEntries ?? 0}
                  </span>
                  <span className="text-xs text-harbor-text/40 ml-1.5">answers</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-harbor-orange">
                    {categories.length}
                  </span>
                  <span className="text-xs text-harbor-text/40 ml-1.5">
                    categories
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-2xl font-bold text-harbor-primary-light">
                    {stats?.totalUsers ?? 0}
                  </span>
                  <span className="text-xs text-harbor-text/40 ml-1.5">accounts</span>
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
                <div className="hidden sm:block">
                  <span className="text-sm text-harbor-text/60">
                    Templates are loaded by archetype ID and override shared defaults.
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Help banner */}
        {!dismissedBanners.has(activeSection) && (
          <HelpBanner
            section={activeSection}
            onDismiss={() => handleDismissBanner(activeSection)}
          />
        )}

        {activeSection === "overview" ? (
          <AdminOverview
            stats={stats ?? null}
            totalResources={resources.length}
            totalTemplates={templates.length}
            onOpenSection={setActiveSection}
            onPrimaryAction={() => {
              setActiveSection("knowledge");
              handleAddEntry();
            }}
          />
        ) : activeSection === "knowledge" ? (
          <EntryList
            entries={filteredEntries}
            onEdit={handleEditEntry}
            onDelete={deleteEntry}
            onBulkImport={() => setShowBulkImport(true)}
            onSmartImport={() => setShowSmartImport(true)}
            onTestQuery={() => setShowTestQuery(true)}
            onRefresh={refetch}
          />
        ) : activeSection === "resources" ? (
          <ResourceList
            resources={resources}
            loading={resourcesLoading}
            onUpload={() => setShowResourceUpload(true)}
            onBulkUpload={() => setShowBulkResourceUpload(true)}
            onUpdate={updateResource}
            onDelete={deleteResource}
          />
        ) : activeSection === "templates" ? (
          <ReportTemplateList
            templates={templates}
            loading={templatesLoading}
            onCreate={handleAddTemplate}
            onEdit={handleEditTemplate}
          />
        ) : activeSection === "analytics" ? (
          <QuizAnalyticsDashboard />
        ) : activeSection === "token-usage" ? (
          <TokenUsageDashboard />
        ) : activeSection === "insights" ? (
          <ConversationInsights />
        ) : activeSection === "feedback" ? (
          <FeedbackDashboard stats={stats ?? null} />
        ) : activeSection === "users" ? (
          <AdminUsers />
        ) : null}
      </div>

      {showEditor && (
        <EntryEditor
          key={activeEntry?.id ?? "new"}
          entry={activeEntry}
          categories={categories}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setShowEditor(false)}
          onClassify={classifyEntry}
        />
      )}

      {showBulkImport && (
        <BulkImportModal
          saving={saving}
          importJob={importJob}
          onImport={bulkImport}
          onClearJob={clearImportJob}
          onClose={() => setShowBulkImport(false)}
        />
      )}

      {showSmartImport && (
        <SmartImportModal
          saving={saving}
          onParse={parseDocument}
          onImport={bulkImport}
          onCheckDuplicates={checkDuplicates}
          onClose={() => setShowSmartImport(false)}
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

      {showResourceUpload && (
        <ResourceUploadModal
          uploading={resourcesUploading}
          categories={[...new Set(resources.map((r) => r.category).filter(Boolean))]}
          onUpload={uploadResource}
          onClose={() => setShowResourceUpload(false)}
        />
      )}

      {showBulkResourceUpload && (
        <BulkResourceUploadModal
          onClose={() => setShowBulkResourceUpload(false)}
          onComplete={() => {
            refreshResources();
          }}
        />
      )}
    </div>
  );
}
