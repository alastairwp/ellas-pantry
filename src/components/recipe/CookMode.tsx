"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CookingPot,
  Timer,
  Pause,
  Play,
  ListOrdered,
  Clock,
} from "lucide-react";
import { parseTimers, type ParsedTimer } from "@/lib/parse-timers";
import { useSkillLevel } from "@/lib/skill-level";
import { requestNotificationPermission } from "@/lib/notifications";
import { useVoiceCook } from "@/lib/use-voice-cook";
import { TimelineView } from "./TimelineView";
import { VoiceControls } from "./VoiceControls";

interface Step {
  stepNumber: number;
  instruction: string;
  tipText?: string | null;
}

interface CookModeProps {
  title: string;
  steps: Step[];
  recipeId?: number;
  prepTime?: number | null;
  cookTime?: number | null;
}

interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remaining: number;
  running: boolean;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function playAlert() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    // Three beeps
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.65);
  } catch {
    // Audio not supported
  }
}

export function CookModeButton({ title, steps, recipeId, prepTime, cookTime }: CookModeProps) {
  const [open, setOpen] = useState(false);
  const { adaptedSteps, skillLevel } = useSkillLevel();

  if (steps.length === 0) return null;

  const cacheKey = `${recipeId}:${skillLevel}`;
  const displaySteps =
    recipeId && skillLevel !== "intermediate" && adaptedSteps[cacheKey]
      ? adaptedSteps[cacheKey]
      : steps;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
      >
        <CookingPot className="h-4 w-4" />
        Start Cooking
      </button>

      {open && (
        <CookModeOverlay
          title={title}
          steps={displaySteps}
          prepTime={prepTime}
          cookTime={cookTime}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function InstructionWithTimers({
  instruction,
  onStartTimer,
}: {
  instruction: string;
  onStartTimer: (timer: ParsedTimer) => void;
}) {
  const timers = parseTimers(instruction);

  if (timers.length === 0) {
    return <span>{instruction}</span>;
  }

  return (
    <span>
      {instruction}
      <span className="flex flex-wrap justify-center gap-2 mt-4">
        {timers.map((timer) => (
          <button
            key={timer.label}
            type="button"
            onClick={() => onStartTimer(timer)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-full transition-colors"
          >
            <Timer className="h-3.5 w-3.5" />
            {timer.label}
          </button>
        ))}
      </span>
    </span>
  );
}

function CookModeOverlay({
  title,
  steps,
  onClose,
}: CookModeProps & { onClose: () => void }) {
  const [viewMode, setViewMode] = useState<"step" | "timeline">("step");
  const [current, setCurrent] = useState(0);
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const timerIdCounter = useRef(0);
  const total = steps.length;
  const step = steps[current];

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => Math.max(0, c - 1));
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => Math.min(total - 1, c + 1));
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next, onClose]);

  // Wake lock
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake lock not supported or denied
      }
    }
    requestWakeLock();
    return () => {
      wakeLock?.release();
    };
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    const hasRunning = timers.some((t) => t.running && t.remaining > 0);
    if (!hasRunning) return;

    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (!t.running || t.remaining <= 0) return t;
          const newRemaining = t.remaining - 1;
          if (newRemaining === 0) {
            playAlert();
          }
          return { ...t, remaining: newRemaining };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timers]);

  const startTimer = useCallback((parsed: ParsedTimer) => {
    timerIdCounter.current += 1;
    setTimers((prev) => [
      ...prev,
      {
        id: String(timerIdCounter.current),
        label: parsed.label,
        totalSeconds: parsed.seconds,
        remaining: parsed.seconds,
        running: true,
      },
    ]);
  }, []);

  const toggleTimer = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, running: !t.running } : t))
    );
  }, []);

  const removeTimer = useCallback((id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Voice cook mode
  const voiceOnStartTimer = useCallback(() => {
    const parsed = parseTimers(step.instruction);
    if (parsed.length > 0) startTimer(parsed[0]);
  }, [step.instruction, startTimer]);

  const voiceOnPauseTimer = useCallback(() => {
    const running = timers.find((t) => t.running && t.remaining > 0);
    if (running) toggleTimer(running.id);
  }, [timers, toggleTimer]);

  const voiceOnResumeTimer = useCallback(() => {
    const paused = timers.find((t) => !t.running && t.remaining > 0);
    if (paused) toggleTimer(paused.id);
  }, [timers, toggleTimer]);

  const voice = useVoiceCook({
    stepText: step.instruction,
    tipText: step.tipText,
    onNext: next,
    onPrev: prev,
    onStartTimer: voiceOnStartTimer,
    onPauseTimer: voiceOnPauseTimer,
    onResumeTimer: voiceOnResumeTimer,
  });

  // Cleanup voice on unmount
  useEffect(() => {
    return () => voice.cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = ((current + 1) / total) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 text-white flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-neutral-700">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-sm text-neutral-400 truncate">{title}</p>
          {viewMode === "step" && (
            <p className="text-xs text-neutral-500">
              Step {current + 1} of {total}
            </p>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("step")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "step"
                ? "bg-neutral-600 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
            aria-label="Step-by-step view"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "timeline"
                ? "bg-neutral-600 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
            aria-label="Timeline view"
          >
            <Clock className="h-4 w-4" />
          </button>
        </div>

        {viewMode === "step" && (
          <VoiceControls
            isActive={voice.isActive}
            toggle={voice.toggle}
            sttSupported={voice.sttSupported}
            ttsSupported={voice.ttsSupported}
            isListening={voice.isListening}
            transcript={voice.transcript}
            lastCommand={voice.lastCommand}
            micError={voice.micError}
          />
        )}

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
          aria-label="Exit cook mode"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {viewMode === "timeline" ? (
        <TimelineView steps={steps} onComplete={onClose} />
      ) : (
        <>
          {/* Step content */}
          <div className="flex-1 flex items-center justify-center px-6 sm:px-12 overflow-y-auto">
            <div className="max-w-2xl w-full text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-600 text-2xl font-bold mb-6">
                {step.stepNumber}
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl leading-relaxed font-light">
                <InstructionWithTimers
                  instruction={step.instruction}
                  onStartTimer={startTimer}
                />
              </p>
              {step.tipText && (
                <div className="mt-6 p-4 bg-orange-900/30 border border-orange-700/50 rounded-xl inline-block max-w-lg">
                  <p className="text-sm sm:text-base text-orange-200">
                    <span className="font-semibold">Tip:</span> {step.tipText}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active timers */}
          {timers.length > 0 && (
            <div className="px-4 py-2 bg-neutral-800 border-t border-neutral-700">
              <div className="flex flex-wrap gap-2 justify-center">
                {timers.map((t) => (
                  <div
                    key={t.id}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                      t.remaining === 0
                        ? "bg-green-600 animate-pulse"
                        : "bg-neutral-700"
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5" />
                    <span>
                      {t.remaining === 0 ? `${t.label} done!` : formatTime(t.remaining)}
                    </span>
                    {t.remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleTimer(t.id)}
                        className="p-0.5 hover:bg-neutral-600 rounded-full"
                        aria-label={t.running ? "Pause" : "Resume"}
                      >
                        {t.running ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTimer(t.id)}
                      className="p-0.5 hover:bg-neutral-600 rounded-full"
                      aria-label="Remove timer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={prev}
              disabled={current === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800"
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </button>

            {/* Step dots */}
            <div className="hidden sm:flex gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === current
                      ? "bg-orange-500"
                      : i < current
                        ? "bg-orange-800"
                        : "bg-neutral-600"
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {current < total - 1 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Done!
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.hash = "troubleshooter";
                  }}
                  className="text-sm text-neutral-400 hover:text-orange-400 underline mt-2"
                >
                  Something didn&apos;t go right?
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
