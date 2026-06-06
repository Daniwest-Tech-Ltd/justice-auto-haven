import { supabase } from "@/integrations/supabase/client";

export type Theme = "light" | "dark" | "system";

export function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  
  if (theme === "system") {
    const systemTheme = getSystemTheme();
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}

export async function setTheme(theme: Theme, userId?: string) {
  // Apply to DOM immediately
  applyTheme(theme);
  
  // Save to localStorage
  localStorage.setItem("theme", theme);
  
  // Save to database if user is logged in
  if (userId) {
    try {
      await supabase
        .from("profiles")
        .update({ theme })
        .eq("user_id", userId);
    } catch (error) {
      console.error("Error saving theme to database:", error);
    }
  }
}

export function initTheme() {
  // Check localStorage first
  const theme = localStorage.getItem("theme") as Theme | null;
  
  // If no saved theme or system, detect device theme
  if (!theme || theme === "system") {
    const systemTheme = getSystemTheme();
    document.documentElement.classList.add(systemTheme);
  } else {
    document.documentElement.classList.add(theme);
  }
}

// Listen for system theme changes
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (!savedTheme || savedTheme === "system") {
      applyTheme("system");
    }
  });
}
