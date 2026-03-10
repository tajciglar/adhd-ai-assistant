export function TrustPilotReview() {
  return (
    <div className="flex flex-col items-center space-y-3 mb-6">
      {/* ADHD Parenting logo */}
      <img
        src="/adhd-parenting-logo.png"
        alt="ADHD Parenting"
        className="h-16 object-contain"
      />

      {/* Trustpilot rating */}
      <div className="flex flex-col items-center space-y-1">
        <div className="flex items-center space-x-2">
          <img
            src="/trustpilot-stars.png"
            alt="4.9 out of 5 stars on Trustpilot"
            className="h-5 object-contain"
          />
          <span className="text-xs font-semibold text-harbor-primary">4.9</span>
        </div>
        <p className="text-xs text-harbor-text/50">
          111.813+ satisfied customers
        </p>
      </div>
    </div>
  );
}
