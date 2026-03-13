import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import type { Resource } from "../../types/admin";

const FILTERS = ["All", "PDFs", "Articles", "Checklists"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_ICONS: Record<Filter, string> = {
  All: "expand_more",
  PDFs: "picture_as_pdf",
  Articles: "article",
  Checklists: "checklist",
};

function getResourceIcon(resource: Resource): { icon: string; bg: string; color: string } {
  const cat = resource.category?.toLowerCase() ?? "";
  if (cat.includes("video")) return { icon: "play_circle", bg: "bg-emerald-100", color: "text-emerald-600" };
  if (cat.includes("article")) return { icon: "article", bg: "bg-blue-100", color: "text-blue-600" };
  if (cat.includes("checklist") || cat.includes("printable"))
    return { icon: "task_alt", bg: "bg-purple-100", color: "text-harbor-primary" };
  return { icon: "picture_as_pdf", bg: "bg-red-100", color: "text-red-600" };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Placeholder resources when DB is empty
const PLACEHOLDER_RESOURCES = [
  { id: "p1", title: "IEP Meeting Checklist", description: "", category: "PDF", filename: "", originalName: "", sizeBytes: 1228800, createdAt: "" },
  { id: "p2", title: "Calm Down Corner Guide", description: "", category: "Article", filename: "", originalName: "", sizeBytes: 0, createdAt: "" },
  { id: "p3", title: "Morning Routine Visuals", description: "", category: "Checklist", filename: "", originalName: "", sizeBytes: 0, createdAt: "" },
  { id: "p4", title: "Executive Function 101", description: "", category: "Video", filename: "", originalName: "", sizeBytes: 0, createdAt: "" },
  { id: "p5", title: "Homework Battle Survival Kit", description: "", category: "PDF", filename: "", originalName: "", sizeBytes: 0, createdAt: "" },
];

// Desktop card color variants
const CARD_GRADIENTS = [
  "from-harbor-primary/10 to-transparent",
  "from-blue-100/30 to-purple-100/30",
  "from-amber-50 to-orange-50",
  "from-green-50 to-teal-50",
  "from-pink-50 to-rose-50",
  "from-indigo-50 to-blue-50",
];

const CARD_TAG_STYLES = [
  { bg: "bg-harbor-primary/20", text: "text-harbor-primary" },
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-green-100", text: "text-green-600" },
  { bg: "bg-pink-100", text: "text-pink-600" },
  { bg: "bg-indigo-100", text: "text-indigo-600" },
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

  const displayResources = resources.length > 0 ? resources : (PLACEHOLDER_RESOURCES as Resource[]);

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
        {/* Mobile Header */}
        <div className="md:hidden flex items-center bg-white p-4 pb-2 justify-between sticky top-0 z-10 border-b border-harbor-primary/5">
          <button
            onClick={() => navigate(-1)}
            className="text-harbor-primary flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-harbor-primary/10 cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            Resource Library
          </h2>
          <div className="flex w-10 items-center justify-end">
            <button className="flex items-center justify-center rounded-full size-10 bg-transparent text-harbor-primary hover:bg-harbor-primary/10">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <header className="hidden md:flex h-16 border-b border-harbor-primary/10 bg-white items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="w-full bg-harbor-primary/5 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-harbor-primary/20 outline-none"
                placeholder="Search guides, articles, and reports..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-harbor-primary/5 text-slate-500">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {/* Search (mobile) */}
        <div className="md:hidden px-4 py-4 sticky top-[60px] bg-harbor-bg/95 backdrop-blur-md z-10">
          <div className="flex w-full items-stretch rounded-xl h-12 shadow-sm">
            <div className="text-harbor-primary/60 flex bg-white items-center justify-center pl-4 rounded-l-xl">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              className="flex w-full min-w-0 flex-1 border-none bg-white rounded-r-xl focus:outline-none focus:ring-0 h-full placeholder:text-slate-400 px-4 pl-2 text-base"
              placeholder="Search PDFs and articles"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 px-4 md:px-8 pb-4 md:pt-6 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 text-sm font-semibold transition-colors cursor-pointer ${
                activeFilter === f
                  ? "bg-harbor-primary text-white shadow-md shadow-harbor-primary/20"
                  : "bg-white border border-harbor-primary/10 text-slate-600 hover:border-harbor-primary/30"
              }`}
            >
              <span>{f}</span>
              <span className="material-symbols-outlined text-sm">{FILTER_ICONS[f]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile: list view */}
          <div className="md:hidden flex flex-col flex-1 px-4 pb-28">
            <h3 className="text-slate-900 text-lg font-bold leading-tight tracking-tight pb-3 pt-2">
              Saved Resources
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {displayResources.map((resource) => {
                const iconStyle = getResourceIcon(resource);
                return (
                  <div
                    key={resource.id}
                    className="flex items-center gap-4 bg-white p-4 rounded-xl border border-harbor-primary/5 hover:border-harbor-primary/20 transition-colors shadow-sm cursor-pointer"
                  >
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg ${iconStyle.bg} ${iconStyle.color}`}>
                      <span className="material-symbols-outlined text-3xl">{iconStyle.icon}</span>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <h4 className="text-slate-900 font-bold text-base truncate">{resource.title}</h4>
                      <p className="text-slate-500 text-sm">
                        {resource.category || "PDF"}
                        {resource.sizeBytes > 0 && ` \u2022 ${formatFileSize(resource.sizeBytes)}`}
                      </p>
                    </div>
                    <div className="text-slate-400">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop: grid view */}
          <div className="hidden md:block p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Library</h2>
                <p className="text-sm text-slate-500">Access your personalized guides and saved resources</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {displayResources.map((resource, i) => {
                const gradientIdx = i % CARD_GRADIENTS.length;
                const tagStyle = CARD_TAG_STYLES[gradientIdx];
                const iconStyle = getResourceIcon(resource);
                return (
                  <div
                    key={resource.id}
                    className="group flex flex-col bg-white rounded-xl border border-harbor-primary/10 overflow-hidden hover:shadow-xl hover:shadow-harbor-primary/5 transition-all cursor-pointer"
                  >
                    <div className="aspect-[3/4] relative bg-harbor-primary/5 p-4 flex flex-col justify-end overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${CARD_GRADIENTS[gradientIdx]}`} />
                      <span className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-lg text-harbor-primary shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </span>
                      <div className="relative z-10">
                        <span className={`px-2 py-1 ${tagStyle.bg} ${tagStyle.text} text-[10px] font-bold rounded uppercase tracking-wider mb-2 inline-block`}>
                          {resource.category || "PDF"}
                        </span>
                        <span className={`block material-symbols-outlined text-4xl ${iconStyle.color} opacity-40 mb-2`}>
                          {iconStyle.icon}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm text-slate-800 truncate">{resource.title}</h3>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {resource.sizeBytes > 0 ? formatFileSize(resource.sizeBytes) : resource.category}
                      </p>
                    </div>
                  </div>
                );
              })}
              {/* Upload placeholder */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-harbor-primary/10 rounded-xl aspect-[3/4] p-6 text-center hover:bg-harbor-primary/5 hover:border-harbor-primary/20 transition-all cursor-pointer group">
                <span className="material-symbols-outlined text-3xl text-harbor-primary/30 group-hover:scale-110 transition-transform mb-2">
                  upload_file
                </span>
                <p className="text-xs font-semibold text-slate-400">Upload custom document</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="library" />
    </div>
  );
}
