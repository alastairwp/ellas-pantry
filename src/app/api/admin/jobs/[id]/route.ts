import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/jobs/[id] — get job status
 * Auth handled by middleware for /api/admin/* routes
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const job = await prisma.generationJob.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Failed to get job:", error);
    return NextResponse.json(
      { error: "Failed to get job" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/jobs/[id] — stop a running job
 * Sets status to "stopping" which the processor checks each iteration
 * Auth handled by middleware for /api/admin/* routes
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const job = await prisma.generationJob.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "running") {
      return NextResponse.json(
        { error: "Job is not running", job },
        { status: 400 }
      );
    }

    const updated = await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: "stopping" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to stop job:", error);
    return NextResponse.json(
      { error: "Failed to stop job" },
      { status: 500 }
    );
  }
}
