import { cn, statusColors, priorityColors } from "@/lib/utils";

interface StatusBadgeProps {
  value: string;
  type?: "status" | "priority";
}

export default function StatusBadge({
  value,
  type = "status",
}: StatusBadgeProps) {
  const colors = type === "priority" ? priorityColors : statusColors;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        colors[value] || "bg-gray-100 text-gray-800"
      )}
    >
      {value.replace("-", " ")}
    </span>
  );
}
