import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ModelSelector from "@/components/ModelSelector";
import { NotificationContainer } from "@/components/ui/notification";

function AppLayout() {
  const location = useLocation();
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery("");
  }, [location.pathname]);

  return (
    <>
      <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 flex">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 border-r border-gray-700 bg-gray-800/90 backdrop-blur-sm">
        <div className="p-4 flex flex-col gap-4">
          <div className="text-lg font-semibold tracking-tight text-gray-100">GhostWriter</div>
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />

          {/* Main Navigation */}
          <nav className="flex flex-col gap-1">
            <div className="text-xs font-medium text-gray-400 mb-2 px-3 text-white">EXPLORE</div>
            <NavItem to="/explore" label="🔍 Explore" className="text-white" />
            <NavItem to="/code" label="📄 Code" className="text-white" />

            <div className="text-xs font-medium text-gray-400 mb-2 mt-4 px-3">AI ASSISTANT</div>
            <NavItem to="/chat" label="💬 Chat" className="text-white"/>
            <NavItem to="/ingest" label="📥 Ingest" className="text-white"/>

            <div className="text-xs font-medium text-gray-400 mb-2 mt-4 px-3">SYSTEM</div>
            <NavItem to="/settings" label="⚙️ Settings" className="text-white"/>
          </nav>

          {/* Tips Card */}
          <Card className="p-3 mt-auto bg-gray-700/50 border-gray-600">
            <div className="text-sm font-medium text-gray-300 mb-2">🚀 Quick Start</div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Add documents in <strong className="text-gray-200">Ingest</strong></li>
              <li>• Ask questions in <strong className="text-gray-200">Chat</strong></li>
              <li>• Check status in <strong className="text-gray-200">Settings</strong></li>
            </ul>
          </Card>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-gray-700 px-4 flex items-center justify-between gap-2 sticky top-0 bg-gray-800/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="hidden sm:inline">Ghostwriter</span>
            <span className="hidden sm:inline">/</span>
            <span className="font-medium capitalize text-gray-200">
              {getPageTitle(location.pathname)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ModelSelector />
            <Button asChild variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <a href="https://cursor.sh" target="_blank" rel="noopener noreferrer">Help</a>
            </Button>
          </div>
        </header>

        <section className="flex-1 min-h-0 p-4 xl:p-6 relative z-0">
          <Outlet />
        </section>
      </main>
    </div>
    
    {/* Notification Container */}
    <NotificationContainer />
  </>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "px-3 py-2 rounded-md text-sm transition-colors " +
        (isActive
          ? "bg-blue-600 text-white font-medium"
          : "hover:bg-gray-700 hover:text-gray-200 text-gray-300")
      }
    >
      {label}
    </NavLink>
  );
}

// Helper function to get proper page titles
function getPageTitle(pathname: string): string {
  const path = pathname.replace("/", "") || "explore";
  const titles: Record<string, string> = {
    "explore": "🔍 Explore",
    "code": "📄 Code",
    "chat": "💬 Chat",
    "ingest": "📥 Ingest",
    "settings": "⚙️ Settings"
  };
  return titles[path] || path;
}

export default AppLayout;
