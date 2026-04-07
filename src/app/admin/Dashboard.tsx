"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Users,
  Star,
  MessageSquare,
  Heart,
  FolderOpen,
  Image,
  FileText,
  Eye,
  EyeOff,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
  Globe,
} from "lucide-react";

interface DashboardData {
  recipes: {
    total: number;
    published: number;
    unpublished: number;
    awaitingImages: number;
    awaitingIntros: number;
    thisWeek: number;
  };
  users: {
    total: number;
    activeLastMonth: number;
    thisWeek: number;
  };
  engagement: {
    ratings: number;
    reviews: number;
    savedRecipes: number;
    collections: number;
    avgRating: number;
    reviewsThisWeek: number;
  };
  categoryCounts: { name: string; count: number }[];
  dietaryTagCounts: { name: string; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
  difficultyBreakdown: { difficulty: string; count: number }[];
  topRatedRecipes: { title: string; slug: string; ratingCount: number }[];
  externalData?: {
    totalExternalRecipes: number;
    bySource: { source: string; count: number }[];
    recipesWithPopularity: number;
    latestScrapeRun: {
      sourceSite: string;
      status: string;
      recipesFound: number;
      recipesNew: number;
      startedAt: string;
      finishedAt: string | null;
    } | null;
  };
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = "amber",
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color?: "amber" | "green" | "blue" | "purple" | "red" | "stone";
  subtitle?: string;
}) {
  const colorClasses = {
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    stone: "bg-stone-100 text-stone-600",
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-stone-900">{value}</p>
          <p className="text-sm text-stone-500">{label}</p>
          {subtitle && (
            <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BarChart({
  items,
  maxValue,
  colorClass = "bg-amber-500",
}: {
  items: { name: string; count: number }[];
  maxValue: number;
  colorClass?: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="text-sm text-stone-600 w-28 truncate flex-shrink-0">
            {item.name}
          </span>
          <div className="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${colorClass} rounded-full transition-all`}
              style={{
                width: `${maxValue > 0 ? (item.count / maxValue) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-sm font-medium text-stone-700 w-12 text-right flex-shrink-0">
            {item.count.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

const dietaryColors: Record<string, string> = {
  Vegan: "bg-green-500",
  Vegetarian: "bg-emerald-500",
  "Gluten-Free": "bg-amber-500",
  "Dairy-Free": "bg-blue-500",
  "Nut-Free": "bg-purple-500",
  "Egg-Free": "bg-orange-500",
};

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 text-red-600 py-10">
        <AlertCircle className="h-5 w-5" />
        <span>{error || "Failed to load dashboard"}</span>
      </div>
    );
  }

  const maxCategory = Math.max(...data.categoryCounts.map((c) => c.count), 1);
  const maxDietary = Math.max(...data.dietaryTagCounts.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* This Week */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-600" />
          This Week
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="New Recipes"
            value={data.recipes.thisWeek}
            icon={BookOpen}
            color="amber"
          />
          <StatCard
            label="New Users"
            value={data.users.thisWeek}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="New Reviews"
            value={data.engagement.reviewsThisWeek}
            icon={MessageSquare}
            color="green"
          />
          <StatCard
            label="Avg Rating"
            value={data.engagement.avgRating > 0 ? `${data.engagement.avgRating}/5` : "-"}
            icon={Star}
            color="purple"
          />
        </div>
      </section>

      {/* Recipe Overview */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-600" />
          Recipes
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total"
            value={data.recipes.total.toLocaleString()}
            icon={BookOpen}
            color="amber"
          />
          <StatCard
            label="Published"
            value={data.recipes.published.toLocaleString()}
            icon={Eye}
            color="green"
          />
          <StatCard
            label="Unpublished"
            value={data.recipes.unpublished.toLocaleString()}
            icon={EyeOff}
            color="stone"
          />
          <StatCard
            label="Awaiting Images"
            value={data.recipes.awaitingImages.toLocaleString()}
            icon={Image}
            color={data.recipes.awaitingImages > 0 ? "red" : "stone"}
          />
          <StatCard
            label="Awaiting Intros"
            value={data.recipes.awaitingIntros.toLocaleString()}
            icon={FileText}
            color={data.recipes.awaitingIntros > 0 ? "red" : "stone"}
          />
        </div>
      </section>

      {/* Users & Engagement */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-600" />
          Users & Engagement
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Users"
            value={data.users.total}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="Active (30d)"
            value={data.users.activeLastMonth}
            icon={Clock}
            color="green"
          />
          <StatCard
            label="Ratings"
            value={data.engagement.ratings}
            icon={Star}
            color="amber"
          />
          <StatCard
            label="Reviews"
            value={data.engagement.reviews}
            icon={MessageSquare}
            color="purple"
          />
          <StatCard
            label="Saved Recipes"
            value={data.engagement.savedRecipes}
            icon={Heart}
            color="red"
          />
          <StatCard
            label="Collections"
            value={data.engagement.collections}
            icon={FolderOpen}
            color="stone"
          />
        </div>
      </section>

      {/* Source & Difficulty Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-stone-800 mb-3">
            Recipe Source
          </h3>
          <div className="space-y-2">
            {data.sourceBreakdown.map((s) => (
              <div key={s.source} className="flex items-center justify-between">
                <span className="text-sm text-stone-600 capitalize">
                  {s.source}
                </span>
                <span className="text-sm font-medium text-stone-800">
                  {s.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-stone-800 mb-3">
            Difficulty (Published)
          </h3>
          <div className="space-y-2">
            {data.difficultyBreakdown.map((d) => (
              <div key={d.difficulty} className="flex items-center justify-between">
                <span className="text-sm text-stone-600 capitalize">
                  {d.difficulty}
                </span>
                <span className="text-sm font-medium text-stone-800">
                  {d.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Categories */}
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-800 mb-4">
          Recipes per Category
        </h3>
        <BarChart items={data.categoryCounts} maxValue={maxCategory} />
      </section>

      {/* Dietary Tags */}
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-800 mb-4">
          Recipes per Dietary Tag
        </h3>
        <div className="space-y-2">
          {data.dietaryTagCounts.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="text-sm text-stone-600 w-28 truncate flex-shrink-0">
                {item.name}
              </span>
              <div className="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${dietaryColors[item.name] || "bg-stone-400"} rounded-full transition-all`}
                  style={{
                    width: `${maxDietary > 0 ? (item.count / maxDietary) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-stone-700 w-12 text-right flex-shrink-0">
                {item.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Top Rated */}
      {data.topRatedRecipes.length > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-stone-800 mb-3">
            Most Rated Recipes
          </h3>
          <div className="space-y-2">
            {data.topRatedRecipes.map((recipe, i) => (
              <div key={recipe.slug} className="flex items-center gap-3">
                <span className="text-sm font-bold text-amber-600 w-6">
                  {i + 1}.
                </span>
                <span className="text-sm text-stone-700 flex-1 truncate">
                  {recipe.title}
                </span>
                <span className="text-xs text-stone-500">
                  {recipe.ratingCount} rating{recipe.ratingCount !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* External Popularity Data */}
      {data.externalData && (
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-amber-600" />
            External Popularity Data
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <StatCard
              label="External Recipes"
              value={data.externalData.totalExternalRecipes.toLocaleString()}
              icon={Globe}
              color="blue"
            />
            <StatCard
              label="With Popularity Score"
              value={data.externalData.recipesWithPopularity.toLocaleString()}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              label="Last Scrape"
              value={
                data.externalData.latestScrapeRun
                  ? data.externalData.latestScrapeRun.status
                  : "Never"
              }
              icon={Clock}
              color={
                data.externalData.latestScrapeRun?.status === "completed"
                  ? "green"
                  : data.externalData.latestScrapeRun?.status === "running"
                    ? "amber"
                    : "stone"
              }
              subtitle={
                data.externalData.latestScrapeRun
                  ? `${data.externalData.latestScrapeRun.sourceSite} — ${data.externalData.latestScrapeRun.recipesFound} found`
                  : undefined
              }
            />
          </div>
          {data.externalData.bySource.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-stone-800 mb-3">
                External Recipes by Source
              </h3>
              <div className="space-y-2">
                {data.externalData.bySource.map((s) => (
                  <div
                    key={s.source}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-stone-600">{s.source}</span>
                    <span className="text-sm font-medium text-stone-800">
                      {s.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
