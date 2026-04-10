"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Link2, X } from "lucide-react";

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

interface SharedUser {
  id: string;
  email: string;
  name: string | null;
}

export interface UserRecipeEditData {
  id: number;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  visibility: "public" | "private" | "shared";
  shareToken: string | null;
  ingredients: IngredientInput[];
  steps: StepInput[];
  sharedUsers: SharedUser[];
}

export function UserRecipeEditForm({ initialData }: { initialData: UserRecipeEditData }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [prepTime, setPrepTime] = useState(String(initialData.prepTime));
  const [cookTime, setCookTime] = useState(String(initialData.cookTime));
  const [servings, setServings] = useState(String(initialData.servings));
  const [difficulty, setDifficulty] = useState(initialData.difficulty);
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
  const [shareToken, setShareToken] = useState(initialData.shareToken);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>(initialData.sharedUsers);
  const [shareEmail, setShareEmail] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const addIngredient = () =>
    setIngredients([...ingredients, { name: "", quantity: "", unit: "", notes: "" }]);
  const removeIngredient = (i: number) =>
    setIngredients(ingredients.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, patch: Partial<IngredientInput>) =>
    setIngredients(ingredients.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing)));

  const addStep = () => setSteps([...steps, { instruction: "", tipText: "" }]);
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));
  const updateStep = (i: number, patch: Partial<StepInput>) =>
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const handleSave = useCallback(async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/user-recipes/${initialData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          prepTime: parseInt(prepTime, 10),
          cookTime: parseInt(cookTime, 10),
          servings: parseInt(servings, 10),
          difficulty,
          ingredients: ingredients.filter((i) => i.name.trim()),
          steps: steps.filter((s) => s.instruction.trim()),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      router.push("/my-recipes");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSubmitting(false);
    }
  }, [
    initialData.id,
    title,
    description,
    prepTime,
    cookTime,
    servings,
    difficulty,
    ingredients,
    steps,
    router,
  ]);

  const enableShareLink = useCallback(async () => {
    setShareError(null);
    const res = await fetch(`/api/user-recipes/${initialData.id}/share-link`, {
      method: "POST",
    });
    if (!res.ok) {
      setShareError("Could not enable share link");
      return;
    }
    const data: { shareToken: string } = await res.json();
    setShareToken(data.shareToken);
  }, [initialData.id]);

  const disableShareLink = useCallback(async () => {
    setShareError(null);
    const res = await fetch(`/api/user-recipes/${initialData.id}/share-link`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setShareError("Could not disable share link");
      return;
    }
    setShareToken(null);
  }, [initialData.id]);

  const addShareUser = useCallback(async () => {
    setShareError(null);
    if (!shareEmail.trim()) return;
    const res = await fetch(`/api/user-recipes/${initialData.id}/share-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: shareEmail.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      setShareError(data.error || "Could not share with that user");
      return;
    }
    const data: { sharedWith: SharedUser } = await res.json();
    if (!sharedUsers.some((u) => u.id === data.sharedWith.id)) {
      setSharedUsers([...sharedUsers, data.sharedWith]);
    }
    setShareEmail("");
  }, [initialData.id, shareEmail, sharedUsers]);

  const removeShareUser = useCallback(
    async (userId: string) => {
      const res = await fetch(`/api/user-recipes/${initialData.id}/share-user/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setShareError("Could not remove share");
        return;
      }
      setSharedUsers(sharedUsers.filter((u) => u.id !== userId));
    },
    [initialData.id, sharedUsers]
  );

  const shareLinkUrl =
    typeof window !== "undefined" && shareToken
      ? `${window.location.origin}/r/share/${shareToken}`
      : shareToken
        ? `/r/share/${shareToken}`
        : null;

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`rounded-lg p-4 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Basics */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-stone-800">Basics</h2>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Prep (min)</label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Cook (min)</label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Servings</label>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800">Ingredients</h2>
          <button
            type="button"
            onClick={addIngredient}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 rounded-md"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        {ingredients.map((ing, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start">
            <input
              type="text"
              placeholder="qty"
              value={ing.quantity}
              onChange={(e) => updateIngredient(i, { quantity: e.target.value })}
              className="col-span-2 rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="unit"
              value={ing.unit}
              onChange={(e) => updateIngredient(i, { unit: e.target.value })}
              className="col-span-2 rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="ingredient"
              value={ing.name}
              onChange={(e) => updateIngredient(i, { name: e.target.value })}
              className="col-span-4 rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="notes (e.g. diced)"
              value={ing.notes}
              onChange={(e) => updateIngredient(i, { notes: e.target.value })}
              className="col-span-3 rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeIngredient(i)}
              className="col-span-1 p-1.5 text-stone-400 hover:text-red-600"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800">Method</h2>
          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 rounded-md"
          >
            <Plus className="h-4 w-4" />
            Add step
          </button>
        </div>
        {steps.map((step, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="mt-2 text-sm font-medium text-stone-500 w-6 text-right">
              {i + 1}.
            </span>
            <div className="flex-1 space-y-1.5">
              <textarea
                placeholder="Step instruction"
                value={step.instruction}
                onChange={(e) => updateStep(i, { instruction: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Optional tip"
                value={step.tipText}
                onChange={(e) => updateStep(i, { tipText: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => removeStep(i)}
              className="mt-2 p-1.5 text-stone-400 hover:text-red-600"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Sharing */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-stone-800">Sharing</h2>
        <p className="text-sm text-stone-500">
          Your recipes are private by default. They will never appear in the
          public catalogue. You can share with specific people or generate a
          private link.
        </p>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-stone-800">Share link</h3>
              <p className="text-xs text-stone-500">
                Anyone with the link can view this recipe.
              </p>
            </div>
            {shareToken ? (
              <button
                type="button"
                onClick={disableShareLink}
                className="px-3 py-1.5 text-sm text-stone-600 border border-stone-300 rounded-md hover:bg-stone-50"
              >
                Disable
              </button>
            ) : (
              <button
                type="button"
                onClick={enableShareLink}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-amber-700 border border-amber-300 rounded-md hover:bg-amber-50"
              >
                <Link2 className="h-4 w-4" />
                Enable
              </button>
            )}
          </div>
          {shareLinkUrl && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                readOnly
                value={shareLinkUrl}
                className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs bg-stone-50 font-mono"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(shareLinkUrl)}
                className="px-3 py-1.5 text-sm text-amber-700 border border-amber-300 rounded-md hover:bg-amber-50"
              >
                Copy
              </button>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-stone-800 mb-2">Share with specific people</h3>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="email address"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={addShareUser}
              className="px-3 py-1.5 text-sm text-amber-700 border border-amber-300 rounded-md hover:bg-amber-50"
            >
              Share
            </button>
          </div>
          {shareError && <p className="mt-2 text-xs text-red-600">{shareError}</p>}
          {sharedUsers.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {sharedUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between text-sm text-stone-700 bg-stone-50 px-3 py-1.5 rounded-md"
                >
                  <span>
                    {u.name ? `${u.name} (${u.email})` : u.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeShareUser(u.id)}
                    className="text-stone-400 hover:text-red-600"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </button>
      </div>
    </div>
  );
}
