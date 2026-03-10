export default function HalfwayScreen({
  childName,
  onContinue,
}: {
  childName: string;
  onContinue: () => void;
}) {
  return (
    <div className="h-[100dvh] bg-harbor-bg flex items-center justify-center px-6 py-12 overflow-hidden">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-7 space-y-4 text-center">
          <div className="text-5xl">💜</div>
          <h2 className="text-xl font-bold text-harbor-primary leading-snug">
            You're halfway there.
          </h2>
          <p className="text-harbor-text leading-relaxed">
            Most parents never take the time to look this closely at how their
            child's brain actually works. {childName} is lucky to have you.
          </p>
          <p className="text-harbor-text text-sm leading-relaxed">
            Join 12,000+ parents who've already discovered their child's
            Wildprint.
          </p>
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
