import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Got questions about Ella's Pantry? Find answers about allergies, recipes, AI features, accounts, and more.",
};

const faqs = [
  {
    category: "Recipes & Cooking",
    questions: [
      {
        q: "Where do the recipes come from?",
        a: "Every recipe on Ella's Pantry has been discovered, developed, or adapted by me. I focus on creating dishes that are delicious for everyone, including those with food allergies.",
      },
      {
        q: "Can I adjust the number of servings?",
        a: "Yes! On every recipe page you'll see a servings adjuster above the ingredients list. Use the + and \u2212 buttons to scale the quantities up or down, and you can also toggle between metric and imperial units.",
      },
      {
        q: "What does the \"Are you missing any ingredients?\" feature do?",
        a: "If you're missing one or more ingredients, click the button on any recipe page to enter selection mode. Tick the ingredients you don't have and press \"Get Substitutes\" \u2014 our AI will suggest practical alternatives based on each ingredient's role in the dish, or let you know if an ingredient is too essential to replace.",
      },
      {
        q: "How do the Recipe Variations work?",
        a: "Below the cooking steps on each recipe, you'll find options like Vegan, Gluten-Free, Dairy-Free, and Budget. Click any of these to get AI-powered suggestions for swapping ingredients to suit that dietary need.",
      },
      {
        q: "Can I save recipes for later?",
        a: "Absolutely. Click the heart icon on any recipe to save it to your collection. You can also organise saved recipes into custom collections for easy access.",
      },
    ],
  },
  {
    category: "Allergies & Dietary Needs",
    questions: [
      {
        q: "How do I set up my allergy profile?",
        a: "Go to your profile settings and add your allergies. Once set, every recipe page will show a personalised warning banner if it contains any of your allergens, so you always know at a glance whether a dish is safe for you.",
      },
      {
        q: "Are the allergy warnings reliable?",
        a: "Our allergen detection is based on the listed ingredients and common associations. However, always double-check the actual ingredients yourself \u2014 especially if you have severe allergies. We can't account for cross-contamination or unlisted trace allergens.",
      },
      {
        q: "Can I filter recipes by dietary requirements?",
        a: "Yes. You can browse recipes by dietary tags such as vegan, gluten-free, and dairy-free. Use the category and dietary filters on the recipes page to narrow down your options.",
      },
    ],
  },
  {
    category: "My Fridge Feature",
    questions: [
      {
        q: "How does the \"What's in My Fridge\" feature work?",
        a: "Take a photo of the inside of your fridge (or manually enter what you have) and we'll use AI to identify your ingredients, then show you recipes you can make with what you've already got. It's a great way to reduce food waste and find inspiration.",
      },
      {
        q: "Does the fridge scanner store my photos?",
        a: "No. Your fridge photo is processed in real time to identify ingredients and is not stored on our servers. See our Privacy Policy for full details on how we handle your data.",
      },
    ],
  },
  {
    category: "AI Features",
    questions: [
      {
        q: "Which features use AI?",
        a: "Several features are powered by AI: ingredient substitution suggestions, recipe variations, the fridge scanner, and nutritional estimates. These are clearly marked throughout the site.",
      },
      {
        q: "How accurate are the AI suggestions?",
        a: "Our AI provides helpful starting points, but it's not infallible. Substitution suggestions are based on the functional role of each ingredient and should work well in most cases, but results can vary. Use your own judgement, especially with baking where precision matters most.",
      },
    ],
  },
  {
    category: "Account & Privacy",
    questions: [
      {
        q: "Do I need an account to use the site?",
        a: "You can browse and view all recipes without an account. However, you'll need to sign up to save recipes, leave reviews, create collections, and use the meal planner.",
      },
      {
        q: "How do I delete my account?",
        a: "You can request account deletion from your profile settings, or by emailing privacy@ellaspantry.co.uk. We'll remove your data in accordance with our Privacy Policy.",
      },
      {
        q: "How is my data used?",
        a: "We only collect what's needed to provide the service \u2014 your account details, saved recipes, and preferences. We don't sell your data. Full details are in our Privacy Policy.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold text-stone-900">
        Frequently Asked Questions
      </h1>
      <p className="mt-2 text-stone-600">
        Everything you need to know about using Ella&apos;s Pantry. Can&apos;t
        find what you&apos;re looking for?{" "}
        <a
          href="/contact"
          className="text-amber-700 hover:text-amber-800 underline"
        >
          Get in touch
        </a>{" "}
        and I&apos;ll be happy to help.
      </p>

      <div className="mt-10 space-y-10">
        {faqs.map((section) => (
          <section key={section.category}>
            <h2 className="text-xl font-semibold text-stone-900">
              {section.category}
            </h2>
            <dl className="mt-4 space-y-5">
              {section.questions.map((item) => (
                <div key={item.q}>
                  <dt className="text-sm font-semibold text-stone-800">
                    {item.q}
                  </dt>
                  <dd className="mt-1 text-sm text-stone-600 leading-relaxed">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
