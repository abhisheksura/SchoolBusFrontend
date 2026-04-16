// app/providers/ThemeProvider.tsx
// Manages dark / light mode.
// Reads the user's OS preference on first load, persists their choice
// to localStorage, and applies the "dark" class to <html> for Tailwind's
// dark: variant to work.
//
// Usage anywhere in the app:
//   const { theme, toggleTheme } = useTheme();

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "light",
    setTheme: () => {},
    toggleTheme: () => {},
});

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);

// ---------------------------------------------------------------------------

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
    defaultTheme = "light",
    storageKey = "bus-tracker-theme",
}) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        // 1. Check localStorage for an explicit user preference
        const stored = localStorage.getItem(storageKey) as Theme | null;
        if (stored === "light" || stored === "dark") return stored;

        // 2. Fall back to OS preference
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";

        return defaultTheme;
    });

    // Apply / remove the "dark" class on <html> whenever theme changes
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        localStorage.setItem(storageKey, theme);
    }, [theme, storageKey]);

    const setTheme = (next: Theme): void => setThemeState(next);

    const toggleTheme = (): void =>
        setThemeState((prev) => (prev === "light" ? "dark" : "light"));

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;