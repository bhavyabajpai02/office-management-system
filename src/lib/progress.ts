export type UomDirection = "min" | "max" | "timeline" | "zero";

interface ProgressInput {
  direction: UomDirection;
  target: number;
  actual: number;
  deadline?: string | null;
  completionDate?: string | null;
}

export function calcProgress(p: ProgressInput): number {
  const { direction, target, actual } = p;
  if (direction === "zero") {
    return actual === 0 ? 100 : 0;
  }
  if (direction === "timeline") {
    if (!p.deadline)
      return actual >= target ? 100 : Math.round((actual / Math.max(target, 1)) * 100);
    if (!p.completionDate) return 0;
    return new Date(p.completionDate) <= new Date(p.deadline) ? 100 : 50;
  }
  if (target <= 0) return 0;
  let pct =
    direction === "min" ? (actual / target) * 100 : (target / Math.max(actual, 0.0001)) * 100;
  pct = Math.max(0, Math.min(100, pct));
  return Math.round(pct);
}

export const THRUST_AREAS = [
  "Customer Experience",
  "Operational Excellence",
  "Innovation",
  "People & Culture",
  "Revenue Growth",
  "Quality & Compliance",
  "Cost Optimization",
  "Digital Transformation",
];
