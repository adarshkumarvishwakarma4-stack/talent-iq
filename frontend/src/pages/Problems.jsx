import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const difficulties = ["All", "Easy", "Medium", "Hard"];

const difficultyStyles = {
  Easy: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  Medium: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  Hard: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};



const executeCode = async (code, input = "") => {
  const response = await fetch("http://localhost:3000/api/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, input }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Code execution failed.");
  }

  const output = data.output || "";
  const error = data.error || "";

  return {
    output: [output, error].filter(Boolean).join("\n") || "(No output)",
    failed:
      (data.exit_code !== undefined && data.exit_code !== 0) ||
      Boolean(error) ||
      data.status === "error",
  };
};

function Problems() {
  const { id } = useParams();

  const [problems, setProblems] = useState([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProblem, setSelectedProblem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [runLoading, setRunLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [testResults, setTestResults] = useState([]);

  // Load all problems
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:3000/api/problems");

        if (!response.ok) {
          throw new Error(`Unable to load problems (${response.status})`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Unexpected response from server");
        }

        setProblems(data);
      } catch (err) {
        console.error("Failed to fetch problems:", err);
        setError(
          "Unable to load problems. Check that your backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // Load one problem when its title is clicked
  useEffect(() => {
    if (!id) {
      setSelectedProblem(null);
      setDetailError("");
      setOutput("");
      setSubmissionStatus("");
      setTestResults([]);
      return;
    }

    const controller = new AbortController();

    const loadProblem = async () => {
      try {
        setDetailLoading(true);
        setDetailError("");
        setSelectedProblem(null);
        setOutput("");
        setSubmissionStatus("");
        setTestResults([]);

        const response = await fetch(
          `http://localhost:3000/api/problems/${id}`,
          { signal: controller.signal }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || `Unable to load problem (${response.status})`
          );
        }

        const problem = data.problem || data;

        if (!problem || !problem._id) {
          throw new Error("Problem details were not found.");
        }

        setSelectedProblem(problem);
        setCode(
          problem.starterCode || "// Write your JavaScript solution here\n"
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to load problem:", err);
          setDetailError(err.message || "Unable to load this problem.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      }
    };

    loadProblem();

    return () => controller.abort();
  }, [id]);

  const handleRunCode = async () => {
    if (!code.trim()) {
      setOutput("Please write some Java code first.");
      setSubmissionStatus("No code");
      setTestResults([]);
      return;
    }

    setRunLoading(true);
    setOutput("Running your code...");
    setSubmissionStatus("");
    setTestResults([]);

    try {
      const result = await executeCode(code);
      setOutput(result.output);

      if (result.failed) {
        setSubmissionStatus("Runtime Error");
      }
    } catch (err) {
      setOutput(err.message || "Execution failed. Check your internet connection.");
      setSubmissionStatus("Execution Failed");
    } finally {
      setRunLoading(false);
    }
  };

  // Submit code for evaluation against all saved MongoDB test cases.
  const handleSubmitCode = async () => {
    if (!code.trim()) {
      setOutput("Please write your solution before submitting.");
      setSubmissionStatus("No code");
      setTestResults([]);
      return;
    }

    if (!selectedProblem?._id) {
      setOutput("Problem details are not available.");
      setSubmissionStatus("Cannot judge");
      return;
    }

    setRunLoading(true);
    setOutput("Running all test cases...");
    setSubmissionStatus("");
    setTestResults([]);

    try {
      const response = await fetch("http://localhost:3000/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          problemId: selectedProblem._id,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Submission failed.");
      }

      setSubmissionStatus(data.verdict || "Evaluation completed");
      setTestResults(data.visibleResults || []);
      setOutput(
        `Passed ${data.passedCount ?? 0} / ${data.totalTestCases ?? 0} test cases.`
      );
    } catch (err) {
      setOutput(err.message || "Submission failed.");
      setSubmissionStatus("Execution Failed");
    } finally {
      setRunLoading(false);
    }
  };

  const filteredProblems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return problems.filter((problem) => {
      const matchesDifficulty =
        difficulty === "All" || problem.difficulty === difficulty;

      const matchesSearch =
        !query ||
        (problem.title || "").toLowerCase().includes(query) ||
        (problem.category || "").toLowerCase().includes(query) ||
        (problem.description || "").toLowerCase().includes(query);

      return matchesDifficulty && matchesSearch;
    });
  }, [problems, search, difficulty]);

  // Problem detail page
  if (id) {
    return (
      <div className="min-h-screen bg-[#080b18] px-5 py-10 text-white sm:px-10 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/problems"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            ← Back to problems
          </Link>

          {detailLoading && (
            <div className="mt-8 rounded-2xl border border-white/10 p-10 text-center text-slate-400">
              Loading problem details...
            </div>
          )}

          {!detailLoading && detailError && (
            <div className="mt-8 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-6">
              <h1 className="text-xl font-semibold text-rose-300">
                Could not load this problem
              </h1>
              <p className="mt-2 text-sm text-slate-300">{detailError}</p>
            </div>
          )}

          {!detailLoading && !detailError && selectedProblem && (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* Problem statement */}
              <section className="rounded-2xl border border-white/10 bg-[#0d1223]/80 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      difficultyStyles[selectedProblem.difficulty] ||
                      "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {selectedProblem.difficulty || "Unspecified"}
                  </span>
                  <span className="text-sm text-slate-400">
                    {selectedProblem.category || "General"}
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                  {selectedProblem.title || "Untitled problem"}
                </h1>

                <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {selectedProblem.description || "No description provided."}
                </div>

                {Array.isArray(selectedProblem.examples) &&
                  selectedProblem.examples.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-lg font-semibold">Examples</h2>

                      <div className="mt-3 space-y-3">
                        {selectedProblem.examples.map((example, index) => (
                          <div
                            key={example._id || index}
                            className="rounded-xl border border-white/10 bg-black/20 p-4"
                          >
                            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                              Example {index + 1}
                            </p>
                            <p className="mt-3 text-sm text-slate-400">
                              Input
                            </p>
                            <pre className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">
                              {typeof example === "string"
                                ? example
                                : example.input || "—"}
                            </pre>

                            {typeof example !== "string" && (
                              <>
                                <p className="mt-3 text-sm text-slate-400">
                                  Output
                                </p>
                                <pre className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">
                                  {example.output || "—"}
                                </pre>
                                {example.explanation && (
                                  <p className="mt-3 text-sm leading-6 text-slate-400">
                                    {example.explanation}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {selectedProblem.constraints && (
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold">Constraints</h2>
                    <div className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">
                      {Array.isArray(selectedProblem.constraints)
                        ? selectedProblem.constraints.join("\n")
                        : selectedProblem.constraints}
                    </div>
                  </div>
                )}
              </section>

              {/* Code editor and controls */}
              <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1223]/80">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <h2 className="font-semibold">Your solution</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      JavaScript editor
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={runLoading}
                    onClick={() => {
                      setCode(
                        selectedProblem.starterCode ||
                          "// Write your JavaScript solution here\n"
                      );
                      setOutput("");
                      setSubmissionStatus("");
                      setTestResults([]);
                    }}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-50"
                  >
                    Reset code
                  </button>
                </div>

                <textarea
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setSubmissionStatus("");
                    setTestResults([]);
                  }}
                  spellCheck={false}
                  aria-label="Your Java solution"
                  placeholder="Write your Java solution here..."
                  className="min-h-[420px] w-full resize-y bg-[#080b18] p-5 font-mono text-sm leading-6 text-emerald-200 outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-inset focus:ring-violet-400/40"
                />

                <div className="flex flex-wrap gap-3 border-t border-white/10 p-5">
                  <button
                    type="button"
                    onClick={handleRunCode}
                    disabled={runLoading}
                    className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {runLoading ? "Running..." : "▶ Run Code"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitCode}
                    disabled={runLoading}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {runLoading ? "Checking..." : "✓ Submit Code"}
                  </button>
                </div>

                {/* Output panel */}
                <div className="border-t border-white/10 bg-black/20 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">Output</h3>

                    {submissionStatus && (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          submissionStatus === "Accepted"
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                            : "border-rose-400/30 bg-rose-400/10 text-rose-300"
                        }`}
                      >
                        {submissionStatus}
                      </span>
                    )}
                  </div>

                  <pre className="mt-3 min-h-16 whitespace-pre-wrap break-words rounded-lg bg-[#080b18] p-4 font-mono text-sm leading-6 text-slate-300">
                    {output || "Run your code to see its output here."}
                  </pre>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Submit runs your Java solution against the problem's saved
                    test cases. Hidden test case details are not displayed.
                  </p>

                  {testResults.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-semibold text-slate-200">
                        Visible test case results
                      </h4>
                      {testResults.map((result) => (
                        <div
                          key={result.testCaseNumber}
                          className="rounded-lg border border-white/10 bg-[#080b18] p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-slate-300">
                              Test Case {result.testCaseNumber}
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                result.passed
                                  ? "text-emerald-300"
                                  : "text-rose-300"
                              }`}
                            >
                              {result.passed ? "Passed" : "Failed"}
                            </span>
                          </div>
                          {!result.passed && (
                            <div className="mt-2 space-y-2 text-xs">
                              {result.error && (
                                <p className="whitespace-pre-wrap text-rose-300">
                                  Error: {result.error}
                                </p>
                              )}
                              <p className="text-slate-400">
                                Expected: <span className="font-mono text-slate-300">{result.expectedOutput}</span>
                              </p>
                              <p className="text-slate-400">
                                Actual: <span className="font-mono text-slate-300">{result.actualOutput || "(No output)"}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Problems list page
  return (
    <div className="min-h-screen bg-[#080b18] px-5 py-10 text-white sm:px-10 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-[#11162a] to-blue-600/10 p-7 sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-violet-500/15 blur-[80px]" />

          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
              Practice arena
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Coding Problems
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-400">
              Strengthen your problem-solving skills with coding challenges.
              Search by topic, choose your difficulty, and keep improving.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-bold">{problems.length}</p>
                <p className="mt-1 text-sm text-slate-400">Total problems</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-bold">
                  {problems.filter((p) => p.difficulty === "Easy").length}
                </p>
                <p className="mt-1 text-sm text-slate-400">Easy problems</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Explore challenges</h2>
            <p className="mt-2 text-sm text-slate-400">
              {loading
                ? "Loading problems..."
                : `${filteredProblems.length} problem${
                    filteredProblems.length === 1 ? "" : "s"
                  } found`}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, topic, or keyword..."
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
            />

            <div className="flex flex-wrap gap-2">
              {difficulties.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDifficulty(item)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    difficulty === item
                      ? "border-violet-400/40 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
            Loading coding problems...
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-6">
            <p className="font-semibold text-rose-300">
              Could not load problems
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredProblems.length === 0 && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="text-4xl">⌕</div>
            <h3 className="mt-4 text-xl font-semibold">No problems found</h3>
            <p className="mt-2 text-sm text-slate-400">
              Try a different search or difficulty filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDifficulty("All");
              }}
              className="mt-5 rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && filteredProblems.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1223]/80">
            <div className="hidden grid-cols-[minmax(0,1fr)_150px_150px] gap-4 border-b border-white/10 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:grid">
              <span>Problem</span>
              <span>Difficulty</span>
              <span>Topic</span>
            </div>

            <div className="divide-y divide-white/[0.07]">
              {filteredProblems.map((problem, index) => (
                <article
                  key={problem._id || problem.title}
                  className="grid gap-4 px-5 py-5 transition hover:bg-white/[0.025] sm:grid-cols-[minmax(0,1fr)_150px_150px] sm:items-center sm:px-6"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-white">
                        <Link
                          to={`/problems/${problem._id}`}
                          className="transition hover:text-violet-300"
                        >
                          {problem.title || "Untitled problem"}
                        </Link>
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                        {problem.description ||
                          "Open this problem to view its details."}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                        difficultyStyles[problem.difficulty] ||
                        "border-white/10 bg-white/5 text-slate-300"
                      }`}
                    >
                      {problem.difficulty || "Unspecified"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:block">
                    <span className="text-sm text-slate-400">
                      {problem.category || "General"}
                    </span>
                    <span className="text-xs text-violet-300">Available</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs leading-6 text-slate-500">
          Keep practising. Every problem is a chance to learn something new.
        </p>

      </div>
    </div>
  );
}

export default Problems;
