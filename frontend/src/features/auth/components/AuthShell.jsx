import Link from "next/link";

export default function AuthShell({ children }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
      <header className="flex h-20 items-center justify-between border-b border-slate-200">
        <Link className="text-xl font-bold tracking-tight text-slate-900" href="/">
          Support<span className="text-emerald-700">Hub</span>
        </Link>
        <Link
          className="text-sm font-medium text-slate-600 hover:text-emerald-800"
          href="/"
        >
          Back to home
        </Link>
      </header>
      <section className="flex flex-1 items-center justify-center py-12">
        {children}
      </section>
      <footer className="border-t border-slate-200 py-5 text-center text-sm text-slate-500">
        SupportHub · A thoughtful start to better support.
      </footer>
    </main>
  );
}
