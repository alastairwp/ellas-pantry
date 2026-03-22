import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UNITS_RE = /^[\d½¼¾⅓⅔⅛/\s.,-]+/;
const UNIT_WORDS_RE = /^(cups?|tablespoons?|teaspoons?|tbsp|tsp|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|liters?|litres?|pinch(es)?|dash(es)?|cloves?|cans?|sticks?|slices?|pieces?|stalks?|sprigs?|bunch(es)?|heads?|packages?|packets?|large|medium|small|whole|fresh|dried|ground|of)\s+/i;
const PREP_NOTE_RE = /,\s*(softened|melted|chopped|diced|minced|sliced|grated|shredded|crushed|cubed|halved|quartered|peeled|seeded|trimmed|thawed|drained|rinsed|divided|optional|to taste|at room temperature|plus more).*$/i;

function extractBaseName(name: string): string {
  let base = name.trim().toLowerCase();
  // Strip leading numbers and fractions
  base = base.replace(UNITS_RE, "").trim();
  // Strip leading unit words (repeatedly, e.g. "2 tablespoons unsalted butter")
  let prev = "";
  while (prev !== base) {
    prev = base;
    base = base.replace(UNIT_WORDS_RE, "").trim();
  }
  // Strip trailing prep notes
  base = base.replace(PREP_NOTE_RE, "").trim();
  return base || name.trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const rows = await prisma.ingredient.findMany({
    where: { name: { contains: q.toLowerCase() } },
    select: { name: true },
    take: 200,
  });

  const seen = new Set<string>();
  const baseNames: string[] = [];
  for (const row of rows) {
    const base = extractBaseName(row.name);
    if (!seen.has(base)) {
      seen.add(base);
      baseNames.push(base);
    }
  }

  const qLower = q.toLowerCase();
  baseNames.sort((a, b) => {
    const aExact = a === qLower ? 0 : 1;
    const bExact = b === qLower ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  });

  return NextResponse.json(baseNames.slice(0, 15));
}
