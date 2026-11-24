
"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Sync with the existing document theme after hydration.
    // This intentional sync avoids server/client theme mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);

    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      className="icon-btn"
      aria-label="Toggle theme"
      title="Toggle light/dark"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
