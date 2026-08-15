import StudentDirectory from "@/components/student-directory";
import StudentProfileForm from "@/components/student-profile-form";

const features = [
  {
    number: "01",
    title: "Share your strengths",
    description:
      "Create a profile with your skills, preferred role, and the times you are available.",
  },
  {
    number: "02",
    title: "Describe the project",
    description:
      "Add the skills, roles, and meeting times your project team needs.",
  },
  {
    number: "03",
    title: "Find a better fit",
    description:
      "See clear, ranked recommendations and understand why each student matches.",
  },
];

const scoreReasons = [
  { label: "Required skills", value: "+48", detail: "React, TypeScript, UI Design" },
  { label: "Preferred role", value: "+25", detail: "Frontend Developer" },
  { label: "Availability", value: "+15", detail: "Weekday evenings" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
        <a className="flex items-center gap-3" href="#top" aria-label="TeamFit home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-200">
            T
          </span>
          <span className="text-xl font-bold tracking-tight">TeamFit</span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex" aria-label="Main navigation">
          <a className="transition hover:text-indigo-600" href="#how-it-works">
            How it works
          </a>
          <a className="transition hover:text-indigo-600" href="#matching">
            Matching
          </a>
          <a
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-white transition hover:bg-indigo-600"
            href="#create-profile"
          >
            Get started
          </a>
        </nav>
      </header>

      <section id="top" className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-20">
        <div className="absolute -left-32 top-0 -z-0 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute right-0 top-20 -z-0 h-64 w-64 rounded-full bg-cyan-100 blur-3xl" />

        <div className="relative z-10">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Smart student team formation
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Build student teams that fit the project.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            TeamFit helps university students discover teammates with complementary skills, suitable roles, and shared availability.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="rounded-xl bg-indigo-600 px-5 py-3 text-center font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700" href="#create-profile">
              Create your profile
            </a>
            <a className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700" href="#students">
              View student profiles
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
            <span className="flex items-center gap-2"><span className="text-emerald-600">✓</span> Clear matching reasons</span>
            <span className="flex items-center gap-2"><span className="text-emerald-600">✓</span> Skills and roles</span>
            <span className="flex items-center gap-2"><span className="text-emerald-600">✓</span> Shared availability</span>
          </div>
        </div>

        <div id="matching" className="relative z-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-indigo-100/70 sm:p-7">
          <div className="flex items-start justify-between border-b border-slate-100 pb-5">
            <div>
              <p className="text-sm font-medium text-slate-500">Recommended teammate</p>
              <h2 className="mt-1 text-xl font-bold">Kavindu Perera</h2>
              <p className="mt-1 text-sm text-indigo-600">Frontend Developer</p>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-center">
              <span className="text-xl font-bold text-emerald-600">88%</span>
              <span className="-mt-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">match</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">React</span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">TypeScript</span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">UI Design</span>
          </div>

          {/* Static score data previews how the future matching result will be explained. */}
          <div className="mt-6 space-y-3">
            {scoreReasons.map((reason) => (
              <div key={reason.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{reason.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{reason.detail}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">{reason.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-slate-900 px-4 py-3 text-sm text-slate-200">
            <span className="font-semibold text-white">Project:</span> Campus event platform
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">A simple path to a stronger team.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The first TeamFit version keeps matching transparent and practical for student projects.
            </p>
          </div>

          {/* React maps this small data array into reusable feature cards. */}
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.number} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100">
                <span className="text-sm font-bold text-indigo-600">{feature.number}</span>
                <h3 className="mt-8 text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <StudentProfileForm />

      <StudentDirectory />

      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
        <div className="rounded-3xl bg-indigo-600 px-6 py-12 text-white shadow-xl shadow-indigo-200 sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-200">TeamFit MVP</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">From scattered skills to balanced student teams.</h2>
            <p className="mt-4 leading-7 text-indigo-100">
              This interface is the first step. Student profiles, project requests, and live recommendations will be added gradually.
            </p>
          </div>
          <a className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50 lg:mt-0" href="#top">
            Back to top
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
        TeamFit — Smart Student Project Team Formation Platform
      </footer>
    </main>
  );
}
