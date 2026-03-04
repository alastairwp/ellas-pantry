import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processGenerationJob } from "@/lib/job-processor";

/**
 * GET /api/admin/jobs — list recent jobs
 * Auth handled by middleware for /api/admin/* routes
 */
export async function GET() {
  try {
    const jobs = await prisma.generationJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Failed to list jobs:", error);
    return NextResponse.json(
      { error: "Failed to list jobs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/jobs — create and start a new generation job
 * Body: { targetCount?: number, batchSize?: number, concurrency?: number }
 * targetCount = 0 means continuous (unlimited)
 * Auth handled by middleware for /api/admin/* routes
 */
export async function POST(request: NextRequest) {
  try {
    // Check for already-running job
    const existing = await prisma.generationJob.findFirst({
      where: { status: { in: ["running", "stopping"] } },
    });
    if (existing) {
      // If the job hasn't been updated in 2+ minutes, it's stale (server restarted)
      const staleThreshold = new Date(Date.now() - 2 * 60 * 1000);
      if (existing.updatedAt < staleThreshold) {
        await prisma.generationJob.update({
          where: { id: existing.id },
          data: { status: "failed" },
        });
      } else {
        return NextResponse.json(
          { error: "A generation job is already running", job: existing },
          { status: 409 }
        );
      }
    }

    const body = await request.json();
    const targetCount = parseInt(body.targetCount, 10) || 0;
    const batchSize = Math.min(
      Math.max(parseInt(body.batchSize, 10) || 10, 1),
      50
    );
    const concurrency = Math.min(
      Math.max(parseInt(body.concurrency, 10) || 3, 1),
      5
    );

    // Get current offset from settings
    const offsetSetting = await prisma.setting.findUnique({
      where: { key: "generatorOffset" },
    });
    const startOffset = offsetSetting
      ? parseInt(offsetSetting.value, 10)
      : 0;

    const job = await prisma.generationJob.create({
      data: {
        status: "running",
        startOffset,
        currentOffset: startOffset,
        targetCount,
        batchSize,
        concurrency,
      },
    });

    // Start processing in background (fire-and-forget)
    processGenerationJob(job.id).catch((err) =>
      console.error("Background job error:", err)
    );

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Failed to create job:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create job",
      },
      { status: 500 }
    );
  }
}
