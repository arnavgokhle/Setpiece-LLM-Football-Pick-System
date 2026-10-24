import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatKickoff(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }) + " IST";
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-accent";
  if (confidence >= 65) return "text-yellow-400";
  return "text-ink-muted";
}

export function getConfidenceBg(confidence: number): string {
  if (confidence >= 80) return "bg-accent/10 text-accent border-accent/30";
  if (confidence >= 65) return "bg-yellow-400/10 text-yellow-400 border-yellow-400/30";
  return "bg-ink-faint/20 text-ink-muted border-ink-faint/30";
}
