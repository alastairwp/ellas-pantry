import { Clock, Timer, Users, Gauge } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface RecipeMetaProps {
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
}

export function RecipeMeta({
  prepTime,
  cookTime,
  servings,
  difficulty,
}: RecipeMetaProps) {
  const items = [
    {
      icon: Clock,
      label: "Prep",
      value: formatDuration(prepTime),
    },
    {
      icon: Timer,
      label: "Cook",
      value: formatDuration(cookTime),
    },
    {
      icon: Users,
      label: "Servings",
      value: `${servings}`,
    },
    {
      icon: Gauge,
      label: "Difficulty",
      value: difficulty,
    },
  ];

  return (
    <div className="flex flex-wrap gap-6 py-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm">
          <item.icon className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-stone-400 text-xs uppercase tracking-wide">
              {item.label}
            </p>
            <p className="font-medium text-stone-700">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
