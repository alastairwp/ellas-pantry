const COLORS = [
  "bg-orange-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-lg",
  lg: "h-20 w-20 text-3xl",
};

interface AvatarProps {
  name: string | null | undefined;
  image?: string | null;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ name, image, size = "md" }: AvatarProps) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name || "User avatar"}
        className={`${SIZES[size]} rounded-full object-cover shrink-0`}
      />
    );
  }

  const displayName = name || "?";
  const initial = displayName.charAt(0).toUpperCase();
  const colorIndex = hashName(displayName) % COLORS.length;

  return (
    <div
      className={`${SIZES[size]} ${COLORS[colorIndex]} inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0`}
    >
      {initial}
    </div>
  );
}
