export default function AuthCard({ title, description, children }) {
  return (
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
        SupportHub account
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
      <div className="mt-7">{children}</div>
    </section>
  );
}
