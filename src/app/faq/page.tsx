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
        q: "What is the \"What Went Wrong?\" troubleshooter?",
        a: "If a dish didn't turn out right \u2014 cake didn't rise, sauce split, too salty \u2014 scroll to the \"What Went Wrong?\" section on any recipe page. Pick a common problem or describe your own, and our AI will diagnose what likely happened, suggest fixes for next time, and tell you if the dish can be salvaged. You can also reach it from Cook Mode by tapping \"Something didn't go right?\" after finishing.",
      },
      {
        q: "Can I save recipes for later?",
        a: "Absolutely. Click the heart icon on any recipe to save it to your collection. You can also organise saved recipes into custom collections for easy access.",
      },
    ],
  },
  {
    category: "Cook Mode",
    questions: [
      {
        q: "What is Cook Mode?",
        a: "Cook Mode gives you a full-screen, step-by-step view of any recipe \u2014 perfect for cooking hands-free. It keeps your screen awake, shows a progress bar, and you can navigate with your keyboard or swipe between steps.",
      },
      {
        q: "Are there cooking timers?",
        a: "Yes. When a step mentions a time (e.g. \"simmer for 15 minutes\"), a timer button appears inline. Tap it to start a countdown with an audio alert when it's done. You can run multiple timers at once.",
      },
      {
        q: "Can I control Cook Mode with my voice?",
        a: "Yes! Tap the microphone icon in Cook Mode to enable voice commands. You can say things like \"next step\", \"previous step\", \"repeat\", and \"start timer\" to navigate hands-free while you cook.",
      },
      {
        q: "What are Adaptive Steps?",
        a: "Recipes can adapt their instructions based on your skill level (beginner, intermediate, or advanced). Beginners get more detailed guidance, while advanced cooks see streamlined steps. Set your skill level in your profile settings.",
      },
    ],
  },
  {
    category: "Meal Planning & Shopping",
    questions: [
      {
        q: "How does the Meal Planner work?",
        a: "Go to the Meal Planner page and you'll see a weekly grid with slots for breakfast, lunch, dinner, and snacks for each day. Click the + button on any slot, search for a recipe, and add it. Your plan is saved automatically.",
      },
      {
        q: "How do I get a shopping list?",
        a: "Once you've added recipes to your meal plan, switch to the Shopping List tab. It automatically generates an aggregated list of all ingredients you need, combining duplicates across recipes. You can tick items off, copy the list, or print it.",
      },
      {
        q: "Can I get shopping list reminders on my phone?",
        a: "Yes! If you're using the app on a supported browser (Chrome, Edge, Firefox on Android), enable push notifications from the Shopping List tab. Then tap \"Send to Phone\" to receive your shopping list as a notification you can check while you're out.",
      },
    ],
  },
  {
    category: "Install & App",
    questions: [
      {
        q: "Can I install Ella's Pantry as an app?",
        a: "Yes! Ella's Pantry works as an installable app on your phone or desktop. On Chrome or Edge, look for the install icon in the address bar. On iPhone, tap the Share button in Safari, then \"Add to Home Screen\". Once installed, it opens in its own window like a native app.",
      },
      {
        q: "Does the app work offline?",
        a: "Pages you've previously visited are cached and available offline. This means you can still browse recipes you've looked at even without an internet connection \u2014 handy if your signal drops while shopping.",
      },
      {
        q: "How do I enable or disable push notifications?",
        a: "Head to the Meal Planner's Shopping List tab, where you'll find a notifications toggle. You can enable or disable them at any time. If you've blocked notifications in your browser settings, you'll need to allow them there first.",
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
        a: "Several features are powered by AI: ingredient substitution suggestions, recipe variations, the fridge scanner, the \"What Went Wrong?\" troubleshooter, adaptive cooking steps based on your skill level, and nutritional estimates. These are clearly marked throughout the site.",
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
