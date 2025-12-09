export const getSetupCategory = (
  percentage: number
): { label: string; color: string } => {
  if (percentage <= 30) return { label: "Weak Setup", color: "#EF4444" };
  if (percentage <= 55) return { label: "Below Standard", color: "#F59E0B" };
  if (percentage <= 65) return { label: "Moderate", color: "#F59E0B" };
  if (percentage <= 75) return { label: "Acceptable", color: "#FCD34D" };
  if (percentage <= 85) return { label: "Good", color: "#10B981" };
  if (percentage <= 95) return { label: "Strong", color: "#10B981" };
  if (percentage <= 115) return { label: "Very Strong", color: "#00F5D4" };
  if (percentage <= 135) return { label: "Outstanding", color: "#00F5D4" };
  if (percentage <= 155) return { label: "Excellent", color: "#00F5D4" };
  return { label: "Perfect Trade", color: "#00F5D4" };
};
