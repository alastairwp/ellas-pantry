import sharp from "sharp";

const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 1800;
const MAX_SIZE_BYTES = 200 * 1024;
const INITIAL_QUALITY = 78;
const QUALITY_STEP = 5;
const MIN_QUALITY = 40;
const WEBP_EFFORT = 6;

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}

export async function processRecipeImage(
  input: Buffer
): Promise<ProcessedImage> {
  const resized = sharp(input).resize(TARGET_WIDTH, TARGET_HEIGHT, {
    fit: "cover",
    position: "attention",
  });

  let quality = INITIAL_QUALITY;
  let result = await resized
    .clone()
    .webp({ quality, effort: WEBP_EFFORT })
    .toBuffer();

  while (result.length > MAX_SIZE_BYTES && quality > MIN_QUALITY) {
    quality -= QUALITY_STEP;
    result = await resized
      .clone()
      .webp({ quality, effort: WEBP_EFFORT })
      .toBuffer();
  }

  return {
    buffer: result,
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    size: result.length,
  };
}
