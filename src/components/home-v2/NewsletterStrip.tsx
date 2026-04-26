export function NewsletterStrip() {
  return (
    <section className="bg-orange-50">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-12 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
          Stay inspired
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-neutral-700 sm:text-4xl">
          A new recipe in your inbox each week
        </h2>
        <p className="max-w-md text-neutral-600">
          Seasonal ideas, weekend bakes, and reader favourites — delivered free,
          unsubscribe any time.
        </p>
        <form
          className="mt-2 flex w-full max-w-md flex-col gap-2 sm:flex-row"
          action="#"
        >
          <input
            type="email"
            placeholder="you@example.com"
            disabled
            className="flex-1 rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <button
            type="submit"
            disabled
            className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Subscribe
          </button>
        </form>
        <p className="text-xs text-neutral-500">
          Coming soon — form is a placeholder for now.
        </p>
      </div>
    </section>
  );
}
