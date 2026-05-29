import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
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
          bg: "#F6F8FB",
          card: "#FFFFFF",
          text: "#1D2939",
          muted: "#667085",
          border: "#E4E7EC",
        },
      },
      boxShadow: {
        scms: "0 1px 2px rgba(16,24,40,0.04)",
        "scms-raised": "0 18px 50px rgba(16,24,40,0.08)",
        "scms-modal": "0 24px 70px rgba(16,24,40,0.25)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Manrope",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
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
          neutral: "#1D2939",
          "base-100": "#FFFFFF",
          "base-200": "#F6F8FB",
          "base-300": "#E4E7EC",
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
