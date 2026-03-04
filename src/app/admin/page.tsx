"use client";

import { useState } from "react";
import { ManualRecipeForm } from "./ManualRecipeForm";
import { AIGenerator } from "./AIGenerator";
import { RecipeList } from "./RecipeList";
import { Duplicates } from "./Duplicates";
import { NutritionBackfill } from "./NutritionBackfill";

type Tab = "recipes" | "generate" | "manual" | "duplicates" | "nutrition";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("recipes");

  const tabClass = (tab: Tab) =>
    `px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
      activeTab === tab
        ? "bg-white text-amber-700 border border-stone-200 border-b-white -mb-px"
        : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
    }`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-stone-900">Recipe Admin</h1>
      <p className="mt-2 text-stone-500">
        Generate recipes with AI or add them manually.
      </p>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-stone-200">
        <button
          onClick={() => setActiveTab("recipes")}
          className={tabClass("recipes")}
        >
          Recipes
        </button>
        <button
          onClick={() => setActiveTab("generate")}
          className={tabClass("generate")}
        >
          AI Generator
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={tabClass("manual")}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setActiveTab("duplicates")}
          className={tabClass("duplicates")}
        >
          Duplicates
        </button>
        <button
          onClick={() => setActiveTab("nutrition")}
          className={tabClass("nutrition")}
        >
          Nutrition
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "recipes" && <RecipeList />}
        {activeTab === "generate" && <AIGenerator />}
        {activeTab === "manual" && <ManualRecipeForm />}
        {activeTab === "duplicates" && <Duplicates />}
        {activeTab === "nutrition" && <NutritionBackfill />}
      </div>
    </div>
  );
}
