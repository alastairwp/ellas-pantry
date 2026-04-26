import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileSettingsLayout } from "./ProfileSettingsLayout";

export const metadata: Metadata = {
  title: "Profile Settings",
};

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      passwordHash: true,
      allergies: true,
      skillLevel: true,
      accounts: {
        select: { provider: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-neutral-900">Profile Settings</h1>
      <p className="mt-2 text-neutral-500">Manage your account settings.</p>

      <ProfileSettingsLayout
        currentEmail={user?.email || ""}
        hasPassword={!!user?.passwordHash}
        accounts={user?.accounts || []}
        initialAllergies={user?.allergies || []}
        initialSkillLevel={(user?.skillLevel as "beginner" | "intermediate" | "advanced") || "intermediate"}
      />
    </div>
  );
}
