import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and Conditions for using Ella's Pantry website and services.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold text-neutral-900">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: 6 March 2026</p>

      <div className="mt-8 space-y-8 text-neutral-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-neutral-900">1. Introduction</h2>
          <p className="mt-2">
            Welcome to Ella&apos;s Pantry. These Terms &amp; Conditions (&quot;Terms&quot;) govern
            your use of the website <strong>www.ellaspantry.co.uk</strong> (&quot;the
            Site&quot;) and the services we provide. By accessing or using the Site, you
            agree to be bound by these Terms. If you do not agree, please do not use
            the Site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">2. About Our Services</h2>
          <p className="mt-2">
            Ella&apos;s Pantry is a recipe discovery and meal planning platform that
            allows users to:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Browse and search recipes with detailed instructions and ingredient lists.</li>
            <li>Create an account to save recipes, rate and review recipes, and build collections.</li>
            <li>Plan meals and generate shopping lists.</li>
            <li>Use AI-powered features including recipe generation, ingredient substitution suggestions, and the &quot;What&apos;s In My Fridge&quot; image scanner.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">3. Account Registration</h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              You may register for an account using your email address and a password,
              or by signing in with Google.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your account
              credentials and for all activity that occurs under your account.
            </li>
            <li>
              You must provide accurate and complete information when creating your
              account and keep it up to date.
            </li>
            <li>
              You must be at least 13 years old to create an account.
            </li>
            <li>
              We reserve the right to suspend or terminate accounts that violate these
              Terms.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">4. User Content</h2>
          <p className="mt-2">
            When you submit content to the Site (such as reviews, ratings, or images),
            you:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              Retain ownership of your content but grant us a non-exclusive,
              royalty-free, worldwide licence to display, reproduce, and distribute it
              on the Site.
            </li>
            <li>
              Confirm that your content does not infringe any third party&apos;s
              intellectual property rights.
            </li>
            <li>
              Agree not to submit content that is unlawful, defamatory, abusive,
              obscene, or otherwise objectionable.
            </li>
          </ul>
          <p className="mt-2">
            We reserve the right to remove any user content that violates these Terms
            or that we deem inappropriate, without prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">5. Acceptable Use</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Use the Site for any unlawful purpose or in violation of any applicable law.</li>
            <li>Attempt to gain unauthorised access to any part of the Site, other users&apos; accounts, or our systems.</li>
            <li>Use automated tools (bots, scrapers, etc.) to access the Site without our prior written consent.</li>
            <li>Interfere with or disrupt the operation of the Site or its infrastructure.</li>
            <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</li>
            <li>Upload malicious code, viruses, or any other harmful material.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">6. AI-Powered Features</h2>
          <p className="mt-2">
            Certain features of the Site use artificial intelligence (powered by
            Anthropic&apos;s Claude) to generate recipe suggestions, estimate
            nutritional information, and suggest ingredient substitutions.
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>No guarantee of accuracy:</strong> AI-generated content
              (including recipes, nutritional estimates, and substitution suggestions)
              is provided for informational purposes only. We do not guarantee its
              accuracy, completeness, or suitability.
            </li>
            <li>
              <strong>Allergies and dietary requirements:</strong> always verify
              ingredients and nutritional information independently, especially if you
              have food allergies, intolerances, or specific dietary requirements.
              AI-generated suggestions should not be relied upon as a sole source of
              dietary or medical advice.
            </li>
            <li>
              <strong>Data processing:</strong> images and text you submit to
              AI-powered features are sent to Anthropic for processing. See our{" "}
              <a href="/privacy" className="text-orange-600 hover:text-orange-700 underline">
                Privacy Policy
              </a>{" "}
              for more details.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">7. Recipe Content &amp; Nutritional Information</h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              Recipes on the Site are provided for general informational and
              entertainment purposes. We make no representations about the
              nutritional accuracy or health benefits of any recipe.
            </li>
            <li>
              Nutritional information displayed on recipes is estimated and may not be
              accurate. It should not be used as a substitute for professional dietary
              advice.
            </li>
            <li>
              Always check ingredient labels and consult a healthcare professional if
              you have dietary concerns, allergies, or medical conditions.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">8. Intellectual Property</h2>
          <p className="mt-2">
            All content on the Site (excluding user-submitted content), including but
            not limited to text, graphics, logos, design, and software, is the
            property of Ella&apos;s Pantry or its licensors and is protected by
            copyright and other intellectual property laws.
          </p>
          <p className="mt-2">
            Some recipe images are generated using AI. All generated images are
            the property of Ella&apos;s Pantry.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">9. Third-Party Links &amp; Services</h2>
          <p className="mt-2">
            The Site may contain links to third-party websites or services. We are not
            responsible for the content, privacy practices, or availability of any
            third-party sites. Your use of third-party services is at your own risk and
            subject to their terms and policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">10. Advertisements</h2>
          <p className="mt-2">
            The Site displays advertisements served by Google AdSense. These
            advertisements may use cookies and similar technologies to serve ads based
            on your browsing activity. We are not responsible for the content of
            third-party advertisements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">11. Account Deletion</h2>
          <p className="mt-2">
            You may delete your account at any time through your profile settings.
            When you delete your account, all your personal data, saved recipes,
            reviews, ratings, meal plans, and collections will be permanently removed.
            This action cannot be undone.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">12. Limitation of Liability</h2>
          <p className="mt-2">
            To the fullest extent permitted by law:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              The Site and its content are provided &quot;as is&quot; and &quot;as available&quot;
              without warranties of any kind, whether express or implied.
            </li>
            <li>
              We shall not be liable for any indirect, incidental, special, or
              consequential damages arising from your use of the Site.
            </li>
            <li>
              We do not warrant that the Site will be uninterrupted, error-free, or
              free of viruses or other harmful components.
            </li>
            <li>
              In no event shall our total liability exceed the amount you have paid to
              us (if any) in the twelve months preceding the claim.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">13. Indemnification</h2>
          <p className="mt-2">
            You agree to indemnify and hold harmless Ella&apos;s Pantry from any
            claims, damages, losses, or expenses (including legal fees) arising from
            your use of the Site, your violation of these Terms, or your infringement
            of any third party&apos;s rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">14. Changes to These Terms</h2>
          <p className="mt-2">
            We may update these Terms from time to time. Changes will be posted on
            this page with an updated &quot;Last updated&quot; date. Your continued use of the
            Site after any changes constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">15. Governing Law</h2>
          <p className="mt-2">
            These Terms are governed by and construed in accordance with the laws of
            England and Wales. Any disputes shall be subject to the exclusive
            jurisdiction of the courts of England and Wales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900">16. Contact Us</h2>
          <p className="mt-2">
            If you have any questions about these Terms, please contact us at:{" "}
            <a
              href="mailto:hello@ellaspantry.co.uk"
              className="text-orange-600 hover:text-orange-700 underline"
            >
              hello@ellaspantry.co.uk
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
