import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
const API = `${API_BASE}/api/assessments`;

function Assessment() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [code, setCode] = useState("");
  const [attempt, setAttempt] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [codeByProblem, setCodeByProblem] = useState({});
  const [results, setResults] = useState({});
  const [visibleResults, setVisibleResults] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [finalResult, setFinalResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const finishingRef = useRef(false);

  const request = useCallback(async (url, options = {}) => {
    const token = await getToken();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  }, [getToken]);

  const finishAssessment = useCallback(async (automatic = false) => {
    if (!attempt || finishingRef.current || finalResult) return;
    finishingRef.current = true;
    setLoading(true);
    try {
      const data = await request(`${API}/attempt/${attempt.attemptId}/finish`, { method: "POST" });
      setFinalResult(data);
    } catch (err) {
      setError(err.message);
      finishingRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [attempt, finalResult, request]);

  useEffect(() => {
    if (!attempt || finalResult) return undefined;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((new Date(attempt.deadlineAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0 && !finishingRef.current) finishAssessment(true);
    };
    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, [attempt, finalResult, finishAssessment]);

  const joinAssessment = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await request(`${API}/join`, {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setAttempt(data);
      setSelectedId(data.assessment.problems[0]?._id || "");
      const initialCode = {};
      for (const problem of data.assessment.problems) {
        const previous = data.previousSubmissions.find((item) => item.problemId === problem._id);
        initialCode[problem._id] = problem.starterCode || "";
        if (previous) setResults((current) => ({ ...current, [problem._id]: previous }));
      }
      setCodeByProblem(initialCode);
      setFinalResult(null);
      finishingRef.current = false;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedProblem = attempt?.assessment.problems.find((problem) => problem._id === selectedId);
  const currentCode = selectedProblem ? (codeByProblem[selectedId] ?? selectedProblem.starterCode ?? "") : "";

  const submitCode = async () => {
    if (!selectedProblem || !currentCode.trim()) {
      setError("Write your solution before submitting.");
      return;
    }
    setLoading(true);
    setError("");
    setVisibleResults([]);
    try {
      const data = await request(`${API}/attempt/${attempt.attemptId}/submit-code`, {
        method: "POST",
        body: JSON.stringify({ problemId: selectedProblem._id, code: currentCode }),
      });
      setResults((current) => ({
        ...current,
        [selectedProblem._id]: {
          verdict: data.verdict,
          passedCount: data.passedCount,
          totalTestCases: data.totalTestCases,
        },
      }));
      setVisibleResults(data.visibleResults || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="p-8 text-center text-slate-300">Loading...</div>;
  if (!isSignedIn) return <div className="p-8 text-center text-slate-300">Please sign in before joining an assessment.</div>;

  if (finalResult) {
    return (
      <div className="min-h-screen bg-[#080b18] px-5 py-12 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-sm uppercase tracking-widest text-violet-300">Assessment completed</p>
          <h1 className="mt-3 text-3xl font-bold">Your result</h1>
          <p className="mt-6 text-5xl font-bold">{finalResult.scorePercent}%</p>
          <p className="mt-2 text-slate-400">Test cases passed: {finalResult.passedCount}/{finalResult.totalTestCases}</p>
          <p className="mt-1 text-sm text-slate-400">Questions attempted: {finalResult.questionsAttempted}/{finalResult.questionsTotal}</p>
          <p className="mt-6 text-sm text-emerald-300">Your submission has been saved. You can close this page.</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-[#080b18] px-5 py-12 text-white">
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-7">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">Talent IQ</p>
          <h1 className="mt-3 text-3xl font-bold">Join coding assessment</h1>
          <p className="mt-2 text-sm text-slate-400">Enter the 8-character assessment code shared by your administrator.</p>
          <form onSubmit={joinAssessment} className="mt-6 space-y-4">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} placeholder="ASSESSMENT CODE" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-center font-mono text-xl tracking-[0.25em] text-white outline-none focus:border-violet-400" required />
            <button disabled={loading || code.trim().length !== 8} className="w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50">{loading ? "Joining..." : "Join assessment"}</button>
          </form>
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#080b18] px-4 py-6 text-white sm:px-7">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-violet-300">Coding assessment</p>
            <h1 className="mt-1 text-2xl font-bold">{attempt.assessment.title}</h1>
            <p className="mt-1 text-xs text-slate-400">{attempt.assessment.problems.length} assigned questions</p>
          </div>
          <div className={`rounded-xl border px-4 py-2 text-lg font-bold tabular-nums ${secondsLeft <= 60 ? "border-rose-400/30 text-rose-300" : "border-white/10 text-white"}`}>
            Time left: {formatTime(secondsLeft)}
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <h2 className="mb-3 font-semibold">Questions</h2>
            <div className="space-y-2">
              {attempt.assessment.problems.map((problem, index) => (
                <button key={problem._id} onClick={() => { setSelectedId(problem._id); setVisibleResults([]); setError(""); }} className={`w-full rounded-xl border p-3 text-left ${selectedId === problem._id ? "border-violet-400/40 bg-violet-500/10" : "border-white/10 hover:bg-white/5"}`}>
                  <span className="block text-sm font-medium">{index + 1}. {problem.title}</span>
                  <span className="mt-1 block text-xs text-slate-400">{problem.difficulty} · {results[problem._id]?.verdict || "Not submitted"}</span>
                </button>
              ))}
            </div>
            <button onClick={() => { if (window.confirm("Submit and finish this assessment? You cannot change your answers afterwards.")) finishAssessment(false); }} disabled={loading} className="mt-5 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold hover:bg-rose-500 disabled:opacity-50">Submit assessment</button>
          </aside>

          {selectedProblem && (
            <main className="grid min-w-0 gap-5 xl:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <span className="text-xs text-violet-300">{selectedProblem.difficulty} · {selectedProblem.category}</span>
                <h2 className="mt-2 text-2xl font-bold">{selectedProblem.title}</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{selectedProblem.description}</p>
                {selectedProblem.examples?.map((example, index) => (
                  <div key={index} className="mt-4 rounded-xl bg-black/20 p-4 text-sm">
                    <p className="font-semibold">Example {index + 1}</p>
                    <p className="mt-2 text-slate-400">Input: <span className="font-mono text-slate-200">{example.input}</span></p>
                    <p className="mt-1 text-slate-400">Output: <span className="font-mono text-slate-200">{example.output}</span></p>
                  </div>
                ))}
                {selectedProblem.constraints?.length > 0 && <div className="mt-4"><h3 className="font-semibold">Constraints</h3><p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">{selectedProblem.constraints.join("\n")}</p></div>}
              </section>

              <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
                <div className="border-b border-white/10 p-4"><h2 className="font-semibold">Your Java solution</h2></div>
                <textarea value={currentCode} onChange={(e) => setCodeByProblem((current) => ({ ...current, [selectedId]: e.target.value }))} spellCheck={false} disabled={loading || secondsLeft === 0} className="min-h-[420px] w-full resize-y bg-[#080b18] p-5 font-mono text-sm leading-6 text-emerald-200 outline-none disabled:opacity-60" placeholder="Write your Java code here..." />
                <div className="border-t border-white/10 p-4">
                  <button onClick={submitCode} disabled={loading || secondsLeft === 0} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50">{loading ? "Evaluating..." : "Submit answer"}</button>
                  {results[selectedId] && <p className="mt-3 text-sm text-slate-300">Latest result: <span className={results[selectedId].verdict === "Accepted" ? "text-emerald-300" : "text-rose-300"}>{results[selectedId].verdict}</span> · {results[selectedId].passedCount}/{results[selectedId].totalTestCases} test cases</p>}
                  {visibleResults.length > 0 && <div className="mt-4 space-y-2">{visibleResults.map((result) => <div key={result.testCaseNumber} className="flex justify-between rounded-lg bg-black/20 p-3 text-xs"><span>Visible test case {result.testCaseNumber}</span><span className={result.passed ? "text-emerald-300" : "text-rose-300"}>{result.passed ? "Passed" : "Failed"}</span></div>)}</div>}
                  {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
                </div>
              </section>
            </main>
          )}
        </div>
        <p className="mt-5 text-xs text-slate-500">Your latest submission for each question contributes to your final score. Hidden test cases are evaluated on the server and are not shown here.</p>
      </div>
    </div>
  );
}

export default Assessment;
