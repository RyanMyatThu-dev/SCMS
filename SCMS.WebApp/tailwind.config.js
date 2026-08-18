import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        scms: {
          primary: "#0052CC",
          primaryDark: "#003D99",
          primaryLight: "#EBF2FF",
          success: "#027A48",
          warning: "#B54708",
          danger: "#D92D20",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          text: "#0F172A",
          muted: "#64748B",
          border: "#E2E8F0",
        },
        apple: {
          indigo: "#4F46E5",
          indigoLight: "#EEF2FF",
          blue: "#0A84FF",
          teal: "#0D9488",
          tealLight: "#F0FDFA",
          green: "#059669",
          greenLight: "#ECFDF5",
          amber: "#D97706",
          amberLight: "#FFFBEB",
          rose: "#E11D48",
          roseLight: "#FFF1F2",
          slate: "#0F172A",
        },
      },
      boxShadow: {
        scms: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        "scms-raised": "0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
        "scms-modal": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Inter",
          "Manrope",
          "system-ui",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  daisyui: {
    themes: [
      {
        scms: {
          primary: "#0052CC",
          secondary: "#EBF2FF",
          accent: "#027A48",
          neutral: "#0F172A",
          "base-100": "#FFFFFF",
          "base-200": "#F8FAFC",
          "base-300": "#E2E8F0",
          info: "#0052CC",
          success: "#027A48",
          warning: "#B54708",
          error: "#D92D20",
        },
      },
    ],
  },
  plugins: [daisyui],
};
