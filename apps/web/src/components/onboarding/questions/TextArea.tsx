import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface TextAreaProps {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TextArea({
  title,
  subtitle,
  value,
  onChange,
  placeholder,
}: TextAreaProps) {
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningBaseValueRef = useRef("");
  const shouldKeepListeningRef = useRef(false);
  const currentValueRef = useRef(value);
  const speechSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      shouldKeepListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const getRecognition = (): SpeechRecognitionLike | null => {
    if (recognitionRef.current) return recognitionRef.current;

    const recognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!recognitionConstructor) return null;

    const recognition = new recognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || "";

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const base = listeningBaseValueRef.current;
      const separator = base.trim().length > 0 ? " " : "";
      onChange(`${base}${separator}${finalTranscript}${interimTranscript}`);
    };

    recognition.onerror = (event) => {
      const reason = event.error ? ` (${event.error})` : "";
      setSpeechError(`Voice input failed${reason}. You can keep typing.`);
      shouldKeepListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (shouldKeepListeningRef.current) {
        // Browsers may stop recognition after silence; restart seamlessly.
        listeningBaseValueRef.current = currentValueRef.current.trimEnd();
        setTimeout(() => {
          if (!shouldKeepListeningRef.current) return;
          try {
            recognition.start();
            setIsListening(true);
          } catch {
            shouldKeepListeningRef.current = false;
            setIsListening(false);
          }
        }, 250);
        return;
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  const toggleDictation = () => {
    setSpeechError("");

    const recognition = getRecognition();
    if (!recognition) {
      setSpeechError(
        "Speech-to-text is not available in this browser. Please type your response.",
      );
      return;
    }

    if (isListening) {
      shouldKeepListeningRef.current = false;
      recognition.stop();
      return;
    }

    shouldKeepListeningRef.current = true;
    listeningBaseValueRef.current = value.trimEnd();
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      shouldKeepListeningRef.current = false;
      setSpeechError("Could not start voice input. Please try again.");
      setIsListening(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-harbor-text mb-2">{title}</h2>
      {subtitle && <p className="text-harbor-text/50 mb-3">{subtitle}</p>}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-harbor-text/40">
          Type your response or use voice dictation.
        </p>
        {speechSupported && (
          <button
            type="button"
            onClick={toggleDictation}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isListening
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-harbor-accent/10 text-harbor-accent hover:bg-harbor-accent/20"
            }`}
          >
            {isListening ? "Stop dictation" : "Start dictation"}
          </button>
        )}
      </div>
      {speechError && (
        <p className="text-sm text-red-600 mb-3" role="alert">
          {speechError}
        </p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        maxLength={5000}
        className="w-full p-4 rounded-xl border-2 border-harbor-primary/15 focus:border-harbor-accent focus:ring-2 focus:ring-harbor-accent/20 bg-white text-harbor-text outline-none transition-all resize-none text-lg leading-relaxed"
        autoFocus
      />
      <p className="text-sm text-harbor-text/30 mt-2 text-right">
        {value.length} / 5,000
      </p>
    </div>
  );
}
