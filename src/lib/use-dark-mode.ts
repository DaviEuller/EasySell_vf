import * as React from "react"

import { useTheme } from "@/components/theme-provider"

// Fonte única do tema: lê/escreve o ThemeProvider (classe .dark no <html>).
export function useDarkMode() {
  const { theme, setTheme } = useTheme()

  const darkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  const setDarkMode: React.Dispatch<React.SetStateAction<boolean>> = (
    value
  ) => {
    const next = typeof value === "function" ? value(darkMode) : value
    setTheme(next ? "dark" : "light")
  }

  return { darkMode, setDarkMode }
}
