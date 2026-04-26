import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Ella's Pantry - how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold text-neutral-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: 6 March 2026</p>

      <div className="mt-8 space-y-8 text-neutral-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-neutral-900">1. Who We Are</h2>
          <p className="mt-2">
            Ella&apos;s Pantry (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the website{" "}
            <strong>www.ellaspantry.co.uk</strong>. We are a recipe discovery and meal
            planning platform based in the United Kingdom. This Privacy Policy explains
            how we collect, use, store, and protect your personal information when you
            use our website and services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">2. Information We Collect</h2>

          <h3 className="mt-4 font-semibold text-neutral-800">2.1 Information You Provide</h3>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>Account registration:</strong> name, email address, and password
              when you create an account.
            </li>
            <li>
              <strong>Profile information:</strong> optional bio and profile picture.
            </li>
            <li>
              <strong>User content:</strong> recipe ratings, reviews, saved recipes,
              meal plans, and recipe collections you create.
            </li>
            <li>
              <strong>Images:</strong> photos you upload when using our &quot;What&apos;s In My
              Fridge&quot; feature.
            </li>
          </ul>

          <h3 className="mt-4 font-semibold text-neutral-800">2.2 Information Collected Automatically</h3>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>Usage data:</strong> pages visited, recipes viewed, search
              queries, and interactions with the site, collected via Google Analytics.
            </li>
            <li>
              <strong>Device information:</strong> browser type, operating system, and
              screen resolution.
            </li>
            <li>
              <strong>Cookies and similar technologies:</strong> see Section 6 below.
            </li>
          </ul>

          <h3 className="mt-4 font-semibold text-neutral-800">2.3 Information from Third Parties</h3>
          <p className="mt-2">
            If you sign in using Google, we receive your name, email address, and
            profile picture from your Google account. We do not access any other Google
            account data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">3. How We Use Your Information</h2>
          <p className="mt-2">We use your personal information to:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Create and manage your account.</li>
            <li>Provide personalised features such as saved recipes, meal plans, and collections.</li>
            <li>Display your ratings, reviews, and profile information on the site.</li>
            <li>Process images you submit to our AI-powered features (e.g. &quot;What&apos;s In My Fridge&quot;).</li>
            <li>Analyse usage patterns to improve our website and services.</li>
            <li>Display relevant advertisements via Google AdSense.</li>
            <li>Ensure the security and integrity of our platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">4. Legal Basis for Processing (UK GDPR)</h2>
          <p className="mt-2">We process your personal data on the following legal bases:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>Contract:</strong> processing necessary to provide you with an
              account and our services.
            </li>
            <li>
              <strong>Legitimate interests:</strong> analysing usage to improve our
              website, preventing fraud, and ensuring security.
            </li>
            <li>
              <strong>Consent:</strong> where we rely on your consent (e.g. for
              analytics cookies), you may withdraw it at any time.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">5. Third-Party Services</h2>
          <p className="mt-2">We share data with the following third-party services:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>Google Analytics (GA4):</strong> collects anonymised usage data
              to help us understand how visitors use the site.
            </li>
            <li>
              <strong>Google AdSense:</strong> serves advertisements and may use
              cookies to personalise ads.
            </li>
            <li>
              <strong>Google OAuth:</strong> if you choose to sign in with Google, your
              authentication is handled by Google&apos;s identity services.
            </li>
            <li>
              <strong>Anthropic (Claude AI):</strong> powers our recipe generation,
              ingredient substitution, and &quot;What&apos;s In My Fridge&quot; features. Images
              and text you submit to these features are sent to Anthropic for
              processing. Please refer to{" "}
              <a
                href="https://www.anthropic.com/privacy"
                className="text-orange-600 hover:text-orange-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Anthropic&apos;s Privacy Policy
              </a>{" "}
              for details on how they handle data.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">6. Cookies</h2>
          <p className="mt-2">We use the following types of cookies:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>Essential cookies:</strong> required for authentication and
              session management. These cannot be disabled.
            </li>
            <li>
              <strong>Analytics cookies:</strong> Google Analytics cookies that help us
              understand how visitors interact with the site.
            </li>
            <li>
              <strong>Advertising cookies:</strong> set by Google AdSense to serve and
              measure advertisements.
            </li>
          </ul>
          <p className="mt-2">
            We also use your browser&apos;s local storage to remember your preferred
            unit system (metric or imperial).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">7. Data Retention</h2>
          <p className="mt-2">
            We retain your personal data for as long as your account is active. If you
            delete your account, all associated data (profile, reviews, ratings, saved
            recipes, meal plans, and collections) is permanently removed from our
            systems. Analytics data collected by Google is retained in accordance with
            Google&apos;s data retention policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">8. Your Rights</h2>
          <p className="mt-2">
            Under the UK GDPR, you have the following rights regarding your personal
            data:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>Access:</strong> request a copy of the personal data we hold
              about you.
            </li>
            <li>
              <strong>Rectification:</strong> request correction of inaccurate data.
              You can update your profile information in your account settings.
            </li>
            <li>
              <strong>Erasure:</strong> request deletion of your data. You can delete
              your account at any time from your profile settings.
            </li>
            <li>
              <strong>Restriction:</strong> request that we limit how we process your
              data.
            </li>
            <li>
              <strong>Portability:</strong> request a copy of your data in a portable
              format.
            </li>
            <li>
              <strong>Objection:</strong> object to processing based on legitimate
              interests.
            </li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, please contact us at the address provided
            in Section 11.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">9. Data Security</h2>
          <p className="mt-2">
            We take reasonable measures to protect your personal information. Passwords
            are hashed using industry-standard algorithms and are never stored in plain
            text. All data is transmitted over HTTPS. However, no method of
            transmission over the internet is 100% secure, and we cannot guarantee
            absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">10. Children&apos;s Privacy</h2>
          <p className="mt-2">
            Our services are not directed at children under the age of 13. We do not
            knowingly collect personal information from children under 13. If we become
            aware that we have collected data from a child under 13, we will delete it
            promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">11. Contact Us</h2>
          <p className="mt-2">
            If you have any questions about this Privacy Policy or wish to exercise
            your data protection rights, please contact us at:{" "}
            <a
              href="mailto:privacy@ellaspantry.co.uk"
              className="text-orange-600 hover:text-orange-700 underline"
            >
              privacy@ellaspantry.co.uk
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">12. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. Any changes will be
            posted on this page with an updated &quot;Last updated&quot; date. We encourage you
            to review this page periodically.
          </p>
        </section>
      </div>
    </div>
  );
}
