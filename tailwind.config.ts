import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Setpiece tactics-board palette ────────────────────
        "void-black":               "#0b0e0c",
        "surface-card":             "#121714",
        "surface-variant":          "#232b25",
        "surface-bright":           "#28312a",
        "surface-container":        "#121714",
        "surface-container-low":    "#0d100e",
        "surface-container-high":   "#171d18",
        "surface-container-highest":"#232b25",
        "surface-container-lowest": "#070a08",
        "surface-dim":              "#0a0d0b",
        "on-surface":               "#f2f5f0",
        "on-surface-variant":       "#a7b3a9",
        "on-primary":               "#08110b",
        "on-secondary":             "#1a201b",
        "on-secondary-container":   "#aab6ac",
        "on-secondary-fixed-variant":"#48544b",
        "secondary-container":      "#48544b",
        "outline-variant":          "#232b25",
        "primary-fixed-dim":        "#46b167",
        "primary-container":        "#46b167",
        "system-red":               "#e0574f",
        "system-yellow":            "#d9a13f",
        "edge-glow":                "rgba(85, 200, 120, 0.2)",
        "accent-blue":              "#9db2a4",
        // primary/secondary as flat tokens
        primary: "#55c878",
        secondary: "#a7b3a9",

        // ── Legacy tokens (mapped to new palette) ─────────────
        accent: {
          DEFAULT: "#55c878",
          dim: "#46b167",
          glow: "rgba(85, 200, 120, 0.15)",
        },
        surface: {
          DEFAULT: "#121714",
          nav: "#070a08",
          1: "#171d18",
          2: "#121714",
          3: "#232b25",
          border: "#232b25",
        },
        ink: {
          DEFAULT: "#f2f5f0",
          muted: "#93a196",
          faint: "#4d5850",
        },
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm:      "0.125rem",
        md:      "0.375rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        "2xl":   "1rem",
        "3xl":   "1.5rem",
        full:    "9999px",
      },
      spacing: {
        "edge-margin":  "32px",
        "stack-sm":     "8px",
        "stack-md":     "16px",
        "stack-lg":     "32px",
        gutter:         "24px",
        "container-max":"1280px",
      },
      fontFamily: {
        // Display — Archivo, athletic + editorial
        display:            ["var(--font-display)", "system-ui", "sans-serif"],
        "headline-display": ["var(--font-display)", "system-ui", "sans-serif"],
        "hero-lg":          ["var(--font-display)", "system-ui", "sans-serif"],
        "hero-sm":          ["var(--font-display)", "system-ui", "sans-serif"],
        "headline-card":    ["var(--font-display)", "system-ui", "sans-serif"],
        // Data — IBM Plex Mono
        "label-caps":       ["var(--font-mono)", "monospace"],
        "data-mono":        ["var(--font-mono)", "monospace"],
        // Body — Geist
        "body-lg":          ["var(--font-sans)", "system-ui", "sans-serif"],
        "body-sm":          ["var(--font-sans)", "system-ui", "sans-serif"],
        sans:               ["var(--font-sans)", "system-ui", "sans-serif"],
        mono:               ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "hero-lg":         ["72px", { lineHeight: "0.95", letterSpacing: "-0.03em", fontWeight: "800" }],
        "hero-sm":         ["48px", { lineHeight: "1",    letterSpacing: "-0.03em", fontWeight: "800" }],
        "headline-display":["32px", { lineHeight: "1.1",  letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-card":   ["20px", { lineHeight: "1.3",  letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-lg":         ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm":         ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "data-mono":       ["14px", { lineHeight: "1",   fontWeight: "500" }],
        "label-caps":      ["11px", { lineHeight: "1",   letterSpacing: "0.12em", fontWeight: "500" }],
      },
      animation: {
        "pulse-slow":      "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in":         "fadeIn 0.4s ease-out",
        "slide-up":        "slideUp 0.4s ease-out",
        "slide-up-fade":   "slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "edge-pulse":      "edgePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "winner-glow":     "winnerGlow 2.5s ease-in-out infinite",
        "vibrate":         "vibrate 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUpFade: {
          "0%":   { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        edgePulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(85, 200, 120, 0)" },
          "50%":      { boxShadow: "0 0 15px 4px rgba(85, 200, 120, 0.4)" },
        },
        winnerGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(85,200,120,0.3), inset 0 0 10px rgba(85,200,120,0.1)" },
          "50%":      { boxShadow: "0 0 40px rgba(85,200,120,0.6), inset 0 0 20px rgba(85,200,120,0.3)" },
        },
        vibrate: {
          "0%, 100%": { transform: "translate(0)" },
          "10%":      { transform: "translate(-2px, 2px)" },
          "20%":      { transform: "translate(2px, -2px)" },
          "30%":      { transform: "translate(-2px, -2px)" },
          "40%":      { transform: "translate(2px, 2px)" },
          "50%":      { transform: "translate(-1px, 1px)" },
          "60%":      { transform: "translate(1px, -1px)" },
          "70%":      { transform: "translate(-1px, -1px)" },
          "80%":      { transform: "translate(1px, 1px)" },
          "90%":      { transform: "translate(0px, 1px)" },
        },
      },
      boxShadow: {
        "edge":        "0 0 8px rgba(85, 200, 120, 0.18)",
        "edge-lg":     "0 0 20px rgba(85, 200, 120, 0.25)",
        "winner":      "0 0 40px rgba(85, 200, 120, 0.5)",
        "glow-green":    "0 0 20px rgba(85, 200, 120, 0.14)",
        "glow-green-lg": "0 0 40px rgba(85, 200, 120, 0.12)",
        card:            "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)",
        "card-hover":    "0 4px 16px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
