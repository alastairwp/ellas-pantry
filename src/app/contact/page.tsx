import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Ella's Pantry - we'd love to hear from you.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold text-stone-900">Contact Us</h1>
      <p className="mt-2 text-stone-600">
        We&apos;d love to hear from you. Whether you have a question, feedback,
        or just want to say hello, feel free to get in touch.
      </p>

      <div className="mt-8 space-y-8 text-stone-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-stone-900">Email</h2>
          <p className="mt-2">
            For general enquiries, recipe suggestions, or feedback, please email
            us at:{" "}
            <a
              href="mailto:hello@ellaspantry.co.uk"
              className="text-amber-700 hover:text-amber-800 underline"
            >
              hello@ellaspantry.co.uk
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">
            Report an Issue
          </h2>
          <p className="mt-2">
            Found a bug, broken recipe, or something that doesn&apos;t look
            right? Please let us know by emailing{" "}
            <a
              href="mailto:support@ellaspantry.co.uk"
              className="text-amber-700 hover:text-amber-800 underline"
            >
              support@ellaspantry.co.uk
            </a>{" "}
            and we&apos;ll do our best to fix it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">
            Privacy &amp; Data Requests
          </h2>
          <p className="mt-2">
            For any questions regarding your personal data, privacy rights, or
            to submit a data deletion request, please refer to our{" "}
            <a
              href="/privacy"
              className="text-amber-700 hover:text-amber-800 underline"
            >
              Privacy Policy
            </a>{" "}
            or email us at{" "}
            <a
              href="mailto:privacy@ellaspantry.co.uk"
              className="text-amber-700 hover:text-amber-800 underline"
            >
              privacy@ellaspantry.co.uk
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">
            Response Times
          </h2>
          <p className="mt-2">
            We aim to respond to all enquiries within 2 business days. Please
            check your spam folder if you haven&apos;t heard back from us.
          </p>
        </section>
      </div>
    </div>
  );
}
