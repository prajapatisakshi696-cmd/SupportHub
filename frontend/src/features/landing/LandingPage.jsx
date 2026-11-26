import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CircleHelp,
  ClipboardList,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Keep every request together",
    description:
      "Give each support request a clear record, owner, priority, and status your team can follow.",
  },
  {
    icon: UsersRound,
    title: "Make ownership obvious",
    description:
      "Assign tickets to the right teammate or let agents claim work from the shared queue.",
  },
  {
    icon: BarChart3,
    title: "See how support is going",
    description:
      "Use live ticket and resolution summaries to spot workload and understand team progress.",
  },
];

const steps = [
  {
    number: "01",
    title: "Bring the request in",
    description:
      "Create a ticket with the context and category your team needs to get started.",
  },
  {
    number: "02",
    title: "Give it an owner",
    description:
      "Assign the ticket or let an agent claim it so responsibility stays clear.",
  },
  {
    number: "03",
    title: "Move it forward",
    description:
      "Update priority and status as the team works toward a resolution.",
  },
];

const questions = [
  {
    question: "Who can use SupportHub?",
    answer:
      "SupportHub has separate customer, agent, and admin roles. Each role gets access to the parts of the workspace it needs.",
  },
  {
    question: "Can customers see other customers' tickets?",
    answer:
      "No. Ticket access is checked by the API, and customers can only access tickets associated with their own account.",
  },
  {
    question: "Where do the dashboard numbers come from?",
    answer:
      "The admin and agent dashboards request summaries from the SupportHub API, which calculates them from saved ticket data.",
  },
];

function Brand() {
  return (
    <Link
      aria-label="SupportHub home"
      className="text-xl font-bold tracking-tight text-slate-950"
      href="/"
    >
      Support<span className="text-emerald-700">Hub</span>
    </Link>
  );
}

function WorkspacePreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div
        aria-hidden="true"
        className="absolute -inset-5 rounded-[2rem] bg-emerald-100/70 blur-2xl"
      />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <ClipboardList aria-hidden="true" size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Support workspace
              </p>
              <p className="text-xs text-slate-500">A clearer view of the queue</p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            Sample view
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Ticket status</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-2xl font-semibold tracking-tight text-slate-900">
                Clear
              </span>
              <span className="mb-1 text-xs text-emerald-800">at a glance</span>
            </div>
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              <span className="h-1.5 flex-1 rounded-full bg-amber-300" />
              <span className="h-1.5 flex-1 rounded-full bg-sky-400" />
              <span className="h-1.5 flex-1 rounded-full bg-emerald-500" />
              <span className="h-1.5 flex-1 rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Team handoff</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-900">
                A
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Assigned</p>
                <p className="text-xs text-slate-500">An owner for each request</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
              Recent requests
            </p>
            <span className="text-xs text-slate-500">Example tickets</span>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              ["SUP-10024", "Update on my order", "In progress", "bg-sky-50 text-sky-700"],
              ["SUP-10023", "Help with account access", "Open", "bg-amber-50 text-amber-800"],
              ["SUP-10022", "Question about a recent charge", "Resolved", "bg-emerald-50 text-emerald-800"],
            ].map(([number, subject, status, statusStyle]) => (
              <div
                className="flex items-center justify-between gap-3 py-3"
                key={number}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-400">{number}</p>
                  <p className="truncate text-sm font-medium text-slate-700">
                    {subject}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyle}`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="m-5 mt-2 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-xs leading-5 text-emerald-950">
          <ShieldCheck aria-hidden="true" className="shrink-0" size={16} />
          Ticket access is protected by account role and ownership.
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <header className="border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto flex min-h-18 max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 sm:px-8">
          <Brand />
          <nav aria-label="Main navigation" className="flex items-center gap-5">
            <a
              className="hidden text-sm font-medium text-slate-600 transition hover:text-emerald-800 sm:inline"
              href="#features"
            >
              Features
            </a>
            <a
              className="hidden text-sm font-medium text-slate-600 transition hover:text-emerald-800 sm:inline"
              href="#how-it-works"
            >
              How it works
            </a>
            <Link
              className="text-sm font-semibold text-slate-700 transition hover:text-emerald-800"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              href="/register"
            >
              Get started <ArrowUpRight aria-hidden="true" size={15} />
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.95fr] lg:gap-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Support, made more human
          </p>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[4.25rem]">
            Every customer conversation,{" "}
            <span className="text-emerald-800">moving forward.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            A shared workspace to organize support requests, give work a clear
            owner, and help your team see what needs attention.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              href="/register"
            >
              Create an account <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <Link
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              href="/login"
            >
              Sign in to your workspace
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            {["Role-based access", "Clear ticket ownership", "Live dashboard data"].map(
              (item) => (
                <span className="inline-flex items-center gap-2" key={item}>
                  <Check aria-hidden="true" className="text-emerald-700" size={16} />
                  {item}
                </span>
              ),
            )}
          </div>
        </div>
        <WorkspacePreview />
      </section>

      <section
        className="scroll-mt-8 border-y border-slate-200 bg-white px-5 py-16 sm:px-8 sm:py-20"
        id="features"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            description="The essentials to help support teams stay organized, responsive, and accountable."
            eyebrow="A calmer way to support"
            title="Less searching. More helping."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-lg hover:shadow-slate-900/5"
                key={title}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900">
                  <Icon aria-hidden="true" size={20} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20"
        id="how-it-works"
      >
        <SectionHeading
          description="A straightforward path from a new request to a clear next step."
          eyebrow="How it works"
          title="A simple workflow, built for teams."
        />
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <article className="relative" key={step.number}>
              {index < steps.length - 1 ? (
                <div
                  aria-hidden="true"
                  className="absolute left-12 right-0 top-6 hidden h-px bg-slate-200 md:block"
                />
              ) : null}
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-white text-sm font-bold text-emerald-900 shadow-sm">
                {step.number}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
              <CircleHelp aria-hidden="true" size={15} />
              Good to know
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              A few helpful answers.
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Learn how SupportHub keeps support work organized and access
              appropriately scoped.
            </p>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {questions.map(({ question, answer }) => (
              <details className="group py-5" key={question}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left font-semibold text-slate-800 marker:content-none focus-visible:outline-2 focus-visible:outline-emerald-700 [&::-webkit-details-marker]:hidden">
                  {question}
                  <span
                    aria-hidden="true"
                    className="text-xl font-normal text-emerald-800 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl pr-8 text-sm leading-6 text-slate-600">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              Make the next reply count
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Give your support work a home.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Sign in to continue or create an account to get started with
              SupportHub.
            </p>
          </div>
          <div className="mt-7 flex shrink-0 flex-wrap gap-3 lg:mt-0">
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              href="/register"
            >
              Get started <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <Link
              className="rounded-lg border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-400 hover:bg-slate-900"
              href="/login"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Brand />
          <p>Thoughtful support starts with a clear next step.</p>
          <div className="flex gap-4">
            <Link className="hover:text-emerald-800" href="/login">
              Sign in
            </Link>
            <Link className="hover:text-emerald-800" href="/register">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
