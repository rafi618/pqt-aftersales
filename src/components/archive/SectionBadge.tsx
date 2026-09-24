import { getCategory, getSection } from "@/lib/archive/taxonomy";
import { cn } from "@/lib/utils";

export default function SectionBadge({
  section,
  category,
  className,
}: {
  section: string;
  category?: string;
  className?: string;
}) {
  const s = getSection(section);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        s.color,
        className
      )}
    >
      <span className="font-mono">{s.code}</span>
      {category ? ` · ${getCategory(category)?.label ?? category}` : ` · ${s.label}`}
    </span>
  );
}
