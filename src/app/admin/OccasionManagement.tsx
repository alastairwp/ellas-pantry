"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, Pencil, X, Check, Calendar } from "lucide-react";

interface Occasion {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  _count: { recipes: number };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isActive(startMonth: number, startDay: number, endMonth: number, endDay: number): boolean {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const current = currentMonth * 100 + currentDay;
  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;

  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

function formatDate(month: number, day: number): string {
  return `${day} ${MONTHS[month - 1]?.slice(0, 3)}`;
}

export function OccasionManagement() {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStartMonth, setFormStartMonth] = useState(1);
  const [formStartDay, setFormStartDay] = useState(1);
  const [formEndMonth, setFormEndMonth] = useState(12);
  const [formEndDay, setFormEndDay] = useState(31);
  const [saving, setSaving] = useState(false);

  const fetchOccasions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/occasions");
      const data = await res.json();
      setOccasions(data.occasions);
    } catch (err) {
      console.error("Failed to fetch occasions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOccasions();
  }, [fetchOccasions]);

  // Clamp day when month changes
  useEffect(() => {
    const max = DAYS_IN_MONTH[formStartMonth - 1];
    if (formStartDay > max) setFormStartDay(max);
  }, [formStartMonth, formStartDay]);

  useEffect(() => {
    const max = DAYS_IN_MONTH[formEndMonth - 1];
    if (formEndDay > max) setFormEndDay(max);
  }, [formEndMonth, formEndDay]);

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormStartMonth(1);
    setFormStartDay(1);
    setFormEndMonth(12);
    setFormEndDay(31);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(occ: Occasion) {
    setFormName(occ.name);
    setFormDescription(occ.description || "");
    setFormStartMonth(occ.startMonth);
    setFormStartDay(occ.startDay);
    setFormEndMonth(occ.endMonth);
    setFormEndDay(occ.endDay);
    setEditingId(occ.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name: formName.trim(),
        description: formDescription.trim(),
        startMonth: formStartMonth,
        startDay: formStartDay,
        endMonth: formEndMonth,
        endDay: formEndDay,
      };
      await fetch("/api/admin/occasions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      resetForm();
      fetchOccasions();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This will unlink all associated recipes.`)) return;
    try {
      await fetch("/api/admin/occasions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchOccasions();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  function dayOptions(month: number) {
    const max = DAYS_IN_MONTH[month - 1];
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-800">Seasonal Occasions</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Manage seasonal occasions that appear in the &quot;This Season&quot; menu. Occasions are active when today&apos;s date falls within their date range.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Occasion
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
          <h3 className="text-sm font-semibold text-neutral-700 mb-4">
            {editingId ? "Edit Occasion" : "New Occasion"}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Easter, BBQ Season, Christmas"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="A short description of this occasion"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Start Date
              </label>
              <div className="flex gap-2">
                <select
                  value={formStartDay}
                  onChange={(e) => setFormStartDay(Number(e.target.value))}
                  className="w-20 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  {dayOptions(formStartMonth).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={formStartMonth}
                  onChange={(e) => setFormStartMonth(Number(e.target.value))}
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                End Date
              </label>
              <div className="flex gap-2">
                <select
                  value={formEndDay}
                  onChange={(e) => setFormEndDay(Number(e.target.value))}
                  className="w-20 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  {dayOptions(formEndMonth).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={formEndMonth}
                  onChange={(e) => setFormEndMonth(Number(e.target.value))}
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !formName.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" /> {editingId ? "Update" : "Create"}
            </button>
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-300 transition-colors"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Occasions List */}
      {loading ? (
        <div className="py-12 text-center text-neutral-400">Loading...</div>
      ) : occasions.length === 0 ? (
        <div className="py-12 text-center text-neutral-400">
          No occasions yet. Add one to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Occasion</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Date Range</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 hidden sm:table-cell">Recipes</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {occasions.map((occ) => (
                <tr key={occ.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-neutral-800">{occ.name}</span>
                      {occ.description && (
                        <p className="text-xs text-neutral-400 mt-0.5">{occ.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {formatDate(occ.startMonth, occ.startDay)} &ndash; {formatDate(occ.endMonth, occ.endDay)}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {isActive(occ.startMonth, occ.startDay, occ.endMonth, occ.endDay) ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 hidden sm:table-cell">
                    {occ._count.recipes}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => startEdit(occ)}
                        className="rounded-md bg-neutral-50 p-1.5 text-neutral-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        title="Edit occasion"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(occ.id, occ.name)}
                        className="rounded-md bg-neutral-50 p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete occasion"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
