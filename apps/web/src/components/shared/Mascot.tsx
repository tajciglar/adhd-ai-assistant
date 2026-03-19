export type MascotMood = "default" | "thinking" | "happy" | "waving";

export default function Mascot({
  size = 64,
  mood = "default",
  className = "",
}: {
  size?: number;
  mood?: MascotMood;
  className?: string;
}) {
  const scale = size / 120;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 120"
        fill="none"
        width={size}
        height={size}
        role="img"
        aria-label="Harbor mascot"
      >
        <style>{`
          @keyframes mascot-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-${3 * scale}px); }
          }
          @keyframes mascot-think {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-${2 * scale}px) rotate(-3deg); }
            75% { transform: translateY(-${2 * scale}px) rotate(3deg); }
          }
          @keyframes mascot-wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg); }
            75% { transform: rotate(5deg); }
          }
          @keyframes mascot-wave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-15deg); }
            75% { transform: rotate(15deg); }
          }
          .mascot-group {
            transform-origin: 60px 60px;
            ${mood === "thinking" ? "animation: mascot-think 1.5s ease-in-out infinite;" : ""}
            ${mood === "happy" ? "animation: mascot-wiggle 0.5s ease-in-out 2;" : ""}
            ${mood === "waving" ? "animation: mascot-bounce 1.2s ease-in-out infinite;" : ""}
          }
          .mascot-arm-left {
            transform-origin: 36px 50px;
            ${mood === "waving" ? "animation: mascot-wave 0.6s ease-in-out infinite;" : ""}
          }
        `}</style>

        <g className="mascot-group">
          {/* Parent figure (purple) */}
          <circle cx="52" cy="28" r="16" fill="#7040CA" />

          {/* Eyes — shift up when thinking */}
          {mood === "thinking" ? (
            <>
              <circle cx="46" cy="23" r="2.5" fill="white" />
              <circle cx="58" cy="23" r="2.5" fill="white" />
              {/* Thinking dots */}
              <circle cx="72" cy="14" r="2" fill="#FACB9E" opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="78" cy="8" r="2.5" fill="#FACB9E" opacity="0.6">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
              </circle>
            </>
          ) : (
            <>
              <circle cx="46" cy="26" r="2.5" fill="white" />
              <circle cx="58" cy="26" r="2.5" fill="white" />
            </>
          )}

          {/* Smile — bigger when happy */}
          {mood === "happy" ? (
            <path d="M44 32 Q52 41 60 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : mood === "thinking" ? (
            <circle cx="52" cy="34" r="2" fill="white" opacity="0.7" />
          ) : (
            <path d="M46 33 Q52 39 58 33" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}

          {/* Happy blush cheeks */}
          {mood === "happy" && (
            <>
              <circle cx="40" cy="32" r="3" fill="#FACB9E" opacity="0.6" />
              <circle cx="64" cy="32" r="3" fill="#FACB9E" opacity="0.6" />
            </>
          )}

          {/* Body */}
          <path d="M36 44 Q36 38 44 38 L60 38 Q68 38 68 44 L68 72 Q68 80 60 80 L44 80 Q36 80 36 72 Z" fill="#7040CA" />

          {/* Arms */}
          <g className="mascot-arm-left">
            <path d="M36 50 Q28 48 24 56" stroke="#7040CA" strokeWidth="6" strokeLinecap="round" fill="none" />
          </g>
          <path d="M68 50 Q76 48 80 56" stroke="#7040CA" strokeWidth="6" strokeLinecap="round" fill="none" />

          {/* Child figure (orange) */}
          <circle cx="82" cy="52" r="12" fill="#F5841F" />
          <circle cx="77" cy="50" r="2" fill="white" />
          <circle cx="87" cy="50" r="2" fill="white" />
          <path d="M78 56 Q82 60 86 56" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M72 64 Q72 60 76 60 L88 60 Q92 60 92 64 L92 82 Q92 88 88 88 L76 88 Q72 88 72 82 Z" fill="#F5841F" />

          {/* Heart between them */}
          <path d="M62 62 C62 58 68 56 68 60 C68 56 74 58 74 62 C74 68 68 72 68 72 C68 72 62 68 62 62Z" fill="#FACB9E">
            {mood === "happy" && (
              <animate attributeName="opacity" values="0.6;1;0.6" dur="0.8s" repeatCount="3" />
            )}
          </path>
        </g>
      </svg>
    </div>
  );
}
