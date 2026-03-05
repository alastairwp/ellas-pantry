"use client";

import { useState } from "react";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { AvatarUploadForm } from "./AvatarUploadForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ChangeEmailForm } from "./ChangeEmailForm";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { LinkedAccountsSection } from "./LinkedAccountsSection";

type SettingsTab = "profile" | "security" | "accounts";

interface ProfileSettingsLayoutProps {
  initialName: string;
  initialBio: string;
  currentEmail: string;
  currentImage: string | null;
  hasPassword: boolean;
  accounts: { provider: string }[];
}

export function ProfileSettingsLayout({
  initialName,
  initialBio,
  currentEmail,
  currentImage,
  hasPassword,
  accounts,
}: ProfileSettingsLayoutProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const tabClass = (tab: SettingsTab) =>
    `px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
      activeTab === tab
        ? "bg-white text-amber-700 border border-stone-200 border-b-white -mb-px"
        : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
    }`;

  return (
    <div className="mt-8">
      <div className="flex gap-1 border-b border-stone-200">
        <button onClick={() => setActiveTab("profile")} className={tabClass("profile")}>
          Profile
        </button>
        <button onClick={() => setActiveTab("security")} className={tabClass("security")}>
          Security
        </button>
        <button onClick={() => setActiveTab("accounts")} className={tabClass("accounts")}>
          Accounts
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "profile" && (
          <div className="space-y-8">
            <AvatarUploadForm currentImage={currentImage} userName={initialName} />
            <ProfileSettingsForm initialName={initialName} initialBio={initialBio} />
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-8">
            <ChangeEmailForm currentEmail={currentEmail} hasPassword={hasPassword} />
            <ChangePasswordForm hasPassword={hasPassword} />
            <DeleteAccountSection hasPassword={hasPassword} />
          </div>
        )}

        {activeTab === "accounts" && (
          <LinkedAccountsSection accounts={accounts} hasPassword={hasPassword} />
        )}
      </div>
    </div>
  );
}
