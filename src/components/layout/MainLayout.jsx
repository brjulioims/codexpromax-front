import { useEffect, useMemo, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const SIDEBAR_OPEN_STORAGE_KEY = "sidebarOpen";

export default function MainLayout({ children, activePath = "/", onNavigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false;

    const storedValue = window.localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY);
    if (storedValue != null) return storedValue === "true";

    return window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");

    const sync = () => {
      const storedValue = window.localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY);
      if (storedValue == null) {
        setSidebarOpen(media.matches);
      }
    };

    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  const layoutMarginClass = useMemo(
    () => (sidebarOpen ? "md:ml-[17rem]" : "md:ml-20"),
    [sidebarOpen],
  );

  const closeIfMobile = () => {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar
        open={sidebarOpen}
        activePath={activePath}
        onNavigate={onNavigate}
        onClose={closeIfMobile}
        onToggle={() => setSidebarOpen((s) => !s)}
      />
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Cerrar sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      ) : null}
      <div className={`relative z-0 ml-0 transition-[margin] duration-300 ${layoutMarginClass}`}>
        <Navbar
          open={sidebarOpen}
          activePath={activePath}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
        />
        <main className="relative z-0 px-6 pb-6 pt-3 md:px-5 md:pb-5 md:pt-2">{children}</main>
      </div>
    </div>
  );
}
