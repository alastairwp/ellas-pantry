"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface SavedRecipesContextType {
  savedIds: Set<number>;
  refresh: () => void;
}

const SavedRecipesContext = createContext<SavedRecipesContextType>({
  savedIds: new Set(),
  refresh: () => {},
});

export function useSavedRecipes() {
  return useContext(SavedRecipesContext);
}

export function SavedRecipesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setSavedIds(new Set());
      return;
    }
    try {
      const res = await fetch("/api/saved-recipes");
      const data = await res.json();
      setSavedIds(new Set(data.ids));
    } catch {
      // Non-critical
    }
  }, [session?.user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SavedRecipesContext.Provider value={{ savedIds, refresh }}>
      {children}
    </SavedRecipesContext.Provider>
  );
}
