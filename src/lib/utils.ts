import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function generateTicketNo(): string {
  const prefix = "TKT";
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
}

export function generateClaimNo(): string {
  const prefix = "WRC";
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
}

export function generatePartNo(): string {
  const prefix = "PRT";
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
}

export const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  pending: "bg-orange-100 text-orange-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};
