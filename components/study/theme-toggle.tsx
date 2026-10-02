"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") ||
      (localStorage.getItem("studylens-theme") === "dark") ||
      (!localStorage.getItem("studylens-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      document.documentElement.classList.add("dark");
      setThemeState("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setThemeState("light");
    }
  }, []);

  function setTheme(newTheme: "light" | "dark") {
    setThemeState(newTheme);
    localStorage.setItem("studylens-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return { theme, setTheme, toggleTheme };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={className}
      onClick={toggleTheme}
      size="icon"
      type="button"
      variant="ghost"
    >
      {theme === "dark" ? (
        <Sun className="size-4 text-foreground transition-transform" />
      ) : (
        <Moon className="size-4 text-muted-foreground transition-transform" />
      )}
    </Button>
  );
}
