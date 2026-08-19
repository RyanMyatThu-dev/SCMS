/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
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
        pearl: {
          50: "#FCFCFA",
          100: "#FAF9F5",
          200: "#F5F4EE",
          300: "#EBE9DF",
        },
        apricot: {
          50: "#FFF8F0",
          100: "#FEEDDC",
          200: "#FDD9B5",
          300: "#FBBF82",
          400: "#F99E4A",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#431407",
        },
        scms: {
          primary: "#18181B",
          primaryDark: "#09090B",
          primaryLight: "#F5F4EE",
          success: "#059669",
          warning: "#D97706",
          danger: "#E11D48",
          bg: "#FAF9F5",
          card: "#FFFFFF",
          text: "#18181B",
          muted: "#71717A",
          border: "#E7E5E0",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        scms: "0 1px 3px 0 rgba(24, 24, 27, 0.03), 0 1px 2px -1px rgba(24, 24, 27, 0.03)",
        "scms-raised": "0 12px 36px -4px rgba(24, 24, 27, 0.06), 0 4px 6px -2px rgba(24, 24, 27, 0.02)",
        "scms-modal": "0 25px 50px -12px rgba(24, 24, 27, 0.2)",
        glass: "0 8px 32px 0 rgba(24, 24, 27, 0.04)",
        ambient: "0 20px 80px -15px rgba(251, 191, 130, 0.25)",
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
  plugins: [],
};

