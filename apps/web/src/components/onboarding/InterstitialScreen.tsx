import type { CategoryId } from "@adhd-ai-assistant/shared";

interface InterstitialCard {
  emoji: string;
  headline: string;
  body: string[];
}

const CARDS: Record<CategoryId, InterstitialCard> = {
  inattentive: {
    emoji: "🧩",
    headline: "The gap is real.",
    body: [
      "Children with ADHD are up to 3 years behind their peers in reading, writing, and math. Not because they lack intelligence, but because their attention system works differently.",
      "Source: Barkley, 2015; Journal of Abnormal Child Psychology",
      "Understanding {childName}'s attention patterns is the first step to closing that gap.",
    ],
  },
  hyperactive: {
    emoji: "⚡",
    headline: "Energy isn't the problem. Direction is.",
    body: [
      "Children with high activity levels often have exceptional drive and creativity. The goal isn't to slow them down, it's to channel what's already there.",
    ],
  },
  sensory: {
    emoji: "🎧",
    headline: "The world genuinely feels louder for some children.",
    body: [
      "Sensory sensitivity affects up to 1 in 6 children and is one of the most misunderstood parts of ADHD. It's not drama, it's neurology.",
    ],
  },
  emotional: {
    emoji: "💛",
    headline: "Big emotions aren't bad behaviour.",
    body: [
      "Children with ADHD experience emotions more intensely than their peers. With the right support, they don't just cope, they learn to lead with it.",
    ],
  },
  executive_function: {
    emoji: "⭐",
    headline: "You're in good hands.",
    body: [
      "This quiz was built by the team behind ADHD Parenting, rated 4.9 on Trustpilot with over 111,000 satisfied parents.",
      "We organised the world's largest ADHD Parenting Summit, with over 250,000 registered parents, and have collaborated with 70+ world-renowned ADHD experts including Dr Edward Hallowell, Dr Peg Dawson, Dr Richard Guare, and Elaine Taylor-Klaus.",
      "One more section to go.",
    ],
  },
  social: {
    emoji: "🤝",
    headline: "Connection matters more than compliance.",
    body: [
      "Children who struggle socially aren't choosing to be difficult. They're missing a map, and once they have it, things shift faster than most parents expect.",
    ],
  },
};

export default function InterstitialScreen({
  categoryId,
  childName,
  onContinue,
}: {
  categoryId: CategoryId;
  childName?: string;
  onContinue: () => void;
}) {
  const card = CARDS[categoryId];
  if (!card) return null;
  const name = childName || "your child";

  return (
    <div className="h-[100dvh] bg-harbor-bg flex items-center justify-center px-6 py-12 overflow-hidden">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-7 space-y-4 text-center">
          <div className="text-5xl">{card.emoji}</div>
          <h2 className="text-xl font-bold text-harbor-primary leading-snug">
            {card.headline}
          </h2>
          {card.body.map((paragraph, i) => {
            const isSource = paragraph.toLowerCase().startsWith("source:");
            const text = paragraph.replace(/\{childName\}/g, name);
            return (
              <p
                key={i}
                className={
                  isSource
                    ? "text-harbor-text/50 text-xs italic leading-relaxed"
                    : "text-harbor-text leading-relaxed"
                }
              >
                {text}
              </p>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-xl bg-harbor-primary text-white px-5 py-4 font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
