import { Timer, Mic, ShieldCheck, Leaf, ChefHat, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Timer,
    title: "Real-time cook timers",
    body: "Tap a step and the timer fires automatically — no juggling phones with floury hands.",
  },
  {
    icon: Mic,
    title: "Voice-controlled, hands-free",
    body: '"Next step" or "repeat" — read recipes aloud while you cook, even with messy hands.',
  },
  {
    icon: ShieldCheck,
    title: "Personal allergy profile",
    body: "Tell us what you can't eat. We'll filter, warn, and suggest swaps automatically.",
  },
  {
    icon: Leaf,
    title: "Diet-aware filters",
    body: "Vegan, vegetarian, gluten-free, nut-free, dairy-free — every recipe is tagged and searchable.",
  },
  {
    icon: ChefHat,
    title: "Adaptive instructions",
    body: "Steps rewrite themselves to match your skill level — beginner-friendly to confident cook.",
  },
  {
    icon: Sparkles,
    title: "Smart substitutions",
    body: "Out of an ingredient? We suggest a sensible swap with the right ratio in seconds.",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="absolute -right-32 top-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
            Why Ella&apos;s Pantry
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-neutral-700 sm:text-4xl lg:text-5xl">
            A recipe site that actually <span className="text-orange-500">helps you cook</span>.
          </h2>
          <p className="mt-4 text-base text-neutral-700/80 sm:text-lg">
            We built features no other recipe site has — designed for real
            kitchens, real schedules, and real dietary needs.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative rounded-2xl bg-neutral-700 p-6 ring-1 ring-neutral-600 transition-all hover:bg-neutral-600 hover:ring-orange-400 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/40">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-300">{f.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
