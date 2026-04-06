"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical, ImageIcon, Upload, Loader2, Sparkles } from "lucide-react";

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

interface RecipeEditData {
  id: number;
  slug: string;
  title: string;
  description: string;
  heroImage: string;
  imageStatus: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  published: boolean;
  ingredients: IngredientInput[];
  steps: StepInput[];
  categoryIds: number[];
  dietaryTagIds: number[];
  occasionIds: number[];
}

interface RecipeEditFormProps {
  initialData: RecipeEditData;
}

export function RecipeEditForm({ initialData }: RecipeEditFormProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialData.slug);
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [heroImage, setHeroImage] = useState(initialData.heroImage);
  const [prepTime, setPrepTime] = useState(String(initialData.prepTime));
  const [cookTime, setCookTime] = useState(String(initialData.cookTime));
  const [servings, setServings] = useState(String(initialData.servings));
  const [difficulty, setDifficulty] = useState(initialData.difficulty);
  const [published, setPublished] = useState(initialData.published);
  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    initialData.ingredients.length > 0
      ? initialData.ingredients
      : [{ name: "", quantity: "", unit: "", notes: "" }]
  );
  const [steps, setSteps] = useState<StepInput[]>(
    initialData.steps.length > 0
      ? initialData.steps
      : [{ instruction: "", tipText: "" }]
  );
  const [selectedCategories, setSelectedCategories] = useState<number[]>(initialData.categoryIds);
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<number[]>(initialData.dietaryTagIds);
  const [selectedOccasions, setSelectedOccasions] = useState<number[]>(initialData.occasionIds);
  const [categories, setCategories] = useState<Option[]>([]);
  const [dietaryTags, setDietaryTags] = useState<Option[]>([]);
  const [occasions, setOccasions] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [imageStatus, setImageStatus] = useState(initialData.imageStatus);
  const [queuingImage, setQueuingImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [imageCacheBuster, setImageCacheBuster] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        setOccasions(data.occasions || []);
      })
      .catch(console.error);
  }, []);

  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", initialData.slug);
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      const { path } = await res.json();
      setHeroImage(path);
      setImageCacheBuster(`?t=${Date.now()}`);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Image upload failed",
      });
    } finally {
      setUploading(false);
    }
  }, [initialData.slug]);

  const queueImageGeneration = useCallback(async () => {
    setQueuingImage(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/recipes/${initialData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageStatus: "pending" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to queue image");
      }
      setImageStatus("pending");
      setMessage({ type: "success", text: "Image generation queued" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to queue image",
      });
    } finally {
      setQueuingImage(false);
    }
  }, [initialData.id]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadImage(file);
  }, [uploadImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const inputClass =
    "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/recipes/${initialData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          heroImage,
          prepTime,
          cookTime,
          servings,
          difficulty,
          published,
          ingredients: ingredients.filter((i) => i.name.trim()),
          steps: steps.filter((s) => s.instruction.trim()),
          categoryIds: selectedCategories,
          dietaryTagIds: selectedDietaryTags,
          occasionIds: selectedOccasions,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update recipe");
      }

      setMessage({ type: "success", text: "Recipe updated successfully!" });
      setTimeout(() => {
        router.push(`/recipes/${slug}`);
      }, 1000);
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
            <label htmlFor="slug" className={labelClass}>Slug</label>
            <input id="slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, ""))} className={inputClass} required />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>Description *</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Hero Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.target.value = "";
              }}
            />
            {heroImage ? (
              <div className="relative mb-3 rounded-lg border border-stone-200 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${heroImage}${imageCacheBuster}`}
                  alt="Current hero image"
                  className="max-w-full max-h-96 rounded-lg"
                />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-white/90 p-1.5 text-stone-600 hover:bg-amber-50 hover:text-amber-700 shadow-sm transition-colors"
                    title="Replace image"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroImage("")}
                    className="rounded-full bg-white/90 p-1.5 text-stone-600 hover:bg-red-50 hover:text-red-600 shadow-sm transition-colors"
                    title="Remove image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={queueImageGeneration}
                    disabled={queuingImage || imageStatus === "pending"}
                    className="rounded-full bg-white/90 p-1.5 text-stone-600 hover:bg-purple-50 hover:text-purple-700 shadow-sm transition-colors disabled:opacity-50"
                    title={imageStatus === "pending" ? "Image generation already queued" : "Queue AI image generation"}
                  >
                    {queuingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`mb-3 flex h-48 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                  dragging
                    ? "border-amber-500 bg-amber-50"
                    : "border-stone-300 bg-stone-50 hover:border-amber-400 hover:bg-amber-50/50"
                }`}
              >
                {uploading ? (
                  <div className="text-center text-amber-600">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin mb-1" />
                    <p className="text-sm font-medium">Uploading...</p>
                  </div>
                ) : (
                  <div className="text-center text-stone-400">
                    <ImageIcon className="mx-auto h-8 w-8 mb-1" />
                    <p className="text-sm font-medium">Drop an image here or click to browse</p>
                    <p className="text-xs mt-1">PNG, JPG, WebP up to 10MB</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <input
                id="heroImage"
                type="text"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="Or enter an image URL"
              />
              <button
                type="button"
                onClick={queueImageGeneration}
                disabled={queuingImage || imageStatus === "pending"}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                title={imageStatus === "pending" ? "Image generation already queued" : "Queue AI image generation"}
              >
                {queuingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {imageStatus === "pending" ? "Queued" : "Generate"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
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
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500" />
                <span className="text-sm font-medium text-stone-700">Published</span>
              </label>
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
          {occasions.length > 0 && (
            <div>
              <label className={labelClass}>Occasions</label>
              <div className="flex flex-wrap gap-2">
                {occasions.map((occ) => (
                  <button key={occ.id} type="button" onClick={() => setSelectedOccasions((prev) => prev.includes(occ.id) ? prev.filter((o) => o !== occ.id) : [...prev, occ.id])}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${selectedOccasions.includes(occ.id) ? "bg-purple-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                    {occ.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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

        <div className="flex items-center justify-between gap-4 border-t border-stone-200 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full bg-stone-100 px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-200 transition-colors"
          >
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="rounded-full bg-amber-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </>
  );
}
