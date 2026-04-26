"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Pencil } from "lucide-react";

interface AdminEditButtonProps {
  recipeId: number;
}

export function AdminEditButton({ recipeId }: AdminEditButtonProps) {
  const { data: session } = useSession();

  if (!session?.user || session.user.role !== "admin") return null;

  return (
    <Link
      href={`/admin/recipes/${recipeId}/edit`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-orange-700 bg-neutral-100 hover:bg-orange-50 rounded-lg transition-colors no-print"
    >
      <Pencil className="h-4 w-4" />
      <span>Edit</span>
    </Link>
  );
}
