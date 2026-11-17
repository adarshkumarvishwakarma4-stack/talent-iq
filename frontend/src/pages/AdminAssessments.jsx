import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
const API = `${API_BASE}/api/assessments`;
const inputClass = "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/60";

function AdminAssessments() {
  const { getToken } = useAuth();
  const [problems, setProblems] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [problemData, assessmentData] = await Promise.all([
        fetch(`${API_BASE}/api/problems`).then(async (response) => {
          if (!response.ok) throw new Error("Could not load questions.");
          return response.json();
        }),
        request(`${API}/admin`),
      ]);
      setProblems(problemData);
      setAssessments(assessmentData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleProblem = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const createAssessment = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setCreated(null);
    try {
      const data = await request(API, {
        method: "POST",
        body: JSON.stringify({ title, durationMinutes: Number(durationMinutes), problemIds: selectedIds }),
      });
      setCreated(data.assessment);
      setTitle("");
      setSelectedIds([]);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openReport = async (assessmentId) => {
    setReportLoading(true);
    setError("");
    try {
      setReport(await request(`${API}/admin/${assessmentId}/report`));
    } catch (err) {
      setError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b18] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Talent IQ · Admin</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Coding Assessments</h1>
        <p className="mt-2 text-slate-400">Create assessments, assign questions in advance, and review candidate performance.</p>

        {error && <p className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <h2 className="text-xl font-semibold">Create assessment</h2>
          <form onSubmit={createAssessment} className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-300">
                Assessment title
                <input className={`${inputClass} mt-2`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Backend Developer Screening" required maxLength={100} />
              </label>
              <label className="text-sm text-slate-300">
                Duration (minutes)
                <input className={`${inputClass} mt-2`} type="number" min="5" max="240" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required />
              </label>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">Select questions ({selectedIds.length} selected)</h3>
                <span className="text-xs text-slate-500">Choose 1–20 questions</span>
              </div>
              {loading ? <p className="mt-4 text-sm text-slate-400">Loading questions...</p> : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {problems.map((problem) => (
                    <label key={problem._id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/40">
                      <input type="checkbox" className="mt-1 accent-violet-500" checked={selectedIds.includes(problem._id)} onChange={() => toggleProblem(problem._id)} />
                      <span className="min-w-0">
                        <span className="block font-medium">{problem.title}</span>
                        <span className="mt-1 block text-xs text-slate-400">{problem.difficulty} · {problem.category || "General"}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {!loading && problems.length === 0 && <p className="mt-3 text-sm text-slate-400">Create coding questions in Admin → Problems first.</p>}
            </div>
            <button disabled={saving || loading || !title.trim() || selectedIds.length === 0 || selectedIds.length > 20} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Creating..." : "Create assessment"}
            </button>
          </form>
        </section>

        {created && (
          <section className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
            <p className="font-semibold text-emerald-300">Assessment created successfully</p>
            <p className="mt-2 text-sm text-slate-300">{created.title} · {created.questionCount} questions · {created.durationMinutes} minutes</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <code className="rounded-lg bg-black/30 px-4 py-3 text-xl font-bold tracking-[0.25em] text-white">{created.code}</code>
              <button type="button" onClick={() => navigator.clipboard?.writeText(created.code)} className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10">Copy code</button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Share this code with the candidate. The assessment code expires after 30 days.</p>
          </section>
        )}

        <section className="mt-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Your assessments</h2>
            <button onClick={loadData} className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10">Refresh</button>
          </div>
          {loading ? <p className="mt-4 text-sm text-slate-400">Loading assessments...</p> : assessments.length === 0 ? (
            <p className="mt-4 rounded-xl border border-white/10 p-5 text-sm text-slate-400">No assessments created yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {assessments.map((item) => (
                <article key={item._id} className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{item.problems?.length || 0} questions · {item.durationMinutes} minutes · {item.attemptCount} candidate attempts</p>
                    <p className="mt-2 font-mono text-sm tracking-widest text-violet-300">{item.code}</p>
                  </div>
                  <button onClick={() => openReport(item._id)} className="rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/15">View performance</button>
                </article>
              ))}
            </div>
          )}
        </section>

        {reportLoading && <p className="mt-6 text-sm text-slate-400">Loading report...</p>}
        {report && (
          <section className="mt-9 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-violet-300">Performance report</p>
                <h2 className="mt-1 text-2xl font-semibold">{report.assessment.title}</h2>
                <p className="mt-1 text-sm text-slate-400">Assessment code: {report.assessment.code}</p>
              </div>
              <button onClick={() => setReport(null)} className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10">Close report</button>
            </div>

            {report.attempts.length === 0 ? <p className="mt-5 text-sm text-slate-400">No candidate has attempted this assessment yet.</p> : (
              <div className="mt-5 space-y-5">
                {report.attempts.map((attempt) => (
                  <article key={attempt._id} className="rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{attempt.candidate?.name || "Candidate"}</h3>
                        <p className="text-sm text-slate-400">{attempt.candidate?.email || "No email"}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${attempt.status === "submitted" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{attempt.status}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div><p className="text-xs text-slate-500">Score</p><p className="text-xl font-semibold">{attempt.scorePercent}%</p></div>
                      <div><p className="text-xs text-slate-500">Questions attempted</p><p className="text-xl font-semibold">{attempt.questionsAttempted}/{attempt.questionsTotal}</p></div>
                      <div><p className="text-xs text-slate-500">Test cases passed</p><p className="text-xl font-semibold">{attempt.passedCount}/{attempt.totalTestCases}</p></div>
                      <div><p className="text-xs text-slate-500">Started</p><p className="text-sm font-medium">{new Date(attempt.startedAt).toLocaleString()}</p></div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {attempt.questionResults.map((result) => (
                        <details key={result.problemId} className="rounded-lg border border-white/10 p-3">
                          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                            <span>{result.title} · {result.difficulty}</span>
                            <span className={result.verdict === "Accepted" ? "text-emerald-300" : result.verdict === "Not attempted" ? "text-slate-400" : "text-rose-300"}>{result.verdict} · {result.passedCount}/{result.totalTestCases}</span>
                          </summary>
                          {result.code && <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-[#080b18] p-3 text-xs text-slate-300">{result.code}</pre>}
                        </details>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default AdminAssessments;
