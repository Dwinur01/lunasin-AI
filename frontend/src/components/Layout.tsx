import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const location = useLocation();
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 400); // 400ms matching the load-bar animation
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const isLinkActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const getLinkClass = (path: string) => {
    const base = "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200";
    return isLinkActive(path)
      ? `${base} text-white bg-indigo-600/20 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]`
      : `${base} text-slate-400 hover:text-white hover:bg-slate-900`;
  };

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 font-sans flex flex-col relative">
      {/* Top Progress Bar for Page Transitions */}
      {pageLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-[9999] animate-load-bar">
          <div className="h-full w-full shadow-[0_0_12px_#6366f1]" />
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2 group">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:from-indigo-300 group-hover:to-pink-300 transition-all duration-300">
                Lunasin AI
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded font-mono border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-colors">
                MVP
              </span>
            </Link>
            <nav className="hidden md:flex space-x-2">
              <Link to="/dashboard" className={getLinkClass("/dashboard")}>
                Dashboard
              </Link>
              <Link to="/invoices" className={getLinkClass("/invoices")}>
                Invoices
              </Link>
              <Link to="/clients" className={getLinkClass("/clients")}>
                Clients
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="font-semibold text-slate-200">Mitra Abadi Jaya</span>
              <span className="text-slate-400">Tenant default</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm text-white shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:scale-105 transition-transform cursor-pointer">
              M
            </div>
          </div>
        </div>
        {/* Mobile navigation */}
        <div className="md:hidden border-t border-slate-800 bg-slate-900/80 px-4 py-2 flex justify-around text-xs font-semibold">
          <Link 
            to="/dashboard" 
            className={`py-1 px-3 rounded-md transition-colors ${
              isLinkActive("/dashboard") ? "text-indigo-400 bg-slate-800/50" : "text-slate-400"
            }`}
          >
            Dashboard
          </Link>
          <Link 
            to="/invoices" 
            className={`py-1 px-3 rounded-md transition-colors ${
              isLinkActive("/invoices") ? "text-indigo-400 bg-slate-800/50" : "text-slate-400"
            }`}
          >
            Invoices
          </Link>
          <Link 
            to="/clients" 
            className={`py-1 px-3 rounded-md transition-colors ${
              isLinkActive("/clients") ? "text-indigo-400 bg-slate-800/50" : "text-slate-400"
            }`}
          >
            Clients
          </Link>
        </div>
      </header>

      {/* Main Content Area with transition */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`transition-all duration-350 ease-in-out ${
          pageLoading 
            ? "opacity-20 translate-y-2 filter blur-[1px]" 
            : "opacity-100 translate-y-0 filter blur-0"
        }`}>
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          Lunasin AI © {new Date().getFullYear()} — Built for H0 Hackathon (Vercel v0 + AWS Databases)
        </div>
      </footer>
    </div>
  );
}
