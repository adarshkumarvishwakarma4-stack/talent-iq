
import { Link } from "react-router-dom";

const features = [
  {
    number: "01",
    icon: "⌘",
    title: "Coding Challenges",
    description:
      "Practice programming problems, improve your logic, and build confidence one challenge at a time.",
  },
  {
    number: "02",
    icon: "◉",
    title: "Live Interviews",
    description:
      "Prepare for technical interviews and connect with interviewers through a dedicated interview experience.",
  },
  {
    number: "03",
    icon: "↗",
    title: "Track Your Growth",
    description:
      "Build consistency, measure your progress, and identify the skills you need to improve.",
  },
];

function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#080b18] text-white">
      <section className="relative px-5 pb-20 pt-16 sm:px-10 sm:pb-28 sm:pt-24">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-40 h-72 w-72 rounded-full bg-blue-600/10 blur-[100px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Your next opportunity starts here
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Think better.
              <br />
              Code smarter.
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
                Get interview ready.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
              One platform to sharpen your coding skills, practice technical
              problems, and prepare for the interviews that move your career
              forward.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/problems"
                className="rounded-xl bg-violet-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5 hover:bg-violet-500"
              >
                Explore problems <span className="ml-2">→</span>
              </Link>

              <a
                href="#features"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 font-semibold text-slate-200 transition hover:bg-white/[0.08]"
              >
                Explore platform
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-400">
              <span>✓ Practice at your own pace</span>
              <span>✓ Build real skills</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-violet-600/20 to-blue-600/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1223]/95 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs text-slate-500">practice.js</span>
                <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">
                  Ready to practice
                </span>
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-violet-300">
                      Today's challenge
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Two Sum
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Find two numbers that add up to a target.
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                    Easy
                  </span>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#080b18] p-5 font-mono text-sm leading-8">
                  <p><span className="text-slate-600">1</span> <span className="text-pink-300">function</span> <span className="text-blue-300">twoSum</span>(nums, target) {"{"}</p>
                  <p><span className="text-slate-600">2</span> &nbsp; <span className="text-pink-300">const</span> result = [];</p>
                  <p><span className="text-slate-600">3</span> &nbsp; <span className="text-slate-500">// Your solution goes here</span></p>
                  <p><span className="text-slate-600">4</span> &nbsp; <span className="text-pink-300">return</span> result;</p>
                  <p><span className="text-slate-600">5</span> {"}"}</p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Your next breakthrough</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Learn by solving, not just watching.
                    </p>
                  </div>
                  <Link
                    to="/problems"
                    className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-100"
                  >
                    Start →
                  </Link>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 rounded-xl border border-white/10 bg-[#11182b] px-4 py-3 shadow-xl sm:-left-8">
              <p className="text-xs text-slate-400">Your goal</p>
              <p className="mt-1 text-sm font-semibold text-emerald-300">
                Progress, one problem at a time
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-white/[0.06] bg-white/[0.015] px-5 py-20 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">
              Everything in one place
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Build skills that take you further.
            </h2>
            <p className="mt-4 leading-7 text-slate-400">
              A focused workspace to practice, prepare, and become a stronger
              candidate.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.number}
                className="group rounded-2xl border border-white/[0.08] bg-[#0d1223]/80 p-7 transition duration-300 hover:-translate-y-1 hover:border-violet-400/30"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-2xl text-violet-300">
                    {feature.icon}
                  </span>
                  <span className="text-sm text-slate-600">{feature.number}</span>
                </div>
                <h3 className="mt-7 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-500/10 to-blue-500/5 p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to take on your next challenge?
            </h2>
            <p className="mt-3 text-slate-400">
              Start practising and make every session count.
            </p>
          </div>
          <Link
            to="/problems"
            className="shrink-0 rounded-xl bg-violet-600 px-6 py-3.5 font-semibold transition hover:bg-violet-500"
          >
            Browse problems →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.08] px-5 py-7 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Talent IQ. Learn, practise, and grow.
      </footer>
    </div>
  );
}

export default Home;
