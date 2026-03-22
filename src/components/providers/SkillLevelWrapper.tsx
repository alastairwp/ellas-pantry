"use client";

import { useSession } from "next-auth/react";
import { SkillLevelProvider } from "@/lib/skill-level";
import type { ReactNode } from "react";

export function SkillLevelWrapper({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <SkillLevelProvider isLoggedIn={isLoggedIn}>
      {children}
    </SkillLevelProvider>
  );
}
