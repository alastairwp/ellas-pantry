import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-stone-300">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-stone-800">
        Recipe Not Found
      </h2>
      <p className="mt-2 text-stone-500">
        The recipe you&apos;re looking for doesn&apos;t exist or has been
        removed.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
