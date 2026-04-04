import { NextRequest, NextResponse } from "next/server";
import { generateRecipe } from "@/lib/generate-recipe";
import { saveGeneratedRecipe } from "@/lib/save-recipe";
import { generateDishNames } from "@/lib/dish-names";

interface BatchResult {
  dishName: string;
  status: "success" | "error";
  slug?: string;
  error?: string;
}

/**
 * POST /api/admin/generate/batch
 * Generate recipes in bulk. Supports two modes:
 * 1. Provide explicit dishNames array
 * 2. Use auto-generation with offset and count
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dishNames: explicitNames,
      offset = 0,
      count = 10,
      concurrency = 3,
    } = body;

    // Get dish names either from input or auto-generate
    const dishNames: string[] =
      explicitNames && Array.isArray(explicitNames) && explicitNames.length > 0
        ? explicitNames
        : generateDishNames(count, offset);

    if (dishNames.length === 0) {
      return NextResponse.json(
        { error: "No dish names to process" },
        { status: 400 }
      );
    }

    // Process in batches to respect rate limits
    const results: BatchResult[] = [];
    const batchSize = Math.min(concurrency, 5); // Cap at 5 concurrent

    for (let i = 0; i < dishNames.length; i += batchSize) {
      const batch = dishNames.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (dishName: string): Promise<BatchResult> => {
          try {
            const recipe = await generateRecipe(dishName);
            const saved = await saveGeneratedRecipe(recipe, "");

            if (!saved) {
              return { dishName, status: "error", error: "Failed to save" };
            }

            return { dishName, status: "success", slug: saved.slug };
          } catch (error) {
            return {
              dishName,
              status: "error",
              error:
                error instanceof Error ? error.message : "Generation failed",
            };
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          results.push({
            dishName: "unknown",
            status: "error",
            error: result.reason?.message || "Unknown error",
          });
        }
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      total: results.length,
      success: successCount,
      errors: errorCount,
      results,
    });
  } catch (error) {
    console.error("Batch generation failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Batch generation failed",
      },
      { status: 500 }
    );
  }
}
