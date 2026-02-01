import { Routes, Route, Link, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Solutions from "./pages/Solutions";
import Aggregations from "./pages/Aggregations";

function NavLink({
  to,
  children,
  icon,
}: {
  to: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
        isActive
          ? "bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-300"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      }`}
    >
      <span
        className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
      >
        {icon}
      </span>
      <span className="font-medium">{children}</span>
      {isActive && (
        <span className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      )}
    </Link>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white"
          >
            <path
              d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 8v4m0 0v4m0-4h4m-4 0H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#050a0e] animate-pulse" />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          <span className="gradient-text-cyan">Claw</span>
          <span className="text-slate-200">Swarm</span>
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 -mt-0.5">
          Neural Mesh
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <div className="min-h-screen">
      {/* Navigation - hide on landing page */}
      {!isLandingPage && (
        <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050a0e]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-20">
              <Logo />
              <div className="flex items-center gap-1 bg-white/[0.02] rounded-2xl p-1.5 border border-white/5">
                <NavLink
                  to="/dashboard"
                  icon={
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/solutions"
                  icon={
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                  }
                >
                  Solutions
                </NavLink>
                <NavLink
                  to="/aggregations"
                  icon={
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  }
                >
                  Aggregations
                </NavLink>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                    Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className={isLandingPage ? "" : "max-w-7xl mx-auto px-6 py-10"}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/aggregations" element={<Aggregations />} />
        </Routes>
      </main>
    </div>
  );
}
