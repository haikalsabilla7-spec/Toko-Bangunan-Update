/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palet industrial: netral + satu aksen oranye 'safety'
        ink: {
          DEFAULT: "#171717",
          soft: "#404040",
          muted: "#737373",
        },
        surface: {
          DEFAULT: "#ffffff",
          sunken: "#f5f5f4",
          raised: "#fafaf9",
        },
        line: {
          DEFAULT: "#e7e5e4",
          strong: "#d6d3d1",
        },
        accent: {
          DEFAULT: "#EA580C", // safety orange
          hover: "#c2410c",
          soft: "#fff7ed",
          line: "#fed7aa",
        },
        ok: { DEFAULT: "#15803d", soft: "#f0fdf4" },
        warn: { DEFAULT: "#b45309", soft: "#fffbeb" },
        danger: { DEFAULT: "#b91c1c", soft: "#fef2f2" },
      },
      fontFamily: {
        grotesk: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        md: "6px",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(23,23,23,0.06)",
        card: "0 1px 3px rgba(23,23,23,0.08)",
      },
      fontSize: {
        "2xs": ["11px", "14px"],
      },
    },
  },
  plugins: [],
}
