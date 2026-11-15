
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut,
  useAuth,
} from "@clerk/clerk-react";
import { useEffect, useState } from "react";

import Home from "./pages/Home";
import Problems from "./pages/Problems";
import Admin from "./pages/Admin";
import VideoInterview from "./pages/VideoInterview";
import Assessment from "./pages/Assessment";
import AdminAssessments from "./pages/AdminAssessments";

function App() {
  const location = useLocation();
  const { getToken, isSignedIn, isLoaded } = useAuth();

  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRole = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setUserRole(null);
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);

      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Clerk token unavailable");
        }

        const response = await fetch("http://localhost:3000/api/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Role request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);

        if (!cancelled) {
          setUserRole(null);
        }
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
        }
      }
    };

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  const navLinkClass = (path) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      location.pathname === path
        ? "bg-violet-500/15 text-violet-300"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="relative min-h-screen bg-[#080b18] text-white">
      <nav className="relative z-50 flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#080b18]/90 px-5 py-4 backdrop-blur-xl sm:px-8">
        <Link to="/" className="mr-4 text-xl font-bold tracking-tight">
          Talent <span className="text-violet-400">IQ</span>
        </Link>

        <Link to="/" className={navLinkClass("/")}>
          Home
        </Link>

        <Link to="/problems" className={navLinkClass("/problems")}>
          Problems
        </Link>

        {isSignedIn && userRole !== "admin" && (
          <Link to="/assessment" className={navLinkClass("/assessment")}>
            Take Assessment
          </Link>
        )}

        {isSignedIn && userRole === "admin" && (
          <>
            <Link to="/admin" className={navLinkClass("/admin")}>
              Admin
            </Link>
            <Link to="/admin/assessments" className={navLinkClass("/admin/assessments")}>
              Assessments
            </Link>
          </>
        )}

        <div className="ml-auto flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                type="button"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />

          {/* All problems list */}
          <Route path="/problems" element={<Problems />} />

          {/* Individual problem details */}
          <Route path="/problems/:id" element={<Problems />} />
          <Route path="/interview" element={<VideoInterview />} />
          <Route
            path="/assessment"
            element={
              !isLoaded || roleLoading ? (
                <div className="p-8 text-center text-slate-300">Verifying access...</div>
              ) : !isSignedIn || userRole === "admin" ? (
                <Navigate to="/" replace />
              ) : (
                <Assessment />
              )
            }
          />

          <Route
            path="/admin/assessments"
            element={
              !isLoaded || roleLoading ? (
                <div className="p-8 text-center text-slate-300">Verifying access...</div>
              ) : !isSignedIn ? (
                <Navigate to="/" replace />
              ) : userRole === "admin" ? (
                <AdminAssessments />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/admin"
            element={
              !isLoaded || roleLoading ? (
                <div className="p-8 text-center text-slate-300">
                  Verifying access...
                </div>
              ) : !isSignedIn ? (
                <Navigate to="/" replace />
              ) : userRole === "admin" ? (
                <Admin />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
