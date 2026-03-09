export default function HalfwayScreen({
  childName,
  pronoun,
  onContinue,
}: {
  childName: string;
  pronoun: string;
  onContinue: () => void;
}) {
  return (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-7 space-y-4 text-center">
          <div className="text-5xl">💜</div>
          <h2 className="text-xl font-bold text-harbor-primary leading-snug">
            You're halfway there.
          </h2>
          <p className="text-harbor-text/70 leading-relaxed">
            {childName} is lucky to have a parent who wants to understand {pronoun} this deeply.
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
