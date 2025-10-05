/* Master Palette — NovaOS | Black Rose | GypsyCove — Sovereign Standard */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Enables class-based theme switching
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Ensures Tailwind scans all relevant files
  ],
  theme: {
    extend: {
      colors: {
        "blackRose": {
          "trueBlack": "#000003",
          "midnightNavy": "#19212A",
          "deepTeal": "#013E43",
          "bloodBrown": "#431D21",
          "roseMauve": "#A33A5B",
          "deepRosewood": "#89333F",
          "bg": "#0A0A0C",
          "fg": "#F3F0FA"
        },
        "novaOS": {
          "blueLight": "#f0f4ff",
          "blueDark": "#1d4ed8",
          "lavender": "#e4e4ff",
          "coral": "#ff7875",
          "peach": "#ffb3a0",
          "p1": "#2B2537",
          "p2": "#5A4B7A"
        },
        "studios": {
          "scarletStudio": {
            "crimson": "#dc2626",
            "wine": "#7f1d1d",
            "blush": "#fecaca",
            "signal": "#E66F5C"
          },
          "lightboxStudio": {
            "platinum": "#e5e7eb",
            "pearl": "#f9fafb",
            "studioLight": "#ffffff"
          },
          "inkSteel": {
            "iron": "#6b7280",
            "steel": "#4b5563",
            "graphite": "#374151",
            "silver": "#d1d5db",
            "neutral": "#999"
          },
          "expression": {
            "orchid": "#c084fc",
            "violet": "#8b5cf6",
            "ivory": "#fffbeb"
          },
          "cipherCore": {
            "cyberBlue": "#06b6d4",
            "neon": "#10b981",
            "slate": "#334155",
            "emerald": "#0CE7A1"
          }
        },
        "status": {
          "success": {
            "main": "#10b981",
            "light": "#d1fae5",
            "dark": "#047857"
          },
          "warning": {
            "main": "#f59e0b",
            "light": "#fef3c7",
            "dark": "#d97706"
          },
          "danger": {
            "main": "#ef4444",
            "light": "#fee2e2",
            "dark": "#dc2626"
          },
          "info": {
            "main": "#3b82f6",
            "light": "#dbeafe",
            "dark": "#1d4ed8"
          }
        },
        "phantom": {
          "accent": "#8b5cf6",
          "glow": "#a78bfa",
          "shadow": "#6d28d9"
        },
        "admin": {
          "alert": "#f59e0b",
          "control": "#06b6d4",
          "danger": "#ef4444"
        }
      }
    }
  },
  plugins: [],
};
