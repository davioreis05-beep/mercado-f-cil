import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  const toggle = () => {
    const d = !dark;
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
    localStorage.setItem("sf-theme", d ? "dark" : "light");
  };
  return (
    <button onClick={toggle} aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"} className="rounded-full border px-3 py-2 text-sm font-semibold hover:bg-secondary">
      {dark ? "☀️ Claro" : "🌙 Escuro"}
    </button>
  );
}
