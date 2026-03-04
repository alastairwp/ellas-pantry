type BadgeVariant = "green" | "emerald" | "amber" | "blue" | "purple" | "gray";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  green: "bg-green-100 text-green-800 border-green-200",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  gray: "bg-stone-100 text-stone-700 border-stone-200",
};

export function Badge({ label, variant = "gray" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}
