/* eslint-disable @typescript-eslint/no-explicit-any */

export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isSTTSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  );
}

export function createRecognition(): any {
  if (!isSTTSupported()) return null;
  const SR =
    (window as unknown as Record<string, any>).SpeechRecognition ||
    (window as unknown as Record<string, any>).webkitSpeechRecognition;
  if (!SR) return null;
  const recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-GB";
  return recognition;
}

/**
 * Pick the best-sounding English voice available on this browser.
 * Preference order:
 *  1. Google UK English Female (Chrome — clear, natural-sounding)
 *  2. Any voice with "Natural" or "Neural" in its name (Edge, newer browsers)
 *  3. Google UK / US English voices (Chrome)
 *  4. "Samantha" / "Karen" / "Daniel" (macOS / iOS — decent built-in voices)
 *  5. Any en-GB voice
 *  6. Any English voice
 */
export function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const english = voices.filter((v) => v.lang.startsWith("en"));
  if (english.length === 0) return null;

  // Tier 1: Google UK English Female — widely available in Chrome, sounds good
  const googleUKFemale = english.find((v) => v.name === "Google UK English Female");
  if (googleUKFemale) return googleUKFemale;

  // Tier 2: Neural / Natural / Microsoft Online voices
  const neural = english.find(
    (v) =>
      /natural|neural|microsoft.*online/i.test(v.name) && v.lang.startsWith("en-GB")
  );
  if (neural) return neural;
  const neuralAny = english.find((v) => /natural|neural|microsoft.*online/i.test(v.name));
  if (neuralAny) return neuralAny;

  // Tier 3: Other Google English voices
  const googleEn = english.find((v) => v.name.startsWith("Google") && v.lang.startsWith("en-GB"));
  if (googleEn) return googleEn;
  const googleEnAny = english.find((v) => v.name.startsWith("Google"));
  if (googleEnAny) return googleEnAny;

  // Tier 4: Known good macOS/iOS voices (including "Enhanced"/"Premium" variants)
  const appleGood = english.find((v) =>
    /\b(Karen|Samantha|Daniel|Moira|Tessa|Serena)\b/i.test(v.name)
  );
  if (appleGood) return appleGood;

  // Tier 5: Prefer en-GB over others
  const enGB = english.find((v) => v.lang === "en-GB");
  if (enGB) return enGB;

  // Fallback: first English voice
  return english[0];
}
