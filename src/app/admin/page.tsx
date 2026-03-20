"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Dashboard } from "./Dashboard";
import { ManualRecipeForm } from "./ManualRecipeForm";
import { AIGenerator } from "./AIGenerator";
import { RecipeList } from "./RecipeList";
import { Duplicates } from "./Duplicates";
import { NutritionBackfill } from "./NutritionBackfill";
import { IntroductionBackfill } from "./IntroductionBackfill";
import { SiteSettings } from "./SiteSettings";
import { UserManagement } from "./UserManagement";
import { OccasionManagement } from "./OccasionManagement";

type Tab = "dashboard" | "recipes" | "generate" | "manual" | "duplicates" | "nutrition" | "introductions" | "occasions" | "users" | "settings";

const VALID_TABS: Tab[] = ["dashboard", "recipes", "generate", "manual", "duplicates", "nutrition", "introductions", "occasions", "users", "settings"];

export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = VALID_TABS.includes(searchParams.get("tab") as Tab)
    ? (searchParams.get("tab") as Tab)
    : "dashboard";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "dashboard") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.replace(`/admin${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, router]);

  const tabClass = (tab: Tab) =>
    `px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
      activeTab === tab
        ? "bg-white text-amber-700 border border-stone-200 border-b-white -mb-px"
        : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-stone-900">Recipe Admin</h1>
      <p className="mt-2 text-stone-500">
        Generate recipes with AI or add them manually.
      </p>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-stone-200 overflow-x-auto">
        <button
          onClick={() => handleTabChange("dashboard")}
          className={tabClass("dashboard")}
        >
          Dashboard
        </button>
        <button
          onClick={() => handleTabChange("recipes")}
          className={tabClass("recipes")}
        >
          Recipes
        </button>
        <button
          onClick={() => handleTabChange("generate")}
          className={tabClass("generate")}
        >
          AI Generator
        </button>
        <button
          onClick={() => handleTabChange("manual")}
          className={tabClass("manual")}
        >
          Manual Entry
        </button>
        <button
          onClick={() => handleTabChange("duplicates")}
          className={tabClass("duplicates")}
        >
          Duplicates
        </button>
        <button
          onClick={() => handleTabChange("nutrition")}
          className={tabClass("nutrition")}
        >
          Nutrition
        </button>
        <button
          onClick={() => handleTabChange("introductions")}
          className={tabClass("introductions")}
        >
          Intros
        </button>
        <button
          onClick={() => handleTabChange("occasions")}
          className={tabClass("occasions")}
        >
          Occasions
        </button>
        <button
          onClick={() => handleTabChange("users")}
          className={tabClass("users")}
        >
          Users
        </button>
        <button
          onClick={() => handleTabChange("settings")}
          className={tabClass("settings")}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "recipes" && <RecipeList />}
        {activeTab === "generate" && <AIGenerator />}
        {activeTab === "manual" && <ManualRecipeForm />}
        {activeTab === "duplicates" && <Duplicates />}
        {activeTab === "nutrition" && <NutritionBackfill />}
        {activeTab === "introductions" && <IntroductionBackfill />}
        {activeTab === "occasions" && <OccasionManagement />}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "settings" && <SiteSettings />}
      </div>
    </div>
  );
}
