import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "var(--bg-page)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        raised: "var(--bg-raised)",
        border: "var(--border)",
        "border-subtle": "var(--border)",
        "border-strong": "var(--border)",
        text: "var(--text-primary)",
        "text-primary": "var(--text-primary)",
        muted: "var(--text-muted)",
        "text-muted": "var(--text-muted)",
        primary: "var(--primary-action)",
        baseline: "var(--signal-baseline)",
        canary: "var(--signal-canary)",
        healthy: "var(--signal-healthy)",
        failed: "var(--signal-failed)",
        signal: {
          cyan: "var(--signal-cyan)",
          emerald: "var(--signal-emerald)",
          amber: "var(--signal-amber)",
          coral: "var(--signal-coral)",
          steel: "var(--signal-steel)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      fontSize: {
        12: ["12px", { lineHeight: "16px" }],
        14: ["14px", { lineHeight: "20px" }],
        16: ["16px", { lineHeight: "24px" }],
        20: ["20px", { lineHeight: "28px" }],
        28: ["28px", { lineHeight: "36px" }],
        40: ["40px", { lineHeight: "48px" }],
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["14px", { lineHeight: "20px" }],
        md: ["16px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "28px" }],
        xl: ["28px", { lineHeight: "36px" }],
        "2xl": ["40px", { lineHeight: "48px" }],
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "4px",
        md: "4px",
        lg: "4px",
        xl: "4px",
        modal: "6px",
      },
      boxShadow: {
        none: "none",
      },
    },
  },
  plugins: [],
};

export default config;
