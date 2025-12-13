/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Background
        "bg-primary": "#1B2838",
        "bg-secondary": "#2A3F54",
        "bg-tertiary": "#1E2A38",

        // Text
        "txt-primary": "#FFFFFF",
        "txt-secondary": "#8B95A5",
        "txt-tertiary": "#6B7280",

        // Accent
        "accent-cyan": "#00F5D4",
        "accent-cyan-dim": "#2EE5C9",
        "accent-orange": "#FF6B35",

        // Interactive
        border: "#3A4F64",
        toggle: "#FFFFFF",

        // Status
        success: "#10B981",
        error: "#EF4444",
        warning: "#F59E0B",
        info: "#3B82F6",
      },
    },
  },
  plugins: [],
};
