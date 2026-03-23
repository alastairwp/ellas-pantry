import { parseTimers, type ParsedTimer } from "@/lib/parse-timers";

export const DEFAULT_STEP_DURATION = 60;

export interface TimelineStep {
  stepNumber: number;
  instruction: string;
  tipText?: string | null;
  durationSeconds: number;
  timers: ParsedTimer[];
  isEstimatedDuration: boolean;
  parallelWith: number | null; // stepNumber of the step this runs parallel to
  lane: 0 | 1; // 0 = main, 1 = parallel
}

export interface TimelineGroup {
  steps: TimelineStep[];
  groupDurationSeconds: number;
  isParallel: boolean;
}

const PARALLEL_PATTERNS = [
  /^while\b/i,
  /^meanwhile\b/i,
  /^at the same time\b/i,
  /^in the meantime\b/i,
  /^during\b/i,
  /^as .+ (?:cook|boil|bake|simmer|rest|cool|roast|heat)/i,
];

function isParallelStep(instruction: string): boolean {
  return PARALLEL_PATTERNS.some((pattern) => pattern.test(instruction.trim()));
}

function buildTimelineStep(
  step: { stepNumber: number; instruction: string; tipText?: string | null },
  prevStepNumber: number | null,
): TimelineStep {
  const timers = parseTimers(step.instruction);
  const totalTimerSeconds = timers.reduce((sum, t) => sum + t.seconds, 0);
  const isEstimated = totalTimerSeconds === 0;
  const durationSeconds = isEstimated ? DEFAULT_STEP_DURATION : totalTimerSeconds;
  const parallel = isParallelStep(step.instruction);

  return {
    stepNumber: step.stepNumber,
    instruction: step.instruction,
    tipText: step.tipText,
    durationSeconds,
    timers,
    isEstimatedDuration: isEstimated,
    parallelWith: parallel && prevStepNumber !== null ? prevStepNumber : null,
    lane: parallel && prevStepNumber !== null ? 1 : 0,
  };
}

export function buildTimeline(
  steps: { stepNumber: number; instruction: string; tipText?: string | null }[],
): TimelineGroup[] {
  if (steps.length === 0) return [];

  const timelineSteps = steps.map((step, i) =>
    buildTimelineStep(step, i > 0 ? steps[i - 1].stepNumber : null),
  );

  const groups: TimelineGroup[] = [];
  let i = 0;

  while (i < timelineSteps.length) {
    const current = timelineSteps[i];

    // Check if next step is parallel to current
    if (
      i + 1 < timelineSteps.length &&
      timelineSteps[i + 1].parallelWith === current.stepNumber
    ) {
      const parallel = timelineSteps[i + 1];
      groups.push({
        steps: [current, parallel],
        groupDurationSeconds: Math.max(
          current.durationSeconds,
          parallel.durationSeconds,
        ),
        isParallel: true,
      });
      i += 2;
    } else if (current.parallelWith !== null) {
      // This step claims to be parallel but wasn't grouped with previous
      // (e.g., previous was already consumed). Treat as solo.
      groups.push({
        steps: [{ ...current, parallelWith: null, lane: 0 }],
        groupDurationSeconds: current.durationSeconds,
        isParallel: false,
      });
      i += 1;
    } else {
      groups.push({
        steps: [current],
        groupDurationSeconds: current.durationSeconds,
        isParallel: false,
      });
      i += 1;
    }
  }

  return groups;
}

export function getTotalDuration(groups: TimelineGroup[]): number {
  return groups.reduce((sum, g) => sum + g.groupDurationSeconds, 0);
}
