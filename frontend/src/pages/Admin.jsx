import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";


function Admin() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [showForm, setShowForm] = useState(false);
const [formData, setFormData] = useState({
  title: "",
  difficulty: "",
  category: "",
  description: "",
  starterCode: "",
  constraints: "",
  testCases: [
    {
      input: "",
      expectedOutput: "",
      isHidden: false,
    },
  ],
});

const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};


const addTestCase = () => {
  setFormData((prev) => ({
    ...prev,
    testCases: [
      ...prev.testCases,
      {
        input: "",
        expectedOutput: "",
        isHidden: false,
      },
    ],
  }));
};

const removeTestCase = (index) => {
  setFormData((prev) => ({
    ...prev,
    testCases: prev.testCases.filter((_, i) => i !== index),
  }));
};

const handleTestCaseChange = (index, field, value) => {
  setFormData((prev) => ({
    ...prev,
    testCases: prev.testCases.map((testCase, i) =>
      i === index ? { ...testCase, [field]: value } : testCase
    ),
  }));
};



const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const token = await getToken();

    const response = await fetch("/api/problems", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
  ...formData,
  constraints: formData.constraints
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean),
}),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save question");
    }

    console.log("Question saved:", data);
    alert("Question saved successfully!");
  } catch (error) {
    console.error("Error saving question:", error);
    alert(error.message || "Something went wrong");
  }
};

  const navItems = [
    { icon: "⌂", label: "Dashboard" },
    { icon: "◇", label: "Problems" },
    { icon: "♙", label: "Users" },
    { icon: "▥", label: "Analytics" },
    { icon: "⚙", label: "Settings" },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#080b18] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-violet-700/20 blur-[130px]" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-indigo-600/15 blur-[120px]" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-2xl md:flex">
          <div className="mb-14 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-xl font-bold shadow-lg shadow-violet-500/20">
              T
            </div>
            <span className="text-xl font-semibold tracking-tight">
              Talent <span className="text-violet-400">IQ</span>
            </span>
          </div>

          <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveTab(item.label)}
                className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm transition ${
                  activeTab === item.label
                    ? "border border-violet-400/15 bg-gradient-to-r from-violet-500/20 to-blue-500/10 text-white shadow-inner shadow-white/[0.02]"
                    : "border border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 text-center backdrop-blur-xl">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-xl text-amber-300">
              ♛
            </div>
            <p className="text-sm font-medium">Admin Access</p>
            <p className="mt-1 text-xs text-slate-500">Full Control</p>
          </div>

          <div className="mt-5 flex items-center gap-3 border-t border-white/[0.08] pt-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 font-semibold">
              A
            </div>
            <div>
              <p className="text-sm font-medium">Administrator</p>
              <p className="text-xs text-slate-500">Talent IQ</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
          <header className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-slate-300 backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Administration Panel
              </span>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
                Admin{" "}
                <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                  {activeTab}
                </span>
              </h1>

              <p className="mt-4 text-sm text-slate-400 sm:text-base">
                {activeTab === "Dashboard" && "Manage your workspace and assessment platform."}
                {activeTab === "Problems" && "Create and manage coding questions for assessments."}
                {activeTab === "Users" && "View registered platform users."}
                {activeTab === "Analytics" && "Review platform activity and assessment performance."}
                {activeTab === "Settings" && "Configure platform preferences."}
              </p>
            </div>

            <div className="flex h-11 w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-300 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Workspace active
            </div>
          </header>

          {/* Dashboard stats */}
          {activeTab === "Dashboard" && (
          <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.09] bg-white/[0.045] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl transition hover:border-violet-400/30">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Questions</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-xl text-violet-300">
                  ◈
                </span>
              </div>
              <h2 className="text-4xl font-semibold tracking-tight">—</h2>
              <p className="mt-3 text-xs text-slate-500">
                Your coding question library
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.09] bg-white/[0.045] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl transition hover:border-emerald-400/30">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm text-slate-400">Assessment Tools</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-xl text-emerald-300">
                  ▥
                </span>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">Ready</h2>
              <p className="mt-3 text-xs text-slate-500">
                Create coding challenges
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.09] bg-white/[0.045] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl transition hover:border-blue-400/30 sm:col-span-2 xl:col-span-1">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm text-slate-400">Platform Status</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-xl text-blue-300">
                  ⚡
                </span>
              </div>
              <h2 className="flex items-center gap-3 text-3xl font-semibold">
                Active
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </h2>
              <p className="mt-3 text-xs text-slate-500">
                Manage your platform
              </p>
            </div>
          </section>
          )}

          {/* Question management */}
          {activeTab === "Problems" && (
          <section className="overflow-hidden rounded-3xl border border-white/[0.1] bg-white/[0.035] shadow-2xl shadow-black/20 backdrop-blur-2xl">
            <div className="flex flex-col justify-between gap-5 border-b border-white/[0.08] p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-500/10 text-xl text-violet-300">
                  ✧
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Question Management
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Add and manage coding challenges for your platform.
                  </p>
                </div>
              </div>

              
<button
  type="button"
  onClick={() => setShowForm(!showForm)}
  className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-900/30 transition-all duration-200 hover:scale-[1.03] hover:brightness-125 hover:shadow-violet-500/40 active:scale-95 active:brightness-90"
>
  {showForm ? "Close Form" : "+ Add Question"}
</button>

            </div>

            {showForm ? (
              <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                <h3 className="mb-2 text-lg font-semibold">
                  Create a coding question
                </h3> 
                <p className="mb-7 text-sm text-slate-400">
                  Add the details candidates will use to solve the problem.
                </p>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Question Title *
                    </label>
                    
<input
  required
  type="text"
  name="title"
  value={formData.title}
  onChange={handleChange}
  placeholder="e.g. Two Sum"
  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/10"
/>

                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Difficulty *
                    </label>
                    <select
  required
  name="difficulty"
  value={formData.difficulty}
  onChange={handleChange}
  className="w-full rounded-xl border border-white/10 bg-[#111527] px-4 py-3 text-sm text-slate-300 outline-none focus:border-violet-400/60"
>
  <option value="" disabled>
    Select difficulty
  </option>
  <option value="Easy">Easy</option>
  <option value="Medium">Medium</option>
  <option value="Hard">Hard</option>
</select>
                    
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Category
                    </label>
                    
<input
  name="category"
  value={formData.category}
  onChange={handleChange}
  placeholder="e.g. Arrays, Strings"
  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-400/60"
/>

                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-slate-300">
                      Problem Description *
                    </label>
                    
<textarea
  required
  name="description"
  value={formData.description}
  onChange={handleChange}
  rows={4}
  placeholder="Describe the problem and expected behaviour..."
  className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 outline-none placeholder:text-slate-600 focus:border-violet-400/60"
/>

                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Starter Code
                    </label>
                    
<textarea
  name="starterCode"
  value={formData.starterCode}
  onChange={handleChange}
  rows={4}
  placeholder="Enter starter code..."
  className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm outline-none placeholder:text-slate-600 focus:border-violet-400/60"
/>

                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Constraints
                    </label>
                    
<textarea
  name="constraints"
  value={formData.constraints}
  onChange={handleChange}
  rows={4}
  placeholder="e.g. 1 <= n <= 10^4"
  className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-400/60"
/>

                  </div>
                </div>

                {/* Test cases */}
                <section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">Test Cases</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Add input and expected output for each test case.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addTestCase}
                      className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
                    >
                      + Add Test Case
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.testCases.map((testCase, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <h4 className="font-medium text-slate-200">
                            Test Case {index + 1}
                          </h4>
                          <div className="flex items-center gap-4">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                              <input
                                type="checkbox"
                                checked={testCase.isHidden}
                                onChange={(e) =>
                                  handleTestCaseChange(index, "isHidden", e.target.checked)
                                }
                                className="h-4 w-4 accent-violet-500"
                              />
                              Hidden test case
                            </label>
                            {formData.testCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTestCase(index)}
                                className="text-sm text-red-400 transition hover:text-red-300"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm text-slate-300">
                              Input
                            </label>
                            <textarea
                              value={testCase.input}
                              onChange={(e) =>
                                handleTestCaseChange(index, "input", e.target.value)
                              }
                              rows={3}
                              placeholder="Enter test input..."
                              className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm outline-none placeholder:text-slate-600 focus:border-violet-400/60"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-slate-300">
                              Expected Output *
                            </label>
                            <textarea
                              required
                              value={testCase.expectedOutput}
                              onChange={(e) =>
                                handleTestCaseChange(index, "expectedOutput", e.target.value)
                              }
                              rows={3}
                              placeholder="Enter expected output..."
                              className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm outline-none placeholder:text-slate-600 focus:border-violet-400/60"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-white/[0.08] pt-6">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/[0.05]"
                  >
                    Cancel
                  </button>
                  
<button
  type="submit"
  className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-900/30 transition-all duration-200 hover:scale-[1.03] hover:brightness-125 hover:shadow-violet-500/40 active:scale-95 active:brightness-90"
>
  Save Question
</button>

                </div>
              </form>
            ) : (
              <div className="px-6 py-16 text-center sm:px-8">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/10 text-3xl text-violet-300">
                  {"</>"}
                </div>
                <h3 className="text-lg font-medium">Your question library</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                  Start building your coding assessment library by adding your
                  first question.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-6 rounded-full border border-violet-400/25 bg-violet-500/10 px-5 py-3 text-sm text-violet-200 transition hover:bg-violet-500/20"
                >
                  Create your first question →
                </button>
              </div>
            )}
          </section>
          )}

          {activeTab === "Users" && (
            <section className="rounded-3xl border border-white/[0.1] bg-white/[0.035] p-8 shadow-2xl shadow-black/20 backdrop-blur-2xl">
              <h2 className="text-2xl font-semibold">Users</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">User management needs a users API before registered users can be listed or edited.</p>
            </section>
          )}

          {activeTab === "Analytics" && (
            <section className="rounded-3xl border border-white/[0.1] bg-white/[0.035] p-8 shadow-2xl shadow-black/20 backdrop-blur-2xl">
              <h2 className="text-2xl font-semibold">Analytics</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">Analytics require assessment-attempt and activity data from the backend.</p>
            </section>
          )}

          {activeTab === "Settings" && (
            <section className="rounded-3xl border border-white/[0.1] bg-white/[0.035] p-8 shadow-2xl shadow-black/20 backdrop-blur-2xl">
              <h2 className="text-2xl font-semibold">Settings</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">Platform configuration controls can be added here.</p>
            </section>
          )}

          <footer className="mt-7 text-center text-xs text-slate-600">
            Talent IQ · Administration workspace
          </footer>
        </main>
      </div>
    </div>
  );
}

export default Admin;
