import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import LoadingScreen from "../shared/LoadingScreen";
import ResourcePreviewModal from "../shared/ResourcePreviewModal";
import type { Resource } from "../../types/admin";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FOLDER_COLORS = [
  { bg: "bg-harbor-primary/10", text: "text-harbor-primary", icon: "folder" },
  { bg: "bg-harbor-orange/10", text: "text-harbor-orange", icon: "folder" },
  { bg: "bg-sky-50", text: "text-sky-600", icon: "folder" },
  { bg: "bg-emerald-50", text: "text-emerald-600", icon: "folder" },
  { bg: "bg-rose-50", text: "text-rose-500", icon: "folder" },
  { bg: "bg-amber-50", text: "text-amber-600", icon: "folder" },
] as const;

function getFolderColor(index: number) {
  return FOLDER_COLORS[index % FOLDER_COLORS.length];
}

function getResourceStyle(resource: Resource) {
  const cat = (resource.category ?? "").toLowerCase();
  const isPdf = resource.filename?.toLowerCase().endsWith(".pdf") || cat.includes("pdf");

  if (isPdf) {
    return {
      icon: "picture_as_pdf",
      bg: "bg-rose-50",
      color: "text-rose-500",
      label: "PDF",
      thumbBg: "bg-rose-100",
      thumbIcon: "description",
    };
  }
  if (cat.includes("video")) {
    return {
      icon: "play_circle",
      bg: "bg-emerald-50",
      color: "text-emerald-600",
      label: "Video",
      thumbBg: "bg-emerald-100",
      thumbIcon: "play_circle",
    };
  }
  if (cat.includes("article")) {
    return {
      icon: "article",
      bg: "bg-sky-50",
      color: "text-sky-600",
      label: "Article",
      thumbBg: "bg-sky-100",
      thumbIcon: "article",
    };
  }
  if (cat.includes("checklist") || cat.includes("printable")) {
    return {
      icon: "task_alt",
      bg: "bg-amber-50",
      color: "text-amber-600",
      label: "Checklist",
      thumbBg: "bg-amber-100",
      thumbIcon: "checklist",
    };
  }
  return {
    icon: "description",
    bg: "bg-slate-50",
    color: "text-slate-500",
    label: "File",
    thumbBg: "bg-slate-100",
    thumbIcon: "description",
  };
}

interface FolderInfo {
  category: string;
  count: number;
  colorIndex: number;
}

export default function LibraryPage() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/resources/recommended").catch(() => ({ resources: [] })),
      api.get("/api/user/me").catch(() => null),
    ]).then(([resourceData, userData]) => {
      const rd = resourceData as { resources: Resource[] };
      setResources(rd.resources ?? []);
      if (userData) {
        const u = userData as { role?: string };
        setIsAdmin(u.role === "admin");
      }
      setLoading(false);
    });
  }, []);

  // Derive folders from unique categories
  const folders: FolderInfo[] = useMemo(() => {
    const categoryMap = new Map<string, number>();
    for (const r of resources) {
      const cat = r.category || "Uncategorized";
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
    }
    let idx = 0;
    const result: FolderInfo[] = [];
    for (const [category, count] of categoryMap) {
      result.push({ category, count, colorIndex: idx });
      idx++;
    }
    return result;
  }, [resources]);

  // Search across all resources regardless of folder
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q)
    );
  }, [resources, searchQuery]);

  // Resources in the currently active folder
  const folderResources = useMemo(() => {
    if (!activeFolder) return [];
    return resources.filter((r) => (r.category || "Uncategorized") === activeFolder);
  }, [resources, activeFolder]);

  // Determine which resources to display
  const displayedResources = searchResults ?? folderResources;
  const isSearching = searchResults !== null;

  function handleBack() {
    if (activeFolder) {
      setActiveFolder(null);
    } else {
      navigate(-1);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen bg-harbor-bg">
      <DesktopSidebar active="library" isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col">
        {/* ── Mobile Header ── */}
        <div className="md:hidden flex items-center bg-gradient-to-b from-harbor-bg-alt to-white/80 backdrop-blur-md px-4 py-3 justify-between sticky top-0 z-10 border-b border-harbor-orange/10">
          <button
            onClick={handleBack}
            className="text-slate-600 flex w-9 h-9 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h2 className="text-harbor-primary text-base font-bold flex-1 text-center font-display">
            {activeFolder && !isSearching ? activeFolder : "Library"}
          </h2>
          <div className="w-9 h-9 shrink-0" />
        </div>

        {/* ── Desktop Header ── */}
        <header className="hidden md:flex h-16 border-b border-harbor-orange/10 bg-gradient-to-b from-harbor-bg-alt to-white items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {activeFolder && !isSearching && (
              <button
                onClick={() => setActiveFolder(null)}
                className="text-slate-500 flex w-9 h-9 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
            )}
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/40 outline-none transition-all"
                placeholder="Search all resources…"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-500 border border-slate-100">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
        </header>

        {/* ── Mobile Search ── */}
        <div className="md:hidden px-4 py-3 bg-harbor-bg">
          <div className="flex items-center bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden h-10">
            <span className="material-symbols-outlined text-slate-400 pl-3 text-[20px]">search</span>
            <input
              className="flex-1 bg-transparent px-2 h-full focus:outline-none text-sm placeholder:text-slate-400 focus:ring-harbor-orange/20 focus:border-harbor-orange/40"
              placeholder="Search resources…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Search Results or Folder Contents ── */}
          {isSearching || activeFolder ? (
            <>
              {/* Mobile list */}
              <div className="md:hidden flex flex-col px-4 pb-28 gap-2">
                {activeFolder && !isSearching && (
                  <div className="flex items-center gap-2 pt-1 pb-2">
                    <span className="text-slate-500 text-xs font-medium">
                      {folderResources.length} resource{folderResources.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {isSearching && (
                  <p className="text-slate-500 text-xs font-medium pt-1 pb-2">
                    {displayedResources.length} result{displayedResources.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
                  </p>
                )}
                {displayedResources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span
                      className="material-symbols-outlined text-5xl text-slate-300 mb-3"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      search_off
                    </span>
                    <p className="text-slate-500 text-sm font-medium">No resources found</p>
                    <p className="text-slate-400 text-xs mt-1">Try a different search term</p>
                  </div>
                ) : (
                  displayedResources.map((resource) => {
                    const style = getResourceStyle(resource);
                    return (
                      <button
                        key={resource.id}
                        onClick={() => setSelectedResource(resource)}
                        className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer text-left w-full"
                      >
                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${style.thumbBg}`}>
                          <span
                            className={`material-symbols-outlined text-3xl ${style.color}`}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {style.thumbIcon}
                          </span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <h4 className="text-slate-900 font-semibold text-sm truncate">{resource.title}</h4>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {style.label}
                            {resource.sizeBytes > 0 && ` · ${formatFileSize(resource.sizeBytes)}`}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Desktop grid */}
              <div className="hidden md:block p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-harbor-primary font-display">
                    {isSearching ? "Search Results" : activeFolder}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {isSearching
                      ? `${displayedResources.length} result${displayedResources.length !== 1 ? "s" : ""} for "${searchQuery}"`
                      : `${folderResources.length} resource${folderResources.length !== 1 ? "s" : ""}`}
                  </p>
                </div>

                {displayedResources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <span
                      className="material-symbols-outlined text-6xl text-slate-300 mb-4"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      search_off
                    </span>
                    <p className="text-slate-500 text-base font-medium">No resources found</p>
                    <p className="text-slate-400 text-sm mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {displayedResources.map((resource) => {
                      const style = getResourceStyle(resource);
                      return (
                        <button
                          key={resource.id}
                          onClick={() => setSelectedResource(resource)}
                          className="group flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:shadow-slate-200/80 hover:border-slate-300 transition-all cursor-pointer text-left"
                        >
                          <div className="aspect-[3/4] relative bg-harbor-bg flex flex-col items-center justify-center p-6">
                            <div className={`w-16 h-16 ${style.thumbBg} rounded-2xl flex items-center justify-center mb-3 shadow-sm`}>
                              <span
                                className={`material-symbols-outlined text-4xl ${style.color}`}
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                {style.thumbIcon}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {style.label}
                            </span>
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-500">
                                <span className="material-symbols-outlined text-[16px]">more_vert</span>
                              </div>
                            </div>
                          </div>
                          <div className="px-4 py-3 border-t border-slate-50">
                            <h3 className="font-semibold text-sm text-slate-800 truncate">{resource.title}</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {resource.sizeBytes > 0 ? formatFileSize(resource.sizeBytes) : style.label}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── Folder Grid (default view) ── */
            <>
              {/* Mobile folders */}
              <div className="md:hidden flex flex-col px-4 pb-28 gap-3">
                <p className="text-slate-500 text-xs font-medium pt-1 pb-1">
                  {folders.length} folder{folders.length !== 1 ? "s" : ""} · {resources.length} resource{resources.length !== 1 ? "s" : ""}
                </p>
                {resources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span
                      className="material-symbols-outlined text-5xl text-slate-300 mb-3"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      folder_off
                    </span>
                    <p className="text-slate-500 text-sm font-medium">No resources yet</p>
                    <p className="text-slate-400 text-xs mt-1">Resources recommended by Harbor will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {folders.map((folder) => {
                      const color = getFolderColor(folder.colorIndex);
                      return (
                        <button
                          key={folder.category}
                          onClick={() => setActiveFolder(folder.category)}
                          className="flex flex-col items-center gap-2 bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
                        >
                          <div className={`w-14 h-14 ${color.bg} rounded-2xl flex items-center justify-center`}>
                            <span
                              className={`material-symbols-outlined text-3xl ${color.text}`}
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {color.icon}
                            </span>
                          </div>
                          <div className="text-center min-w-0 w-full">
                            <h4 className="text-slate-800 font-semibold text-sm truncate">{folder.category}</h4>
                            <p className="text-slate-400 text-xs mt-0.5">
                              {folder.count} item{folder.count !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desktop folders */}
              <div className="hidden md:block p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-harbor-primary font-display">Library</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Resources Harbor has recommended for you
                  </p>
                </div>

                {resources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <span
                      className="material-symbols-outlined text-6xl text-slate-300 mb-4"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      folder_off
                    </span>
                    <p className="text-slate-500 text-base font-medium">No resources yet</p>
                    <p className="text-slate-400 text-sm mt-1">Resources recommended by Harbor will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                    {folders.map((folder) => {
                      const color = getFolderColor(folder.colorIndex);
                      return (
                        <button
                          key={folder.category}
                          onClick={() => setActiveFolder(folder.category)}
                          className="group flex flex-col items-center gap-3 bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg hover:shadow-slate-200/80 hover:border-slate-300 transition-all cursor-pointer"
                        >
                          <div className={`w-16 h-16 ${color.bg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                            <span
                              className={`material-symbols-outlined text-4xl ${color.text}`}
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {color.icon}
                            </span>
                          </div>
                          <div className="text-center min-w-0 w-full">
                            <h3 className="font-semibold text-sm text-slate-800 truncate">{folder.category}</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {folder.count} item{folder.count !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <BottomNav active="library" isAdmin={isAdmin} />

      {selectedResource && (
        <ResourcePreviewModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}
