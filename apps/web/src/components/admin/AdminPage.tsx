import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../hooks/useAdmin";
import AdminSidebar from "./AdminSidebar";
import EntryList from "./EntryList";
import EntryEditor from "./EntryEditor";
import BulkImportModal from "./BulkImportModal";
import TestQueryModal from "./TestQueryModal";
import type { KnowledgeEntry } from "../../types/admin";

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
    testQueryResults,
    testQuerying,
    testQuery,
    clearTestResults,
  } = useAdmin();

  const navigate = useNavigate();
  const [showEditor, setShowEditor] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showTestQuery, setShowTestQuery] = useState(false);

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
        categories={categories}
        entriesByCategory={stats?.entriesByCategory ?? {}}
        activeFilter={filter}
        totalEntries={stats?.totalEntries ?? 0}
        onFilterChange={setFilter}
        onAddEntry={handleAddEntry}
        onBackToChat={() => navigate("/chat")}
      />

      <div className="flex-1 flex flex-col">
        {/* Stats bar */}
        <div className="px-6 py-4 bg-white border-b border-harbor-text/10 flex items-center gap-6">
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
        </div>

        <EntryList
          entries={filteredEntries}
          onEdit={handleEditEntry}
          onDelete={deleteEntry}
          onBulkImport={() => setShowBulkImport(true)}
          onTestQuery={() => setShowTestQuery(true)}
        />
      </div>

      {showEditor && (
        <EntryEditor
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
          sources={testQueryResults}
          loading={testQuerying}
          onTest={testQuery}
          onClear={clearTestResults}
          onClose={() => {
            setShowTestQuery(false);
            clearTestResults();
          }}
        />
      )}
    </div>
  );
}
