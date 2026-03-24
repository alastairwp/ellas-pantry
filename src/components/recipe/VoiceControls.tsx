"use client";

import { useState, useEffect, useCallback } from "react";
import { Mic, Volume2, MicOff, X } from "lucide-react";

interface VoiceControlsProps {
  isActive: boolean;
  toggle: () => void;
  sttSupported: boolean;
  ttsSupported: boolean;
  isListening: boolean;
  transcript: string;
  lastCommand: string;
  micError: string;
}

const VOICE_COMMANDS = [
  { command: "Next", alt: "Next step" },
  { command: "Back", alt: "Go back" },
  { command: "Repeat", alt: "Read again" },
  { command: "Start timer", alt: null },
  { command: "Pause", alt: "Stop" },
  { command: "Resume", alt: "Continue" },
];

export function VoiceControls({
  isActive,
  toggle,
  sttSupported,
  ttsSupported,
  isListening,
  transcript,
  lastCommand,
  micError,
}: VoiceControlsProps) {
  const [showSttNote, setShowSttNote] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [dismissedCommands, setDismissedCommands] = useState(false);

  // Show STT-unavailable note when voice is activated without STT
  useEffect(() => {
    if (isActive && !sttSupported) {
      setShowSttNote(true);
      const timer = setTimeout(() => setShowSttNote(false), 5000);
      return () => clearTimeout(timer);
    }
    setShowSttNote(false);
  }, [isActive, sttSupported]);

  // Show command reference when voice+STT is active, unless user dismissed it
  useEffect(() => {
    if (isActive && sttSupported && !dismissedCommands) {
      setShowCommands(true);
    }
    if (!isActive) {
      setShowCommands(false);
      setDismissedCommands(false);
    }
  }, [isActive, sttSupported, dismissedCommands]);

  const dismissCommands = useCallback(() => {
    setShowCommands(false);
    setDismissedCommands(true);
  }, []);

  if (!ttsSupported) return null;

  const isTTSOnly = isActive && !sttSupported;
  const isTTSAndSTT = isActive && sttSupported;
  const hasMicError = isActive && !!micError;

  return (
    <>
      {/* Voice toggle button */}
      <button
        type="button"
        onClick={toggle}
        className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
          hasMicError
            ? "bg-red-600 text-white"
            : isActive
              ? "bg-amber-600 text-white"
              : "bg-stone-800 text-stone-400 hover:text-white"
        }`}
        aria-label={isActive ? "Turn off voice mode" : "Turn on voice mode"}
      >
        {hasMicError ? (
          <MicOff className="h-5 w-5" />
        ) : isTTSOnly ? (
          <Volume2 className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        {/* Pulsing ring for active TTS+STT */}
        {isTTSAndSTT && isListening && !hasMicError && (
          <span className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-50" />
        )}
      </button>

      {/* Re-show commands button (after user dismissed) */}
      {isTTSAndSTT && dismissedCommands && (
        <button
          type="button"
          onClick={() => setDismissedCommands(false)}
          className="flex items-center justify-center px-2 h-11 rounded-full bg-stone-800 text-stone-400 hover:text-white transition-colors text-xs font-medium"
          aria-label="Show voice commands"
        >
          ?
        </button>
      )}

      {/* Command reference — shown persistently when voice+STT is active */}
      {showCommands && isTTSAndSTT && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] w-80 max-w-[calc(100vw-2rem)] px-4 py-3 bg-stone-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-stone-700/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
              Voice Commands
            </p>
            <button
              type="button"
              onClick={dismissCommands}
              className="p-0.5 text-stone-500 hover:text-white transition-colors"
              aria-label="Dismiss commands"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {VOICE_COMMANDS.map(({ command, alt }) => (
              <p key={command} className="text-xs text-stone-300">
                <span className="text-white font-medium">&ldquo;{command}&rdquo;</span>
                {alt && <span className="text-stone-500"> / &ldquo;{alt}&rdquo;</span>}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Transcript flash */}
      {isActive && (transcript || lastCommand) && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-stone-800/90 rounded-full text-sm text-white max-w-xs text-center">
          {transcript && <span>{transcript}</span>}
          {lastCommand && (
            <span className="ml-2 text-amber-400 font-medium">{lastCommand}</span>
          )}
        </div>
      )}

      {/* Mic error message */}
      {hasMicError && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-red-900/90 rounded-xl text-xs text-red-200 max-w-xs text-center">
          {micError}
        </div>
      )}

      {/* STT unavailable note */}
      {showSttNote && !micError && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-stone-800/90 rounded-full text-xs text-stone-300 max-w-xs text-center">
          Voice commands aren&apos;t available in this browser. Steps will be read aloud.
        </div>
      )}
    </>
  );
}
