"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ChangeEmailForm } from "./ChangeEmailForm";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { LinkedAccountsSection } from "./LinkedAccountsSection";
import { AllergySettingsForm } from "./AllergySettingsForm";
import { SkillLevelSettingsForm } from "./SkillLevelSettingsForm";
import type { SkillLevel } from "@/lib/skill-level";

type SettingsTab = "security" | "accounts" | "dietary" | "cooking";

interface ProfileSettingsLayoutProps {
  currentEmail: string;
  hasPassword: boolean;
  accounts: { provider: string }[];
  initialAllergies: string[];
  initialSkillLevel: SkillLevel;
}

export function ProfileSettingsLayout({
  currentEmail,
  hasPassword,
  accounts,
  initialAllergies,
  initialSkillLevel,
}: ProfileSettingsLayoutProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam && ["security", "accounts", "dietary", "cooking"].includes(tabParam)
      ? (tabParam as SettingsTab)
      : "security";
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    if (tabParam && ["security", "accounts", "dietary", "cooking"].includes(tabParam)) {
      setActiveTab(tabParam as SettingsTab);
    }
  }, [tabParam]);

  const tabClass = (tab: SettingsTab) =>
    `px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
      activeTab === tab
        ? "bg-white text-orange-700 border border-neutral-200 border-b-white -mb-px"
        : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
    }`;

  return (
    <div className="mt-8">
      <div className="flex gap-1 border-b border-neutral-200">
        <button onClick={() => setActiveTab("security")} className={tabClass("security")}>
          Security
        </button>
        <button onClick={() => setActiveTab("dietary")} className={tabClass("dietary")}>
          Dietary
        </button>
        <button onClick={() => setActiveTab("cooking")} className={tabClass("cooking")}>
          Cooking
        </button>
        <button onClick={() => setActiveTab("accounts")} className={tabClass("accounts")}>
          Accounts
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "security" && (
          <div className="space-y-8">
            <ChangeEmailForm currentEmail={currentEmail} hasPassword={hasPassword} />
            <ChangePasswordForm hasPassword={hasPassword} />
            <DeleteAccountSection hasPassword={hasPassword} />
          </div>
        )}

        {activeTab === "dietary" && (
          <AllergySettingsForm initialAllergies={initialAllergies} />
        )}

        {activeTab === "cooking" && (
          <SkillLevelSettingsForm initialSkillLevel={initialSkillLevel} />
        )}

        {activeTab === "accounts" && (
          <LinkedAccountsSection accounts={accounts} hasPassword={hasPassword} />
        )}
      </div>
    </div>
  );
}
