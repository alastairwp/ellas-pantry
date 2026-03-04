"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface IngredientInput {
  name: string;
  quantity: string;
  unit: string;
  notes: string;
}

interface StepInput {
  instruction: string;
  tipText: string;
}

interface Option {
  id: number;
  name: string;
}

export function ManualRecipeForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("4");
  const [difficulty, setDifficulty] = useState("Medium");
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { name: "", quantity: "", unit: "", notes: "" },
  ]);
  const [steps, setSteps] = useState<StepInput[]>([
    { instruction: "", tipText: "" },
  ]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<number[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [dietaryTags, setDietaryTags] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/options")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setDietaryTags(data.dietaryTags || []);
      })
      .catch(console.error);
  }, []);

  const inputClass =
    "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          heroImage,
          prepTime,
          cookTime,
          servings,
          difficulty,
          ingredients: ingredients.filter((i) => i.name.trim()),
          steps: steps.filter((s) => s.instruction.trim()),
          categoryIds: selectedCategories,
          dietaryTagIds: selectedDietaryTags,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create recipe");
      }

      const recipe = await res.json();
      setMessage({
        type: "success",
        text: `Recipe "${recipe.title}" created successfully!`,
      });

      setTitle("");
      setDescription("");
      setHeroImage("");
      setPrepTime("");
      setCookTime("");
      setServings("4");
      setDifficulty("Medium");
      setIngredients([{ name: "", quantity: "", unit: "", notes: "" }]);
      setSteps([{ instruction: "", tipText: "" }]);
      setSelectedCategories([]);
      setSelectedDietaryTags([]);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-800 border-b border-stone-200 pb-2">
            Basic Information
          </h2>
          <div>
            <label htmlFor="title" className={labelClass}>Title *</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>Description *</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} required />
          </div>
          <div>
            <label htmlFor="heroImage" className={labelClass}>Hero Image URL *</label>
            <input id="heroImage" type="url" value={heroImage} onChange={(e) => setHeroImage(e.target.value)} className={inputClass} placeholder="https://..." required />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="prepTime" className={labelClass}>Prep (mins)</label>
              <input id="prepTime" type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className={inputClass} min="0" />
            </div>
            <div>
              <label htmlFor="cookTime" className={labelClass}>Cook (mins)</label>
              <input id="cookTime" type="number" value={cookTime} onChange={(e) => setCookTime(e.target.value)} className={inputClass} min="0" />
            </div>
            <div>
              <label htmlFor="servings" className={labelClass}>Servings</label>
              <input id="servings" type="number" value={servings} onChange={(e) => setServings(e.target.value)} className={inputClass} min="1" />
            </div>
            <div>
              <label htmlFor="difficulty" className={labelClass}>Difficulty</label>
              <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputClass}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-800 border-b border-stone-200 pb-2">Categories & Dietary Tags</h2>
          <div>
            <label className={labelClass}>Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button key={cat.id} type="button" onClick={() => setSelectedCategories((prev) => prev.includes(cat.id) ? prev.filter((c) => c !== cat.id) : [...prev, cat.id])}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${selectedCategories.includes(cat.id) ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Dietary Tags</label>
            <div className="flex flex-wrap gap-2">
              {dietaryTags.map((tag) => (
                <button key={tag.id} type="button" onClick={() => setSelectedDietaryTags((prev) => prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id])}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${selectedDietaryTags.includes(tag.id) ? "bg-green-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h2 className="text-lg font-semibold text-stone-800">Ingredients</h2>
            <button type="button" onClick={() => setIngredients([...ingredients, { name: "", quantity: "", unit: "", notes: "" }])}
              className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-200 transition-colors">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <div className="space-y-3">
            {ingredients.map((ing, index) => (
              <div key={index} className="flex items-start gap-2">
                <GripVertical className="mt-2.5 h-4 w-4 flex-shrink-0 text-stone-300" />
                <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                  <input type="text" placeholder="Quantity" value={ing.quantity} onChange={(e) => { const u = [...ingredients]; u[index].quantity = e.target.value; setIngredients(u); }} className={inputClass} />
                  <input type="text" placeholder="Unit" value={ing.unit} onChange={(e) => { const u = [...ingredients]; u[index].unit = e.target.value; setIngredients(u); }} className={inputClass} />
                  <input type="text" placeholder="Ingredient *" value={ing.name} onChange={(e) => { const u = [...ingredients]; u[index].name = e.target.value; setIngredients(u); }} className={inputClass} />
                  <input type="text" placeholder="Notes" value={ing.notes} onChange={(e) => { const u = [...ingredients]; u[index].notes = e.target.value; setIngredients(u); }} className={inputClass} />
                </div>
                <button type="button" onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))} className="mt-2 text-stone-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h2 className="text-lg font-semibold text-stone-800">Cooking Steps</h2>
            <button type="button" onClick={() => setSteps([...steps, { instruction: "", tipText: "" }])}
              className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-200 transition-colors">
              <Plus className="h-4 w-4" /> Add Step
            </button>
          </div>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="mt-2.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">{index + 1}</span>
                <div className="flex-1 space-y-2">
                  <textarea placeholder={`Step ${index + 1} instruction *`} value={step.instruction} onChange={(e) => { const u = [...steps]; u[index].instruction = e.target.value; setSteps(u); }} rows={2} className={inputClass} />
                  <input type="text" placeholder="Tip (optional)" value={step.tipText} onChange={(e) => { const u = [...steps]; u[index].tipText = e.target.value; setSteps(u); }} className={inputClass} />
                </div>
                <button type="button" onClick={() => setSteps(steps.filter((_, i) => i !== index))} className="mt-2 text-stone-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-end gap-4 border-t border-stone-200 pt-6">
          <button type="submit" disabled={submitting}
            className="rounded-full bg-amber-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {submitting ? "Creating..." : "Create Recipe"}
          </button>
        </div>
      </form>
    </>
  );
}
