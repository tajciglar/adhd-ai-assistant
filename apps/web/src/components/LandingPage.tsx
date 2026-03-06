import { useNavigate } from "react-router-dom";

const ARCHETYPES = [
  { emoji: "🦊", name: "The Clever Fox", trait: "Talks their way around everything" },
  { emoji: "🐦", name: "The Flash Hummingbird", trait: "Energy that never stops" },
  { emoji: "🐨", name: "The Dreamy Koala", trait: "Always somewhere else in their head" },
  { emoji: "🦔", name: "The Observing Meerkat", trait: "Feels everything, deeply" },
  { emoji: "🐎", name: "The Bold Stallion", trait: "Lives entirely in the present" },
  { emoji: "🐯", name: "The Fierce Tiger", trait: "Feels at full volume, always" },
];

const BENEFITS = [
  {
    icon: "🧠",
    title: "Why they behave the way they do",
    description:
      "Not attitude. Not laziness. Your child's brain is wired differently — and once you understand how, everything changes.",
  },
  {
    icon: "⚡",
    title: "What drains them and what fuels them",
    description:
      "Every ADHD profile has specific triggers and energisers. Knowing yours means fewer battles and more flow.",
  },
  {
    icon: "💬",
    title: "Exactly what to say — and what not to",
    description:
      "Scripts that land. Words to avoid. The difference between connection and shutdown, in plain language.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-harbor-bg">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span className="font-bold text-harbor-primary text-lg tracking-tight">
          Harbor
        </span>
        <button
          type="button"
          onClick={() => navigate("/onboarding")}
          className="text-sm text-harbor-primary font-medium hover:opacity-70 transition"
        >
          Start free →
        </button>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-harbor-accent/10 text-harbor-accent text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <span>Free · Takes 5 minutes · No sign-up</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-harbor-primary leading-tight mb-6">
          What kind of brain
          <br />
          does your child have?
        </h1>

        <p className="text-lg text-harbor-text/70 leading-relaxed mb-10 max-w-xl mx-auto">
          Answer 37 questions about your child and get a free personalised guide
          to their unique ADHD profile — including what fuels them, what drains
          them, and exactly how to support them.
        </p>

        <button
          type="button"
          onClick={() => navigate("/onboarding")}
          className="inline-flex items-center gap-2 bg-harbor-primary text-white text-base font-semibold px-8 py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
        >
          Find out in 5 minutes
          <span aria-hidden>→</span>
        </button>

        <p className="mt-4 text-xs text-harbor-text/40">
          Your answers are private. We only ask for your email at the very end.
        </p>
      </section>

      {/* What you'll get */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-harbor-primary text-center mb-10">
          What you'll discover
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-2xl border border-harbor-text/8 p-6 shadow-sm"
            >
              <div className="text-3xl mb-4">{b.icon}</div>
              <h3 className="font-semibold text-harbor-primary mb-2 leading-snug">
                {b.title}
              </h3>
              <p className="text-sm text-harbor-text/60 leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Archetype preview */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-harbor-primary mb-3">
            6 ADHD profiles. Which one is your child?
          </h2>
          <p className="text-harbor-text/60 max-w-lg mx-auto">
            Every child with ADHD is different. The assessment identifies which
            of these six archetypes fits yours — and gives you a guide built
            specifically around them.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {ARCHETYPES.map((a) => (
            <div
              key={a.name}
              className="bg-white rounded-2xl border border-harbor-text/8 p-5 shadow-sm text-center"
            >
              <div className="text-4xl mb-3">{a.emoji}</div>
              <div className="text-sm font-semibold text-harbor-primary mb-1">
                {a.name}
              </div>
              <div className="text-xs text-harbor-text/50 leading-snug">
                {a.trait}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="inline-flex items-center gap-2 bg-harbor-primary text-white text-base font-semibold px-8 py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            Discover your child's profile
            <span aria-hidden>→</span>
          </button>
          <p className="mt-3 text-xs text-harbor-text/40">Free. No account needed.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-harbor-text/8 py-8 px-6 text-center">
        <p className="text-xs text-harbor-text/30">
          © {new Date().getFullYear()} Harbor. For informational purposes — not a clinical diagnosis.
        </p>
      </footer>
    </div>
  );
}
