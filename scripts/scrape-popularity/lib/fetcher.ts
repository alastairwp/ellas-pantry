import robotsParser from "robots-parser";
import type { Fetcher } from "./types.js";

const USER_AGENT =
  "EllaPantryBot/1.0 (+https://www.ellaspantry.co.uk/about; trend-analysis)";
const MIN_DELAY_MS = 2000;

export function createFetcher(): Fetcher {
  const robotsCache = new Map<string, ReturnType<typeof robotsParser>>();
  const lastRequestTime = new Map<string, number>();

  async function getRobots(origin: string) {
    if (robotsCache.has(origin)) return robotsCache.get(origin)!;

    const robotsUrl = `${origin}/robots.txt`;
    try {
      const res = await globalThis.fetch(robotsUrl, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10000),
      });
      const text = res.ok ? await res.text() : "";
      const robots = robotsParser(robotsUrl, text);
      robotsCache.set(origin, robots);
      return robots;
    } catch {
      // If we can't fetch robots.txt, assume everything is allowed
      const robots = robotsParser(robotsUrl, "");
      robotsCache.set(origin, robots);
      return robots;
    }
  }

  async function rateLimit(origin: string) {
    const last = lastRequestTime.get(origin) || 0;
    const elapsed = Date.now() - last;
    if (elapsed < MIN_DELAY_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS - elapsed));
    }
    lastRequestTime.set(origin, Date.now());
  }

  return {
    async isAllowed(url: string): Promise<boolean> {
      const origin = new URL(url).origin;
      const robots = await getRobots(origin);
      return robots.isAllowed(url, USER_AGENT) !== false;
    },

    async fetch(url: string): Promise<string | null> {
      const origin = new URL(url).origin;

      if (!(await this.isAllowed(url))) {
        console.log(`  [blocked] robots.txt disallows: ${url}`);
        return null;
      }

      await rateLimit(origin);

      try {
        const res = await globalThis.fetch(url, {
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(15000),
          redirect: "follow",
        });

        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get("retry-after") || "30", 10);
          console.log(`  [429] Rate limited, waiting ${retryAfter}s...`);
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          return this.fetch(url);
        }

        if (!res.ok) {
          console.log(`  [${res.status}] ${url}`);
          return null;
        }

        return await res.text();
      } catch (err) {
        console.log(`  [error] ${url}: ${(err as Error).message}`);
        return null;
      }
    },
  };
}
