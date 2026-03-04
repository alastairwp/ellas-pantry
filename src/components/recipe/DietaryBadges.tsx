import { Badge } from "@/components/ui/Badge";

type BadgeVariant = "green" | "emerald" | "amber" | "blue" | "purple" | "gray";

interface DietaryTag {
  name: string;
  slug: string;
}

interface DietaryBadgesProps {
  tags: DietaryTag[];
}

const slugToVariant: Record<string, BadgeVariant> = {
  vegan: "green",
  vegetarian: "emerald",
  "gluten-free": "amber",
  "dairy-free": "blue",
  "nut-free": "purple",
};

export function DietaryBadges({ tags }: DietaryBadgesProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge
          key={tag.slug}
          label={tag.name}
          variant={slugToVariant[tag.slug] ?? "gray"}
        />
      ))}
    </div>
  );
}
