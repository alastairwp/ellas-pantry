export interface CategoryContent {
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  sections: { heading: string; text: string }[];
  metaDescription: string;
}

export const categoryContent: Record<string, CategoryContent> = {
  dinner: {
    heroTitle: "Dinner Recipes",
    heroSubtitle:
      "Thousands of evening meal ideas the whole family will love — with allergy-safe options for every diet.",
    intro:
      "Whether it's a quick midweek supper or a slow-cooked weekend feast, our dinner collection has something for every appetite and every schedule. From fragrant curries and hearty stews to fresh salads and elegant roasts, these are recipes designed to bring people together around the table.",
    sections: [
      {
        heading: "Safe for everyone at your table",
        text: "Cooking dinner for a family with mixed dietary needs can feel like running a restaurant. That's why every recipe on Ella's Pantry comes with clear allergy labelling. Set up your allergy profile in your account — whether you're avoiding eggs, nuts, dairy, or gluten — and use the 'Recipes for Me' filter to instantly see only the dishes that are safe for you. No more squinting at ingredient lists or second-guessing.",
      },
      {
        heading: "Cook with confidence",
        text: "Each dinner recipe comes with built-in timers so you never overcook your pasta or underbake your pie. Step-by-step instructions guide you through every stage, and our chef's tips share the little tricks that make each dish special — the kind of knowledge that usually takes years to pick up. Nutritional information is included for every recipe too, so you can keep track of what you're eating without the guesswork.",
      },
      {
        heading: "Use what you already have",
        text: "Not sure what to cook tonight? Try our 'My Fridge' feature — snap a photo of the inside of your fridge and we'll suggest dinner recipes you can make with the ingredients you already have. It's a brilliant way to reduce food waste and discover new favourites you'd never have thought to try.",
      },
    ],
    metaDescription:
      "Browse thousands of dinner recipes with allergy filters, step-by-step instructions, built-in timers, and nutritional info. Find safe, delicious evening meals for every diet.",
  },

  desserts: {
    heroTitle: "Dessert Recipes",
    heroSubtitle:
      "Indulgent puddings, cakes, and sweet treats — including hundreds of allergy-friendly options.",
    intro:
      "Dessert should never be an afterthought, and it should certainly never be something you have to miss out on because of a food allergy. Our dessert collection is packed with everything from classic chocolate cakes and fruit tarts to inventive dairy-free ice creams and egg-free mousses. Every recipe has been crafted to taste incredible — allergy-friendly or not.",
    sections: [
      {
        heading: "No one misses out",
        text: "Living with food allergies often means watching everyone else enjoy pudding while you go without. Not here. Register your allergies in your profile and toggle 'Recipes for Me' to filter out anything unsafe. Whether you need egg-free brownies, nut-free cookies, or dairy-free cheesecake, you'll find options that don't just work — they're genuinely delicious.",
      },
      {
        heading: "Baking with precision",
        text: "Desserts demand accuracy, and our recipes deliver. Every measurement is in clean, rounded metric units. Each step is clearly explained with timers you can start right from the recipe page — no fumbling with your phone while your hands are covered in flour. And our hints and tips reveal the secrets to perfect results, from how to tell when a cake is truly done to the trick for silky-smooth custard.",
      },
      {
        heading: "Discover something new",
        text: "With thousands of dessert recipes to explore, there's always something new to try. Use our dietary filters to find vegan puddings, gluten-free bakes, or refined sugar alternatives. Browse by difficulty if you're a beginner, or challenge yourself with something more ambitious. Either way, the nutritional breakdown is right there so you can make informed choices.",
      },
    ],
    metaDescription:
      "Discover thousands of dessert recipes including allergy-friendly cakes, puddings, and sweet treats. Filter by dietary needs, with nutritional info and step-by-step guidance.",
  },

  baking: {
    heroTitle: "Baking Recipes",
    heroSubtitle:
      "Breads, pastries, cakes, and bakes — with allergy-safe alternatives that taste just as good.",
    intro:
      "There's something magical about the smell of fresh baking. Whether you're making a simple loaf of bread, perfecting your croissants, or whipping up a batch of scones, baking is where science meets soul. Our baking collection covers everything from everyday essentials to showstopper creations, all with the precision and clarity you need to get brilliant results every time.",
    sections: [
      {
        heading: "Allergy-friendly baking made easy",
        text: "Baking with allergies used to mean endless substitution charts and crossed fingers. We've done the hard work for you. Every recipe is clearly tagged with dietary information, and many have been specifically developed to work without eggs, dairy, or nuts. Set up your allergy profile and let the 'Recipes for Me' filter do the thinking — you'll see only recipes that are safe for your specific needs.",
      },
      {
        heading: "Timers, tips, and technique",
        text: "Baking is all about timing. Our built-in recipe timers keep you on track for every proving, resting, and baking stage. The step-by-step format breaks complex bakes into manageable stages, and our hints and tips share professional techniques — from how to get a perfect rise to achieving a golden, crackling crust. It's like having a patient teacher by your side.",
      },
      {
        heading: "Know what you're eating",
        text: "Every baking recipe includes full nutritional information per serving, so you can enjoy your creations without any surprises. Whether you're watching your sugar intake or tracking your macros, the information is there. And if you're short on ingredients, use the 'My Fridge' feature to find bakes you can make right now with what you've got in your kitchen.",
      },
    ],
    metaDescription:
      "Explore hundreds of baking recipes with allergy-safe alternatives, built-in timers, and nutritional info. Breads, cakes, pastries, and more — for every skill level.",
  },

  breakfast: {
    heroTitle: "Breakfast Recipes",
    heroSubtitle:
      "Start your morning right with quick, nourishing breakfast ideas — safe for every allergy.",
    intro:
      "They say breakfast is the most important meal of the day, but when you have food allergies it can also be the trickiest. So many cereals, pastries, and breakfast staples contain hidden allergens. Our breakfast collection gives you hundreds of ideas for mornings — from five-minute smoothies and overnight oats to full cooked breakfasts and brunch-worthy pancakes, all with complete allergy transparency.",
    sections: [
      {
        heading: "Mornings without worry",
        text: "No more reading the back of every cereal box. Register your allergies in your Ella's Pantry profile and filter breakfast recipes to see only what's safe for you. Whether you're avoiding dairy, eggs, nuts, or gluten, you'll find options that are genuinely tasty — not just safe. The 'Recipes for Me' toggle makes it instant.",
      },
      {
        heading: "Quick, timed, and foolproof",
        text: "We know mornings are busy. Each recipe shows total prep and cook time upfront, so you can pick something that fits your schedule. Built-in timers mean you can set your porridge going and get dressed without worrying. And the step-by-step instructions are clear enough to follow before your first coffee.",
      },
      {
        heading: "Nutritional start to the day",
        text: "Every breakfast recipe includes a full nutritional breakdown — calories, protein, carbs, fat, fibre, and sugar. Whether you're fuelling up for a workout, packing lunchboxes, or just trying to eat more balanced meals, you can make informed choices from the very first bite of the day.",
      },
    ],
    metaDescription:
      "Find hundreds of breakfast recipes with allergy filters, nutritional info, and step-by-step instructions. Quick weekday ideas and leisurely weekend brunches for every diet.",
  },

  lunch: {
    heroTitle: "Lunch Recipes",
    heroSubtitle:
      "Midday meals to fuel your afternoon — from quick bites to proper sit-down lunches.",
    intro:
      "Lunch should be something to look forward to, not a sad sandwich at your desk. Our lunch collection ranges from quick wraps, salads, and soups that take minutes to prepare, right through to more substantial dishes perfect for a weekend lunch with friends. Every recipe is designed to be satisfying, flavourful, and safe for your dietary needs.",
    sections: [
      {
        heading: "Allergy-safe packed lunches",
        text: "Packing a lunch when you have food allergies — or packing one for someone who does — takes thought. Our allergy filters take the stress away. Set up your profile, toggle 'Recipes for Me', and browse a curated list of lunches you know are safe. You can even search by specific ingredients to match what's in your fridge.",
      },
      {
        heading: "From fifteen minutes to leisurely",
        text: "Use the cook time filter to find something that suits your schedule. Need something in fifteen minutes? Done. Got more time on a Sunday? Explore our more elaborate options. Every recipe has built-in timers and clear instructions so you get consistent results whether you're rushing or relaxing.",
      },
      {
        heading: "Rate, review, and share",
        text: "Found a lunch recipe that's become your go-to? Rate it and leave a review so others can discover it too. Your reviews help the Ella's Pantry community find the best recipes — and our hints and tips on each recipe mean you'll pick up new ideas every time you cook. Save your favourites to your profile for easy access next time.",
      },
    ],
    metaDescription:
      "Browse hundreds of lunch recipes with allergy-safe options, quick filters, and nutritional info. From fast weekday meals to relaxed weekend lunches.",
  },

  sides: {
    heroTitle: "Side Dish Recipes",
    heroSubtitle:
      "Salads, vegetables, grains, and accompaniments to complete any meal.",
    intro:
      "A great side dish can transform a simple main into a complete meal. Our sides collection covers everything from crisp salads and roasted vegetables to fragrant rice dishes and creamy (or dairy-free!) gratins. These are the recipes that round out your plate and add colour, texture, and flavour to whatever you're serving.",
    sections: [
      {
        heading: "Sides that suit your diet",
        text: "Side dishes are often where hidden allergens sneak in — a splash of cream here, a handful of nuts there. Every side recipe on Ella's Pantry is clearly labelled with dietary tags, and our allergy filter ensures you only see options that are safe. Set up your profile once and you're sorted for every meal.",
      },
      {
        heading: "Mix, match, and plan",
        text: "Use our meal planning feature to pair sides with your main courses throughout the week. Browse by ingredient if you've got vegetables to use up, or filter by cook time to find something quick. The nutritional information for each side helps you balance your overall meal — especially useful if you're tracking macros or managing specific dietary goals.",
      },
      {
        heading: "Tips from the kitchen",
        text: "Our chef's hints and tips on each recipe share the small details that make a real difference — how to get truly crispy roast potatoes, the secret to fluffy couscous, or when to dress a salad for maximum flavour. Combined with built-in timers and step-by-step instructions, even the simplest side dish becomes something special.",
      },
    ],
    metaDescription:
      "Discover hundreds of side dish recipes — salads, vegetables, grains, and more. Allergy-safe options with nutritional info and expert cooking tips.",
  },

  snacks: {
    heroTitle: "Snack Recipes",
    heroSubtitle:
      "Homemade snacks and nibbles — healthier, tastier, and safer than anything from a packet.",
    intro:
      "Shop-bought snacks are a minefield when you have food allergies. That's why making your own is so much better — you know exactly what's in them, they taste infinitely better, and they cost a fraction of the price. Our snack collection includes everything from energy balls and granola bars to dips, crisps, and savoury bites that are perfect for lunchboxes, after-school hunger, or entertaining.",
    sections: [
      {
        heading: "Snacking without the anxiety",
        text: "When you or your child has a food allergy, every snack requires a label check. Ella's Pantry removes that worry entirely. Register your allergies, hit 'Recipes for Me', and browse snacks that are guaranteed safe. Whether you need nut-free treats for school or dairy-free nibbles for a party, we've got you covered.",
      },
      {
        heading: "Quick to make, easy to store",
        text: "Most of our snack recipes are designed to be quick — many take under fifteen minutes. Use the cook time filter to find the fastest options. Batch-cook your favourites at the weekend and you'll have snacks ready for the whole week. Every recipe includes prep and cook times, plus built-in timers so nothing burns while you're busy.",
      },
      {
        heading: "Smart snacking",
        text: "Every snack recipe includes full nutritional information so you can make informed choices. Whether you're after a high-protein post-workout bite or a lower-sugar treat for the kids, the numbers are right there. Combine this with our dietary filters and you've got a personalised snack menu tailored exactly to your needs.",
      },
    ],
    metaDescription:
      "Make homemade snacks with allergy-safe recipes, nutritional info, and quick cook times. Energy balls, dips, bars, and more — perfect for lunchboxes and entertaining.",
  },

  drinks: {
    heroTitle: "Drink Recipes",
    heroSubtitle:
      "Smoothies, shakes, hot drinks, and mocktails — refreshing ideas for every occasion.",
    intro:
      "Drinks are often overlooked in recipe collections, but they shouldn't be. A well-made smoothie can be a complete breakfast. A warming hot chocolate (yes, dairy-free!) can be the best part of a winter evening. Our drinks collection includes smoothies, milkshakes, hot drinks, mocktails, and more — all with the same allergy transparency and nutritional detail as every other recipe on the site.",
    sections: [
      {
        heading: "Allergy-free drinks done right",
        text: "Dairy-free hot chocolate that actually tastes rich and creamy. Nut-free smoothies packed with protein. Egg-free milkshakes that are thick and indulgent. When you set up your allergy profile and use our filters, you'll discover drinks you never knew you could enjoy. Every recipe is clearly tagged so there are no surprises.",
      },
      {
        heading: "Blend, pour, enjoy",
        text: "Most of our drink recipes take just minutes to prepare. Step-by-step instructions make them foolproof, and the hints and tips share tricks like how to get the creamiest smoothie texture or the perfect froth on your dairy-free latte. Timers are built in for anything that needs heating or steeping.",
      },
      {
        heading: "Track what you're drinking",
        text: "Drinks can be surprisingly calorific — or surprisingly nutritious. Every drink recipe includes a full nutritional breakdown so you know exactly what you're sipping. Filter by dietary requirements to find vegan shakes, gluten-free smoothie bowls, or low-sugar options. Rate your favourites and leave reviews to help others discover the best drinks on the site.",
      },
    ],
    metaDescription:
      "Explore drink recipes including smoothies, shakes, and hot drinks — all with allergy filters, nutritional info, and dairy-free alternatives. Quick, easy, and delicious.",
  },

  soups: {
    heroTitle: "Soup Recipes",
    heroSubtitle:
      "Warming, nourishing bowls of comfort — from quick weeknight broths to slow-simmered showstoppers.",
    intro:
      "There are few things more comforting than a steaming bowl of homemade soup. Whether it's a silky butternut squash velout\u00e9 on a cold evening, a chunky minestrone packed with vegetables, or a spicy laksa that warms you from the inside out, soup is one of the most versatile and satisfying things you can cook. Our collection spans cuisines and seasons, with recipes for every skill level and every dietary need.",
    sections: [
      {
        heading: "Soup that's safe for you",
        text: "Hidden allergens lurk in many soup recipes — a knob of butter to finish, cream stirred in at the end, croutons made with wheat. On Ella's Pantry, every soup recipe is clearly labelled with dietary tags. Register your allergies in your profile and use the 'Recipes for Me' toggle to see only soups that are completely safe for your needs. Whether you're dairy-free, gluten-free, or managing multiple allergies, you'll find bowls of comfort you can enjoy without a second thought.",
      },
      {
        heading: "Simmer, taste, perfect",
        text: "Great soup is all about patience and timing. Our built-in recipe timers keep track of simmering times so you can walk away and come back to perfectly developed flavours. Step-by-step instructions guide you through every stage — from sweating onions to blending to the right consistency. And our hints and tips share the little secrets that elevate a good soup to a great one, like when to add herbs for maximum flavour or how to get a restaurant-quality finish.",
      },
      {
        heading: "A bowl of goodness",
        text: "Soup is one of the best ways to pack vegetables, fibre, and nutrients into a single meal. Every recipe includes a full nutritional breakdown — calories, protein, carbs, fat, fibre, and sugar — so you know exactly what you're eating. If you're looking to use up what's in your kitchen, try the 'My Fridge' feature to find soup recipes that match the ingredients you already have. It's the perfect way to turn odds and ends into something wonderful.",
      },
    ],
    metaDescription:
      "Browse hundreds of soup recipes with allergy filters, nutritional info, and step-by-step instructions. Warming broths, creamy velout\u00e9s, and hearty stews for every diet.",
  },

  salads: {
    heroTitle: "Salad Recipes",
    heroSubtitle:
      "Fresh, vibrant, and full of flavour — salads that are anything but boring.",
    intro:
      "Forget sad, wilted leaves on the side of a plate. The salads in our collection are bold, satisfying meals in their own right. Think crispy halloumi on a bed of roasted vegetables, zingy Asian-style slaws, grain bowls loaded with colour and texture, and fresh summer plates that make the most of seasonal produce. Whether you're after a light lunch or a substantial dinner, these salads deliver on every front.",
    sections: [
      {
        heading: "Allergy-friendly freshness",
        text: "Salads seem safe, but dressings often contain hidden allergens — egg in mayonnaise, nuts in pesto, dairy in creamy dressings. Every salad on Ella's Pantry comes with complete allergy labelling. Set up your allergy profile and the 'Recipes for Me' filter will show you only salads that are genuinely safe. You'll discover dressings and toppings that are just as delicious without the ingredients you need to avoid.",
      },
      {
        heading: "Assembly made simple",
        text: "A great salad is all about the components coming together at the right moment. Our step-by-step instructions break down the prep clearly — what to roast, what to dress in advance, and what to add at the last minute for crunch. Built-in timers help with any roasting or toasting, and our hints and tips cover everything from making the perfect vinaigrette to keeping leaves crisp.",
      },
      {
        heading: "Light, balanced, and trackable",
        text: "Salads are naturally one of the healthiest options on the menu, and our nutritional breakdowns let you see exactly what's in each serving. Whether you're eating lighter, tracking macros, or simply want more vegetables in your diet, you can browse by cook time to find quick options or search by ingredient to build around what you already have. Rate your favourites and save them to your profile for easy access — your perfect salad is always just a tap away.",
      },
    ],
    metaDescription:
      "Discover vibrant salad recipes with allergy filters, nutritional info, and expert tips. Fresh grain bowls, roasted vegetable salads, and creative dressings for every diet.",
  },
};
