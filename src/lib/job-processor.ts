import { prisma } from "@/lib/prisma";
import { generateRecipeAuto } from "@/lib/generate-recipe";
import { findRecipeImage } from "@/lib/unsplash";
import { saveGeneratedRecipe } from "@/lib/save-recipe";
import { downloadRecipeImage } from "@/lib/download-image";
import { generateDishNames } from "@/lib/dish-names";

/**
 * Process a generation job server-side.
 * Runs in a loop, processing batches until the job is complete or stopped.
 * This runs independently of the client — navigating away won't stop it.
 */
export async function processGenerationJob(jobId: number) {
  try {
    while (true) {
      // Re-read job from DB each iteration to check for stop signals
      const job = await prisma.generationJob.findUnique({
        where: { id: jobId },
      });

      if (!job || job.status !== "running") break;

      // Check if we've hit the target (0 = unlimited)
      const produced = job.successCount + job.errorCount;
      if (job.targetCount > 0 && produced >= job.targetCount) {
        await prisma.generationJob.update({
          where: { id: jobId },
          data: { status: "completed" },
        });
        break;
      }

      // Determine batch size for this iteration
      let thisBatch = job.batchSize;
      if (job.targetCount > 0) {
        thisBatch = Math.min(thisBatch, job.targetCount - produced);
      }

      // Generate dish names from the pool
      const dishNames = generateDishNames(thisBatch, job.currentOffset);

      if (dishNames.length === 0) {
        await prisma.generationJob.update({
          where: { id: jobId },
          data: { status: "completed" },
        });
        break;
      }

      // Process in concurrent chunks
      const chunkSize = Math.min(job.concurrency, 5);
      let batchSuccess = 0;
      let batchErrors = 0;
      let stopped = false;

      for (let i = 0; i < dishNames.length; i += chunkSize) {
        // Check for stop signal mid-batch
        const freshJob = await prisma.generationJob.findUnique({
          where: { id: jobId },
        });
        if (!freshJob || freshJob.status !== "running") {
          stopped = true;
          break;
        }

        const chunk = dishNames.slice(i, i + chunkSize);

        const results = await Promise.allSettled(
          chunk.map(async (dishName: string) => {
            const recipe = await generateRecipeAuto(dishName);
            const imageUrl = await findRecipeImage(dishName);
            const saved = await saveGeneratedRecipe(recipe, imageUrl);
            if (!saved) throw new Error("Failed to save");
            await downloadRecipeImage(imageUrl, saved.slug, saved.id);
            return saved;
          })
        );

        for (const result of results) {
          if (result.status === "fulfilled") {
            batchSuccess++;
          } else {
            batchErrors++;
          }
        }
      }

      // Update job progress and the shared generator offset
      const newOffset = job.currentOffset + dishNames.length;
      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          currentOffset: newOffset,
          successCount: { increment: batchSuccess },
          errorCount: { increment: batchErrors },
          ...(stopped ? { status: "completed" } : {}),
        },
      });

      // Persist offset to settings so it's shared across jobs
      await prisma.setting.upsert({
        where: { key: "generatorOffset" },
        update: { value: String(newOffset) },
        create: { key: "generatorOffset", value: String(newOffset) },
      });

      if (stopped) break;
    }
  } catch (error) {
    console.error(`Generation job ${jobId} failed:`, error);
    await prisma.generationJob
      .update({
        where: { id: jobId },
        data: { status: "failed" },
      })
      .catch(() => {});
  }
}
