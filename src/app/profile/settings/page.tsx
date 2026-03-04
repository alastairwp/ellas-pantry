import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileSettingsForm } from "./ProfileSettingsForm";

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
    select: { name: true, bio: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-stone-900">Profile Settings</h1>
      <p className="mt-2 text-stone-500">Update your public profile information.</p>

      <div className="mt-8">
        <ProfileSettingsForm
          initialName={user?.name || ""}
          initialBio={user?.bio || ""}
        />
      </div>
    </div>
  );
}
