import Mascot from "./Mascot";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-harbor-bg flex flex-col items-center justify-center gap-4">
      <Mascot size={64} mood="thinking" />
      <p className="text-harbor-text/50 text-sm font-medium">Loading...</p>
    </div>
  );
}
