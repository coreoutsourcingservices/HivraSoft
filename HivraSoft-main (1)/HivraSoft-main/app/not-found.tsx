import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
      <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/50">
        404 Error
      </p>

      <h1 className="text-5xl font-bold md:text-8xl">
        Page Not Found
      </h1>

      <p className="mt-6 max-w-md text-white/60">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>

      <Link
        href="/"
        className="mt-8 rounded-full border border-white/30 px-6 py-3 transition hover:bg-white hover:text-black"
      >
        Back to Home
      </Link>
    </main>
  );
}