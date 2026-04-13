/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-2px)" },
          "50%": { transform: "translateX(2px)" },
          "75%": { transform: "translateX(-2px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(-50%)" },
          "50%": { transform: "translateY(-55%)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
        float: "float 3s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "fade-in-slow": "fadeIn 0.5s ease-in-out",
        spin: "spin 1s linear infinite",
        "theme-toggle": "pulse 1s ease-in-out 1",
      },
      colors: {
        cq: {
          canvas: "#f2f6fb",
          "canvas-dark": "#070f1f",
          panel: "#ffffff",
          "panel-dark": "#101b32",
          "panel-muted": "#eef4fb",
          "panel-muted-dark": "#0c162b",
          border: "#d6e2f1",
          "border-dark": "#24324c",
          text: "#0f172a",
          "text-dark": "#e2e8f0",
          muted: "#64748b",
          "muted-dark": "#94a3b8",
          accent: "#14b8a6",
          "accent-dark": "#2dd4bf",
          "accent-soft": "#ccfbf1",
          buy: "#22c55e",
          sell: "#ef4444",
          info: "#3b82f6",
          warning: "#f59e0b",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
