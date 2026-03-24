import type { AdminSection } from "./AdminSidebar";
import type { AdminStats } from "../../types/admin";

interface AdminOverviewProps {
  stats: AdminStats | null;
  totalResources: number;
  totalTemplates: number;
  onOpenSection: (section: AdminSection) => void;
  onPrimaryAction: () => void;
}

const sectionCards: Array<{
  section: AdminSection;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    section: "knowledge",
    title: "Update AI answers",
    description: "Add or edit the parenting advice Harbor can cite during chats.",
    icon: "psychology",
  },
  {
    section: "resources",
    title: "Upload parent downloads",
    description: "Manage PDFs, checklists, and guides Harbor can recommend.",
    icon: "folder_open",
  },
  {
    section: "feedback",
    title: "Review bad answers",
    description: "Check thumbs-down ratings and spot responses that need work.",
    icon: "thumb_down",
  },
  {
    section: "insights",
    title: "See what parents need",
    description: "Find repeated questions and content gaps across conversations.",
    icon: "insights",
  },
];

export default function AdminOverview({
  stats,
  totalResources,
  totalTemplates,
  onOpenSection,
  onPrimaryAction,
}: AdminOverviewProps) {
  const totalEntries = stats?.totalEntries ?? 0;
  const totalUsers = stats?.totalUsers ?? 0;
  const totalLikes = stats?.totalLikes ?? 0;
  const totalDislikes = stats?.totalDislikes ?? 0;
  const totalRatings = totalLikes + totalDislikes;
  const approvalRate = totalRatings > 0 ? Math.round((totalLikes / totalRatings) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-harbor-primary to-harbor-primary/85 p-6 text-white shadow-lg shadow-harbor-primary/15">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Admin Overview
              </p>
              <h1 className="mt-2 text-3xl font-bold font-display">Run Harbor without the guesswork</h1>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Start with the tasks your team does most often: improve AI answers, upload resources,
                and review what parents are struggling with.
              </p>
            </div>
            <button
              onClick={onPrimaryAction}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-harbor-primary transition-colors hover:bg-white/90 cursor-pointer"
            >
              Add New AI Answer
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-harbor-text/8 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-harbor-text/40">AI Answers</p>
            <p className="mt-2 text-3xl font-bold text-harbor-text">{totalEntries}</p>
            <p className="mt-1 text-sm text-harbor-text/55">Published guidance topics available to Harbor.</p>
          </div>
          <div className="rounded-2xl border border-harbor-text/8 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-harbor-text/40">Parent Downloads</p>
            <p className="mt-2 text-3xl font-bold text-harbor-text">{totalResources}</p>
            <p className="mt-1 text-sm text-harbor-text/55">Files Harbor can recommend during chat.</p>
          </div>
          <div className="rounded-2xl border border-harbor-text/8 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-harbor-text/40">Quiz Reports</p>
            <p className="mt-2 text-3xl font-bold text-harbor-text">{totalTemplates}</p>
            <p className="mt-1 text-sm text-harbor-text/55">Archetype report templates powering summaries.</p>
          </div>
          <div className="rounded-2xl border border-harbor-text/8 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-harbor-text/40">Answer Approval</p>
            <p className="mt-2 text-3xl font-bold text-harbor-text">
              {totalRatings > 0 ? `${approvalRate}%` : "No ratings"}
            </p>
            <p className="mt-1 text-sm text-harbor-text/55">
              Based on {totalRatings} user rating{totalRatings === 1 ? "" : "s"}.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="rounded-3xl border border-harbor-text/8 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-harbor-text">Most common tasks</h2>
                <p className="text-sm text-harbor-text/50">
                  Use plain-language shortcuts instead of hunting through the sidebar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sectionCards.map((card) => (
                <button
                  key={card.section}
                  onClick={() => onOpenSection(card.section)}
                  className="rounded-2xl border border-harbor-text/8 bg-harbor-bg/45 p-4 text-left transition-colors hover:border-harbor-primary/20 hover:bg-white cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-harbor-primary/10 text-harbor-primary">
                      <span className="material-symbols-outlined text-[22px]">{card.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-harbor-text">{card.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-harbor-text/55">{card.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-harbor-text/8 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-harbor-text">Team notes</h2>
            <div className="mt-4 space-y-4 text-sm leading-6 text-harbor-text/60">
              <div>
                <p className="font-medium text-harbor-text">Improve AI quality first</p>
                <p>When users dislike an answer, update the AI answer library before adding more design polish.</p>
              </div>
              <div>
                <p className="font-medium text-harbor-text">Keep wording parent-friendly</p>
                <p>Write titles the way a parent would ask the question. That improves both search and retrieval.</p>
              </div>
              <div>
                <p className="font-medium text-harbor-text">Current audience size</p>
                <p>{totalUsers} total account{totalUsers === 1 ? "" : "s"} currently tracked in Harbor.</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
