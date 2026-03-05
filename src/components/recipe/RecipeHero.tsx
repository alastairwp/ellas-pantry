import Image from "next/image";
import { formatDuration } from "@/lib/utils";

interface RecipeHeroProps {
  title: string;
  heroImage: string;
  prepTime: number;
  cookTime: number;
}

export function RecipeHero({
  title,
  heroImage,
  prepTime,
  cookTime,
}: RecipeHeroProps) {
  return (
    <div className="relative w-full h-[250px] md:h-[400px] overflow-hidden">
      <Image
        src={heroImage}
        alt={title}
        fill
        priority
        sizes="100vw"
        className="object-cover"
        unoptimized={heroImage.startsWith("/")}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            {title}
          </h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium text-white border border-white/30">
              Prep: {formatDuration(prepTime)}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium text-white border border-white/30">
              Cook: {formatDuration(cookTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
