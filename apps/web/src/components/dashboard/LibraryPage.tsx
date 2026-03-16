import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import type { Resource } from "../../types/admin";

const FILTERS = ["All", "PDFs", "Articles", "Checklists"] as const;
type Filter = (typeof FILTERS)[number];

interface ResourceStyle {
  icon: string;
  bg: string;
  color: string;
  label: string;
  cardAccent: string;
}

function getResourceStyle(resource: Resource): ResourceStyle {
  const cat = (resource.category ?? "").toLowerCase();
  if (cat.includes("video"))
    return { icon: "play_circle", bg: "bg-emerald-50", color: "text-emerald-600", label: "Video", cardAccent: "border-t-emerald-200" };
  if (cat.includes("article"))
    return { icon: "article", bg: "bg-sky-50", color: "text-sky-600", label: "Article", cardAccent: "border-t-sky-200" };
  if (cat.includes("checklist") || cat.includes("printable"))
    return { icon: "task_alt", bg: "bg-harbor-surface-soft", color: "text-harbor-primary", label: "Checklist", cardAccent: "border-t-harbor-primary/20" };
  return { icon: "picture_as_pdf", bg: "bg-red-50", color: "text-red-500", label: "PDF", cardAccent: "border-t-red-200" };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const PLACEHOLDER_RESOURCES: Resource[] = [
  { id: "p1", title: "IEP Meeting Checklist",      description: "", category: "PDF",       filename: "", originalName: "", sizeBytes: 1228800, createdAt: "" } as Resource,
  { id: "p2", title: "Calm Down Corner Guide",     description: "", category: "Article",   filename: "", originalName: "", sizeBytes: 0,       createdAt: "" } as Resource,
  { id: "p3", title: "Morning Routine Visuals",    description: "", category: "Checklist", filename: "", originalName: "", sizeBytes: 0,       createdAt: "" } as Resource,
  { id: "p4", title: "Executive Function 101",     description: "", category: "Video",     filename: "", originalName: "", sizeBytes: 0,       createdAt: "" } as Resource,
  { id: "p5", title: "Homework Battle Survival Kit", description: "", category: "PDF",    filename: "", originalName: "", sizeBytes: 0,       createdAt: "" } as Resource,
];

export default function LibraryPage() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/resources").catch(() => ({ resources: [] })),
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

  const displayResources = resources.length > 0 ? resources : PLACEHOLDER_RESOURCES;

  const filtered = displayResources.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const cat = (r.category ?? "").toLowerCase();
    const matchFilter =
      activeFilter === "All" ||
      (activeFilter === "PDFs" && cat.includes("pdf")) ||
      (activeFilter === "Articles" && cat.includes("article")) ||
      (activeFilter === "Checklists" && (cat.includes("checklist") || cat.includes("printable")));
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-harbor-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-harbor-bg">
      <DesktopSidebar active="library" isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col">
        {/* ── Mobile Header ── */}
        <div className="md:hidden flex items-center bg-white px-4 py-3 justify-between sticky top-0 z-10 border-b border-slate-100">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-600 flex w-9 h-9 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h2 className="text-slate-900 text-base font-bold flex-1 text-center">Library</h2>
          <button className="flex items-center justify-center rounded-full w-9 h-9 text-slate-500 hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-[20px]">bookmark</span>
          </button>
        </div>

        {/* ── Desktop Header ── */}
        <header className="hidden md:flex h-16 border-b border-slate-100 bg-white items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-200 outline-none transition-all"
                placeholder="Search guides, articles, and reports…"
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
              className="flex-1 bg-transparent px-2 h-full focus:outline-none text-sm placeholder:text-slate-400"
              placeholder="Search resources…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex gap-2 px-4 md:px-8 pb-3 md:pt-5 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all cursor-pointer ${
                activeFilter === f
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile list */}
          <div className="md:hidden flex flex-col px-4 pb-28 gap-2">
            <p className="text-slate-500 text-xs font-medium pt-1 pb-2">
              {filtered.length} resource{filtered.length !== 1 ? "s" : ""}
            </p>
            {filtered.map((resource) => {
              const style = getResourceStyle(resource);
              return (
                <button
                  key={resource.id}
                  className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer text-left w-full"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
                    <span
                      className={`material-symbols-outlined text-2xl ${style.color}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {style.icon}
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
            })}
          </div>

          {/* Desktop grid */}
          <div className="hidden md:block p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Library</h2>
              <p className="text-sm text-slate-500 mt-1">
                Your personalized guides and saved resources
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filtered.map((resource) => {
                const style = getResourceStyle(resource);
                return (
                  <button
                    key={resource.id}
                    className="group flex flex-col bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg hover:shadow-slate-200/80 hover:border-slate-200 transition-all cursor-pointer text-left"
                  >
                    {/* Thumbnail area — consistent neutral background */}
                    <div className="aspect-[3/4] relative bg-harbor-bg flex flex-col items-center justify-center p-6">
                      {/* Large icon */}
                      <div className={`w-16 h-16 ${style.bg} rounded-2xl flex items-center justify-center mb-3 shadow-sm`}>
                        <span
                          className={`material-symbols-outlined text-4xl ${style.color}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {style.icon}
                        </span>
                      </div>
                      {/* Category badge */}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {style.label}
                      </span>

                      {/* Hover action */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-500">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </div>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="px-4 py-3 border-t border-slate-50">
                      <h3 className="font-semibold text-sm text-slate-800 truncate">{resource.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {resource.sizeBytes > 0 ? formatFileSize(resource.sizeBytes) : style.label}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Upload card */}
              <button className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl aspect-[3/4] p-6 text-center hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-slate-400 text-2xl group-hover:text-slate-600 transition-colors">
                    upload_file
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                  Upload document
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="library" />
    </div>
  );
}
