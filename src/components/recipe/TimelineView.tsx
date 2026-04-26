"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Timer,
  Pause,
  Play,
  Check,
  CheckCircle2,
} from "lucide-react";
import {
  buildTimeline,
  getTotalDuration,
  type TimelineGroup,
  type TimelineStep,
} from "@/lib/build-timeline";
import { sendNotification } from "@/lib/notifications";

interface Step {
  stepNumber: number;
  instruction: string;
  tipText?: string | null;
}

type StepStatus = "pending" | "active" | "completed";

interface StepTimerState {
  status: StepStatus;
  remaining: number;
  totalSeconds: number;
  paused: boolean;
  notifiedWarning: boolean;
  notifiedComplete: boolean;
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

interface TimelineViewProps {
  steps: Step[];
  onComplete: () => void;
}

export function TimelineView({ steps, onComplete }: TimelineViewProps) {
  const groups = useMemo(() => buildTimeline(steps), [steps]);
  const totalDuration = useMemo(() => getTotalDuration(groups), [groups]);

  const [activeGroupIndex, setActiveGroupIndex] = useState(-1); // -1 = not started
  const [stepStates, setStepStates] = useState<Map<number, StepTimerState>>(
    () => {
      const map = new Map<number, StepTimerState>();
      for (const group of groups) {
        for (const step of group.steps) {
          map.set(step.stepNumber, {
            status: "pending",
            remaining: step.durationSeconds,
            totalSeconds: step.durationSeconds,
            paused: false,
            notifiedWarning: false,
            notifiedComplete: false,
          });
        }
      }
      return map;
    },
  );

  const activeGroupRef = useRef(activeGroupIndex);
  activeGroupRef.current = activeGroupIndex;

  const activateGroup = useCallback(
    (index: number) => {
      if (index >= groups.length) {
        onComplete();
        return;
      }
      setActiveGroupIndex(index);
      setStepStates((prev) => {
        const next = new Map(prev);
        for (const step of groups[index].steps) {
          const existing = next.get(step.stepNumber);
          if (existing && existing.status === "pending") {
            next.set(step.stepNumber, { ...existing, status: "active" });
          }
        }
        return next;
      });
    },
    [groups, onComplete],
  );

  // Start cooking
  const startCooking = useCallback(() => {
    activateGroup(0);
  }, [activateGroup]);

  // Timer tick
  useEffect(() => {
    if (activeGroupIndex < 0) return;

    const interval = setInterval(() => {
      setStepStates((prev) => {
        const next = new Map(prev);
        let changed = false;

        for (const [stepNum, state] of next) {
          if (state.status !== "active" || state.paused || state.remaining <= 0)
            continue;

          changed = true;
          const newRemaining = state.remaining - 1;
          const update = { ...state, remaining: newRemaining };

          // 2-minute warning notification
          if (
            !state.notifiedWarning &&
            state.totalSeconds > 180 &&
            newRemaining === 120
          ) {
            update.notifiedWarning = true;
            sendNotification("Timer Warning", "2 minutes remaining!");
          }

          // Completion
          if (newRemaining === 0) {
            update.status = "completed";
            update.notifiedComplete = true;
            playAlert();
            sendNotification("Timer Complete", "Step is done!");
          }

          next.set(stepNum, update);
        }

        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeGroupIndex]);

  // Auto-advance when all steps in active group are completed
  useEffect(() => {
    if (activeGroupIndex < 0 || activeGroupIndex >= groups.length) return;

    const currentGroup = groups[activeGroupIndex];
    const allDone = currentGroup.steps.every((step) => {
      const state = stepStates.get(step.stepNumber);
      return state?.status === "completed";
    });

    if (allDone) {
      // Small delay so user sees completion state
      const timeout = setTimeout(() => {
        activateGroup(activeGroupIndex + 1);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [stepStates, activeGroupIndex, groups, activateGroup]);

  const togglePause = useCallback((stepNumber: number) => {
    setStepStates((prev) => {
      const next = new Map(prev);
      const state = next.get(stepNumber);
      if (state && state.status === "active") {
        next.set(stepNumber, { ...state, paused: !state.paused });
      }
      return next;
    });
  }, []);

  const markDone = useCallback((stepNumber: number) => {
    setStepStates((prev) => {
      const next = new Map(prev);
      const state = next.get(stepNumber);
      if (state) {
        next.set(stepNumber, { ...state, status: "completed", remaining: 0 });
      }
      return next;
    });
  }, []);

  // Calculate remaining time
  const elapsedGroupDuration = groups
    .slice(0, activeGroupIndex < 0 ? 0 : activeGroupIndex)
    .reduce((sum, g) => sum + g.groupDurationSeconds, 0);
  const currentGroupRemaining =
    activeGroupIndex >= 0 && activeGroupIndex < groups.length
      ? Math.max(
          ...groups[activeGroupIndex].steps.map(
            (s) => stepStates.get(s.stepNumber)?.remaining ?? 0,
          ),
        )
      : 0;
  const remainingDuration =
    activeGroupIndex < 0
      ? totalDuration
      : totalDuration -
        elapsedGroupDuration -
        (groups[activeGroupIndex]?.groupDurationSeconds ?? 0) +
        currentGroupRemaining;

  const completedSteps = Array.from(stepStates.values()).filter(
    (s) => s.status === "completed",
  ).length;
  const totalSteps = stepStates.size;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Scrollable groups */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
        {activeGroupIndex < 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-neutral-400 text-sm">
              {groups.length} steps &middot; ~{formatTime(totalDuration)} total
            </p>
            <button
              type="button"
              onClick={startCooking}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              Start Cooking
            </button>
          </div>
        )}

        {groups.map((group, gIdx) => {
          const groupStatus = getGroupStatus(group, stepStates);
          return (
            <div key={gIdx}>
              {groupStatus === "completed" ? (
                <CompletedGroup group={group} />
              ) : groupStatus === "active" ? (
                <ActiveGroup
                  group={group}
                  stepStates={stepStates}
                  onTogglePause={togglePause}
                  onMarkDone={markDone}
                />
              ) : (
                <PendingGroup group={group} />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom progress bar */}
      {activeGroupIndex >= 0 && (
        <div className="px-4 py-3 bg-neutral-800 border-t border-neutral-700 text-center">
          <p className="text-sm text-neutral-300">
            Step {Math.min(completedSteps + 1, totalSteps)} of {totalSteps}
            {remainingDuration > 0 && (
              <span className="text-neutral-500">
                {" "}&mdash; ~{formatTime(Math.max(0, remainingDuration))} remaining
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function getGroupStatus(
  group: TimelineGroup,
  stepStates: Map<number, StepTimerState>,
): StepStatus {
  const states = group.steps.map(
    (s) => stepStates.get(s.stepNumber)?.status ?? "pending",
  );
  if (states.every((s) => s === "completed")) return "completed";
  if (states.some((s) => s === "active")) return "active";
  return "pending";
}

function CompletedGroup({ group }: { group: TimelineGroup }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-neutral-800/50 text-neutral-500">
      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
      <span className="text-sm truncate">
        {group.steps.map((s) => `Step ${s.stepNumber}`).join(" & ")}
        {" — "}
        {group.steps[0].instruction.slice(0, 60)}
        {group.steps[0].instruction.length > 60 ? "…" : ""}
      </span>
    </div>
  );
}

function ActiveGroup({
  group,
  stepStates,
  onTogglePause,
  onMarkDone,
}: {
  group: TimelineGroup;
  stepStates: Map<number, StepTimerState>;
  onTogglePause: (stepNumber: number) => void;
  onMarkDone: (stepNumber: number) => void;
}) {
  return (
    <div
      className={
        group.isParallel
          ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
          : "space-y-3"
      }
    >
      {group.steps.map((step) => {
        const state = stepStates.get(step.stepNumber);
        if (!state) return null;
        return (
          <ActiveStepCard
            key={step.stepNumber}
            step={step}
            state={state}
            isParallel={group.isParallel}
            onTogglePause={onTogglePause}
            onMarkDone={onMarkDone}
          />
        );
      })}
    </div>
  );
}

function ActiveStepCard({
  step,
  state,
  isParallel,
  onTogglePause,
  onMarkDone,
}: {
  step: TimelineStep;
  state: StepTimerState;
  isParallel: boolean;
  onTogglePause: (stepNumber: number) => void;
  onMarkDone: (stepNumber: number) => void;
}) {
  const progress =
    state.totalSeconds > 0
      ? ((state.totalSeconds - state.remaining) / state.totalSeconds) * 100
      : 100;
  const isDone = state.status === "completed";

  return (
    <div className="rounded-xl bg-neutral-700 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-sm font-bold">
            {isDone ? <Check className="h-4 w-4" /> : step.stepNumber}
          </div>
          <div className="min-w-0">
            {isParallel && step.lane === 1 && (
              <span className="inline-block text-xs font-medium text-orange-400 bg-orange-900/40 px-2 py-0.5 rounded mb-1">
                runs in parallel
              </span>
            )}
            <p className="text-sm sm:text-base text-white leading-relaxed">
              {step.instruction}
            </p>
            {step.tipText && (
              <p className="text-xs text-orange-200 mt-1">
                <span className="font-semibold">Tip:</span> {step.tipText}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-neutral-600 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            isDone ? "bg-green-500" : "bg-orange-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Timer + controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Timer className="h-3.5 w-3.5 text-neutral-400" />
          {isDone ? (
            <span className="text-green-400 font-medium">Done!</span>
          ) : (
            <span className="text-white font-mono">
              {formatTime(state.remaining)}
            </span>
          )}
          {step.isEstimatedDuration && !isDone && (
            <span className="text-neutral-500 text-xs">(estimate)</span>
          )}
        </div>

        {!isDone && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTogglePause(step.stepNumber)}
              className="p-1.5 rounded-full hover:bg-neutral-600 transition-colors"
              aria-label={state.paused ? "Resume" : "Pause"}
            >
              {state.paused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onMarkDone(step.stepNumber)}
              className="px-3 py-1 text-xs font-medium bg-neutral-600 hover:bg-neutral-500 rounded-full transition-colors"
            >
              Mark Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PendingGroup({ group }: { group: TimelineGroup }) {
  return (
    <div className="px-4 py-2 text-neutral-500 space-y-1">
      {group.steps.map((step) => (
        <div key={step.stepNumber} className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs">
            {step.stepNumber}
          </div>
          <p className="text-sm truncate">
            {step.instruction.slice(0, 80)}
            {step.instruction.length > 80 ? "…" : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
