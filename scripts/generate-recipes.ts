#!/usr/bin/env npx tsx
/**
 * Local recipe generator.
 *
 * Generates recipes using Ollama (local) or Claude (remote),
 * and saves them directly to the database.
 *
 * Usage:
 *   npx tsx scripts/generate-recipes.ts --count 20
 *   npx tsx scripts/generate-recipes.ts --count 50 --db-url "postgresql://user:pass@localhost:5555/db"
 *   npx tsx scripts/generate-recipes.ts --count 10 --provider claude
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve, basename } from "path";
import { appendFileSync, readdirSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { jsonrepair } from "jsonrepair";
import { titleWords, jaccard } from "../src/lib/similarity.js";

// Load .env from project root
config({ path: resolve(__dirname, "..", ".env") });

// ── CLI args ──────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      opts[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }

  return {
    dbUrl: opts["db-url"] || process.env.DATABASE_URL || "",
    count: parseInt(opts["count"] || "50", 10),
    offset: opts["offset"] ? parseInt(opts["offset"], 10) : undefined,
    provider: (opts["provider"] || process.env.RECIPE_LLM_PROVIDER || "local") as "local" | "claude",
    model: opts["model"] || process.env.OLLAMA_MODEL || "mistral",
    ollamaUrl: opts["ollama-url"] || process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    category: (opts["category"] || "general") as "general" | "baking" | "soups" | "bread" | "salads" | "curries" | "asian",
    source: (opts["source"] || "combinatorial") as "combinatorial" | "external" | "image-files",
    dryRun: process.argv.includes("--dry-run"),
    localImages: process.argv.includes("--local-images"),
    localImagesDir: opts["local-images-dir"] || resolve(__dirname, "generated-images"),
    publish: process.argv.includes("--publish"),
  };
}

// ── Dish name generation (copied from src/lib/dish-names.ts) ─────────────

const cuisines = [
  "Italian", "French", "Mexican", "Thai", "Indian", "Japanese", "Chinese",
  "Korean", "Vietnamese", "Greek", "Spanish", "Moroccan", "Turkish",
  "Lebanese", "Ethiopian", "Jamaican", "Brazilian", "Peruvian", "Cuban",
  "Argentine", "German", "Polish", "Hungarian", "Swedish", "British",
  "Irish", "Scottish", "American", "Cajun", "Southern", "Tex-Mex",
  "Hawaiian", "Filipino", "Indonesian", "Malaysian", "Singaporean",
  "Australian", "Middle Eastern", "Persian", "Georgian", "Ukrainian",
  "Russian", "Portuguese", "West African", "South African", "Caribbean",
  "Nepalese", "Sri Lankan", "Burmese", "Taiwanese",
];

const proteins = [
  "Chicken", "Beef", "Pork", "Lamb", "Turkey", "Duck", "Salmon", "Tuna",
  "Cod", "Shrimp", "Prawns", "Crab", "Lobster", "Scallops", "Mussels",
  "Clams", "Squid", "Octopus", "Sardines", "Mackerel", "Trout", "Sea Bass",
  "Halibut", "Swordfish", "Tilapia", "Tofu", "Tempeh", "Seitan",
  "Chickpeas", "Lentils", "Black Beans", "Kidney Beans", "White Beans",
  "Eggs", "Paneer", "Halloumi", "Venison", "Rabbit", "Quail", "Goat",
  "Bison", "Anchovies", "Mahi Mahi", "Snapper", "Catfish", "Monkfish",
  "Chorizo", "Sausage", "Bacon", "Ham",
];

const vegetables = [
  "Mushroom", "Spinach", "Kale", "Broccoli", "Cauliflower", "Sweet Potato",
  "Potato", "Butternut Squash", "Courgette", "Aubergine", "Bell Pepper",
  "Tomato", "Onion", "Garlic", "Ginger", "Carrot", "Beetroot",
  "Asparagus", "Green Bean", "Pea", "Corn", "Artichoke", "Leek",
  "Fennel", "Celery", "Radish", "Turnip", "Parsnip", "Cabbage",
  "Brussels Sprout", "Pumpkin", "Avocado", "Cucumber", "Rocket",
  "Watercress", "Pak Choi", "Bean Sprout", "Edamame", "Okra",
  "Plantain", "Cassava", "Daikon", "Lotus Root", "Bamboo Shoot",
];

const cookingMethods = [
  "Roasted", "Grilled", "Pan-Fried", "Baked", "Braised", "Steamed",
  "Poached", "Sauteed", "Stir-Fried", "Deep-Fried", "Smoked", "Slow-Cooked",
  "Chargrilled", "Blackened", "Seared", "Glazed", "Stuffed", "Marinated",
  "Barbecued", "Broiled", "Blanched", "Caramelised", "Cured", "Pickled",
  "Fermented", "Air-Fried", "Pressure-Cooked", "Sous Vide",
];

const dishTypes = [
  "Stew", "Curry", "Soup", "Salad", "Stir Fry", "Casserole", "Pie",
  "Pasta", "Risotto", "Paella", "Tacos", "Burrito", "Bowl", "Wrap",
  "Sandwich", "Burger", "Skewers", "Kebab", "Noodles", "Fried Rice",
  "Pilaf", "Biryani", "Tagine", "Goulash", "Chilli", "Laksa",
  "Ramen", "Pho", "Dumplings", "Spring Rolls", "Fritters", "Croquettes",
  "Gratin", "Tart", "Quiche", "Frittata", "Omelette", "Pancakes",
  "Flatbread", "Pizza", "Lasagne", "Cannelloni", "Gnocchi", "Ravioli",
  "Wellington", "Pot Pie", "Empanadas", "Samosas", "Gyoza", "Satay",
  "Teriyaki", "Katsu", "Tikka Masala", "Vindaloo", "Korma", "Jalfrezi",
  "Rendang", "Massaman", "Pad Thai", "Fajitas", "Enchiladas",
  "Quesadilla", "Nachos", "Ceviche", "Poke Bowl", "Bibimbap",
  "Bolognese", "Carbonara", "Arrabiata", "Puttanesca", "Primavera",
];

const flavourProfiles = [
  "Honey", "Lemon", "Lime", "Garlic", "Herb", "Spicy", "Smoky",
  "Sweet and Sour", "Tangy", "Sesame", "Peanut", "Coconut", "Miso",
  "Teriyaki", "Sriracha", "Chipotle", "Harissa", "Pesto", "Chimichurri",
  "Tahini", "Mustard", "Maple", "Truffle", "Saffron", "Turmeric",
  "Paprika", "Cumin", "Coriander", "Rosemary", "Thyme", "Basil",
  "Mint", "Dill", "Tarragon", "Chive", "Parsley", "Sage",
  "Cinnamon", "Cardamom", "Star Anise", "Szechuan Pepper", "Wasabi",
  "Pomegranate", "Cranberry", "Mango", "Pineapple", "Orange",
];

const desserts = [
  "Cake", "Cheesecake", "Brownie", "Cookie", "Muffin", "Cupcake",
  "Pudding", "Trifle", "Mousse", "Panna Cotta", "Creme Brulee",
  "Ice Cream", "Sorbet", "Parfait", "Tart", "Pie", "Crumble",
  "Cobbler", "Galette", "Strudel", "Baklava", "Tiramisu", "Cannoli",
  "Eclair", "Profiterole", "Macaron", "Meringue", "Pavlova",
  "Fudge", "Truffle", "Biscotti", "Scone", "Danish", "Croissant",
  "Donut", "Churros", "Crepe", "Waffle", "Pancake Stack",
  "Blondie", "Slice", "Flapjack", "Granola Bar", "Energy Ball",
];

const dessertFlavours = [
  "Chocolate", "Vanilla", "Strawberry", "Raspberry", "Blueberry",
  "Lemon", "Lime", "Orange", "Coconut", "Banana", "Apple",
  "Pear", "Peach", "Mango", "Passion Fruit", "Cherry", "Blackberry",
  "Fig", "Date", "Caramel", "Toffee", "Butterscotch", "Peanut Butter",
  "Almond", "Hazelnut", "Pistachio", "Walnut", "Pecan", "Matcha",
  "Coffee", "Espresso", "Mocha", "Ginger", "Cinnamon", "Cardamom",
  "Rose", "Lavender", "Honey", "Maple", "Salted Caramel",
  "White Chocolate", "Dark Chocolate", "Red Velvet", "Tiramisu",
  "Cookies and Cream", "Mint Chocolate", "Rum and Raisin",
];

const drinks = [
  "Smoothie", "Milkshake", "Juice", "Lemonade", "Iced Tea", "Hot Chocolate",
  "Latte", "Frappe", "Lassi", "Agua Fresca", "Horchata", "Chai",
  "Matcha Latte", "Golden Milk", "Kombucha", "Punch", "Spritzer",
  "Mocktail", "Slushie", "Float",
];

const breakfastDishes = [
  "Porridge", "Granola Bowl", "Overnight Oats", "Smoothie Bowl",
  "Breakfast Burrito", "Eggs Benedict", "Shakshuka", "French Toast",
  "Breakfast Hash", "Breakfast Muffins", "Banana Bread",
  "Acai Bowl", "Chia Pudding", "Breakfast Wrap", "Huevos Rancheros",
  "Dutch Baby Pancake", "Breakfast Quesadilla", "Breakfast Pizza",
  "Breakfast Casserole", "Kedgeree",
];

function generateDishNames(count: number, offset: number = 0): string[] {
  const allNames: string[] = [];

  for (const method of cookingMethods) {
    for (const protein of proteins) {
      for (const veg of vegetables) {
        allNames.push(`${method} ${protein} with ${veg}`);
      }
    }
  }

  for (const cuisine of cuisines) {
    for (const protein of proteins) {
      for (const dish of dishTypes) {
        allNames.push(`${cuisine} ${protein} ${dish}`);
      }
    }
  }

  for (const flavour of flavourProfiles) {
    for (const protein of proteins) {
      for (const dish of dishTypes) {
        allNames.push(`${flavour} ${protein} ${dish}`);
      }
    }
  }

  for (const cuisine of cuisines) {
    for (const veg of vegetables) {
      for (const dish of dishTypes) {
        allNames.push(`${cuisine} ${veg} ${dish}`);
      }
    }
  }

  for (const flavour of dessertFlavours) {
    for (const dessert of desserts) {
      allNames.push(`${flavour} ${dessert}`);
    }
  }

  for (const cuisine of cuisines) {
    for (const flavour of dessertFlavours) {
      for (const dessert of desserts) {
        allNames.push(`${cuisine}-Style ${flavour} ${dessert}`);
      }
    }
  }

  for (const cuisine of cuisines) {
    for (const dish of breakfastDishes) {
      allNames.push(`${cuisine} ${dish}`);
    }
  }

  for (const flavour of flavourProfiles) {
    for (const veg of vegetables) {
      allNames.push(`${flavour} ${veg}`);
    }
  }

  for (const flavour of dessertFlavours) {
    for (const drink of drinks) {
      allNames.push(`${flavour} ${drink}`);
    }
  }

  for (const method of cookingMethods) {
    for (const veg of vegetables) {
      for (const flavour of flavourProfiles.slice(0, 15)) {
        allNames.push(`${method} ${veg} with ${flavour}`);
      }
    }
  }

  const unique = [...new Set(allNames)];
  return unique.slice(offset, offset + count);
}

// ── Baking & dessert name generation (22,500+ unique names) ───────────────

const bakingFlavours = [
  // Chocolate
  "Chocolate", "Dark Chocolate", "White Chocolate", "Milk Chocolate", "Ruby Chocolate",
  "Mint Chocolate", "Orange Chocolate", "Chilli Chocolate", "Salted Chocolate",
  // Caramel & toffee
  "Caramel", "Salted Caramel", "Toffee", "Butterscotch", "Dulce de Leche", "Praline",
  // Classic
  "Vanilla", "Brown Butter", "Honey", "Maple", "Treacle", "Golden Syrup",
  // Berry
  "Strawberry", "Raspberry", "Blueberry", "Blackberry", "Blackcurrant", "Cherry",
  "Cranberry", "Pomegranate", "Gooseberry", "Elderflower",
  // Citrus
  "Lemon", "Lime", "Orange", "Blood Orange", "Grapefruit", "Yuzu", "Clementine",
  // Tropical
  "Mango", "Passion Fruit", "Coconut", "Pineapple", "Banana", "Papaya", "Guava",
  // Stone fruit
  "Peach", "Apricot", "Plum", "Cherry", "Fig", "Date", "Quince", "Rhubarb",
  // Other fruit
  "Apple", "Pear", "Pear and Ginger",
  // Nut
  "Almond", "Hazelnut", "Pistachio", "Walnut", "Pecan", "Chestnut", "Peanut Butter",
  "Tahini", "Black Sesame", "Sesame",
  // Spice & floral
  "Cinnamon", "Ginger", "Cardamom", "Saffron", "Rose", "Lavender", "Jasmine",
  "Pumpkin Spice", "Speculaas", "Chai", "Earl Grey",
  // Coffee & tea
  "Coffee", "Espresso", "Mocha", "Matcha",
  // Confection & other
  "Cookies and Cream", "Red Velvet", "Lotus Biscoff", "Marzipan", "Nougat",
  "Amaretto", "Rum", "Bourbon", "Baileys", "Champagne",
];

const bakingTypes = [
  // Cakes
  "Sponge Cake", "Victoria Sponge", "Genoise", "Chiffon Cake", "Angel Food Cake",
  "Devil's Food Cake", "Pound Cake", "Bundt Cake", "Marble Cake", "Layer Cake",
  "Naked Cake", "Drip Cake", "Mirror Glaze Cake", "Semi-Naked Cake", "Celebration Cake",
  "Upside-Down Cake", "Molten Lava Cake", "Flourless Cake", "Olive Oil Cake",
  "Polenta Cake", "Swiss Roll", "Yule Log", "Roulade", "Mousse Cake", "Entremet",
  "Charlotte", "Refrigerator Cake", "No-Bake Cake", "Traybake Cake", "Loaf Cake",
  "Coffee Cake", "Crumb Cake",
  // Cheesecakes
  "Cheesecake", "Baked Cheesecake", "No-Bake Cheesecake", "Basque Cheesecake",
  "Japanese Cheesecake", "Ricotta Cheesecake", "Cheesecake Tart", "Mini Cheesecakes",
  // Cupcakes & small cakes
  "Cupcakes", "Mini Cupcakes", "Fairy Cakes", "Butterfly Cakes", "Mini Bundts",
  "Financiers", "Friands", "Madeleines", "Cannelés", "Rum Babas", "Petits Fours",
  "Whoopie Pies",
  // Muffins & quick breads
  "Muffins", "Jumbo Muffins", "Banana Bread", "Loaf", "Tea Loaf", "Quick Bread",
  "Pumpkin Bread", "Zucchini Bread", "Fruit Loaf",
  // Scones & griddle
  "Scones", "Cream Scones", "Drop Scones", "Welsh Cakes",
  // Cookies & biscuits
  "Cookies", "Chocolate Chip Cookies", "Drop Cookies", "Rolled Cookies",
  "Slice and Bake Cookies", "Sandwich Cookies", "Thumbprint Cookies",
  "Shortbread", "Shortbread Fingers", "Scottish Shortbread", "Viennese Whirls",
  "Biscotti", "Cantuccini", "Macarons", "Amaretti", "Meringue Kisses",
  "Florentines", "Tuiles", "Langues de Chat", "Snickerdoodles", "Rugelach",
  "Gingerbread", "Speculaas", "Pizzelle",
  // Bars & traybakes
  "Brownies", "Fudgy Brownies", "Cheesecake Brownies", "Blondies", "Traybake",
  "Rocky Road", "Flapjacks", "Granola Bars", "Lemon Bars", "Cheesecake Bars",
  "Millionaire's Shortbread", "Tiffin", "Nanaimo Bars", "Caramel Slices",
  "Date Squares", "Coconut Bars", "Peanut Butter Bars", "Muesli Bars",
  "Crispy Treats", "Brookies",
  // Pies & tarts
  "Pie", "Double-Crust Pie", "Lattice Pie", "Deep Dish Pie", "Hand Pies",
  "Slab Pie", "Tart", "Mini Tarts", "Custard Tart", "Cream Tart",
  "Meringue Pie", "Chiffon Pie", "Ice Cream Pie", "Galette", "Clafoutis",
  "Cobbler", "Crisp", "Crumble", "Buckle", "Brown Betty",
  // Pastries
  "Croissants", "Pain au Chocolat", "Almond Croissants", "Cinnamon Rolls",
  "Sticky Buns", "Danish Pastry", "Babka", "Strudel", "Filo Parcels",
  "Baklava", "Choux Buns", "Eclairs", "Profiteroles", "Paris-Brest",
  "Mille-Feuille", "Palmiers", "Turnovers", "Doughnuts", "Churros",
  // Puddings & custards
  "Crème Brûlée", "Crème Caramel", "Panna Cotta", "Mousse", "Syllabub",
  "Posset", "Fool", "Trifle", "Tiramisu", "Bread and Butter Pudding",
  "Steamed Pudding", "Baked Alaska", "Blancmange", "Chia Pudding",
  "Rice Pudding", "Floating Islands",
  // Frozen
  "Ice Cream", "Gelato", "Sorbet", "Granita", "Semifreddo", "Parfait",
  "Frozen Yogurt", "Bombe", "Ice Cream Cake", "Ice Cream Sandwich",
  // Confectionery
  "Fudge", "Truffles", "Chocolate Bark", "Toffee", "Brittle", "Pralines",
  "Caramels", "Nougat", "Marshmallows",
];

function generateBakingDishNames(count: number, offset: number = 0): string[] {
  const allNames: string[] = [];

  // Primary: flavour + type
  for (const flavour of bakingFlavours) {
    for (const type of bakingTypes) {
      allNames.push(`${flavour} ${type}`);
    }
  }

  // Secondary: Two-flavour combos + type (top pairings)
  const pairings = [
    ["Chocolate", "Raspberry"], ["Chocolate", "Orange"], ["Chocolate", "Hazelnut"],
    ["Lemon", "Raspberry"], ["Lemon", "Lavender"], ["Lemon", "Coconut"],
    ["Strawberry", "Cream"], ["Peach", "Raspberry"], ["Apple", "Cinnamon"],
    ["Banana", "Caramel"], ["Coffee", "Walnut"], ["Peanut Butter", "Chocolate"],
    ["Salted Caramel", "Pecan"], ["Rose", "Pistachio"], ["Matcha", "White Chocolate"],
    ["Cardamom", "Orange"], ["Ginger", "Lemon"], ["Coconut", "Mango"],
    ["Almond", "Cherry"], ["Vanilla", "Raspberry"], ["Passion Fruit", "Coconut"],
    ["Blood Orange", "Dark Chocolate"], ["Chai", "Caramel"], ["Earl Grey", "Lemon"],
    ["Espresso", "Cardamom"],
  ];

  const pairingTypes = [
    "Cake", "Cheesecake", "Tart", "Cupcakes", "Brownies", "Cookies",
    "Mousse", "Panna Cotta", "Crème Brûlée", "Ice Cream", "Truffles",
    "Macarons", "Swiss Roll", "Layer Cake", "Fudge",
  ];

  for (const [f1, f2] of pairings) {
    for (const type of pairingTypes) {
      allNames.push(`${f1} and ${f2} ${type}`);
    }
  }

  const unique = [...new Set(allNames)];
  return unique.slice(offset, offset + count);
}

// ── Soup name generation (500+ unique names) ─────────────────────────────

function generateSoupNames(count: number, offset: number = 0): string[] {
  const allNames: string[] = [];

  const soupStyles = [
    "Soup", "Bisque", "Chowder", "Broth", "Velouté", "Potage",
    "Stew", "Gumbo", "Laksa", "Pho",
  ];

  const soupBases = [
    "Tomato", "Mushroom", "Chicken", "Beef", "Lentil", "Butternut Squash",
    "Pumpkin", "Leek and Potato", "Carrot and Coriander", "Broccoli and Stilton",
    "Pea and Mint", "Sweet Potato", "Cauliflower", "Roasted Red Pepper",
    "Courgette", "French Onion", "Celery", "Asparagus", "Corn", "Beetroot",
    "Parsnip", "Spinach", "Watercress", "Cabbage", "Coconut",
    "Crab", "Lobster", "Prawn", "Clam", "Fish",
    "Chickpea", "Black Bean", "White Bean", "Split Pea", "Miso",
    "Noodle", "Wonton", "Dumpling", "Oxtail", "Ham and Pea",
    "Sausage", "Bacon and Sweetcorn", "Turkey", "Duck", "Lamb",
    "Wild Garlic", "Roasted Garlic", "Fennel", "Artichoke",
  ];

  const soupCuisines = [
    "Italian", "French", "Thai", "Indian", "Japanese", "Chinese",
    "Mexican", "Moroccan", "Vietnamese", "Korean", "Turkish",
    "Hungarian", "Spanish", "Greek", "Caribbean",
  ];

  for (const base of soupBases) {
    for (const style of soupStyles) {
      allNames.push(`${base} ${style}`);
    }
  }

  for (const cuisine of soupCuisines) {
    for (const base of soupBases) {
      allNames.push(`${cuisine} ${base} Soup`);
    }
  }

  for (const base of soupBases.slice(0, 25)) {
    allNames.push(`Cream of ${base} Soup`);
  }

  for (const base of soupBases.slice(0, 25)) {
    allNames.push(`Roasted ${base} Soup`);
  }

  for (const base of soupBases.slice(0, 25)) {
    allNames.push(`Spiced ${base} Soup`);
  }

  const unique = [...new Set(allNames)];
  return unique.slice(offset, offset + count);
}

// ── Bread name generation (100+ unique names) ────────────────────────────

function generateBreadNames(count: number, offset: number = 0): string[] {
  const allNames: string[] = [];

  const breadTypes = [
    "Sourdough", "Focaccia", "Brioche", "Ciabatta", "Baguette",
    "Rye Bread", "Wholemeal Bread", "Soda Bread", "Flatbread", "Naan",
    "Pita", "Challah", "Cornbread", "Pumpernickel", "Bagels",
    "Rolls", "Buns", "English Muffins", "Crumpets", "Breadsticks",
  ];

  const breadFlavours = [
    "Rosemary and Sea Salt", "Olive", "Garlic", "Sun-Dried Tomato",
    "Cheese", "Onion", "Seeded", "Walnut", "Cranberry and Walnut",
    "Cinnamon and Raisin", "Honey and Oat", "Herb", "Chilli",
    "Parmesan", "Pesto", "Beetroot", "Turmeric", "Charcoal",
    "Saffron", "Caraway",
  ];

  for (const type of breadTypes) {
    allNames.push(type);
  }

  for (const flavour of breadFlavours) {
    for (const type of breadTypes) {
      allNames.push(`${flavour} ${type}`);
    }
  }

  const classicBreads = [
    "Tiger Bread", "Cottage Loaf", "Bloomer", "Cob Loaf",
    "Pain de Campagne", "Fougasse", "Grissini", "Lavash", "Tortillas",
    "Chapati", "Paratha", "Pretzel", "Monkey Bread", "Pull-Apart Bread",
    "Banana Bread", "Beer Bread", "Damper", "Johnnycakes",
    "Injera", "Mantou",
  ];
  for (const bread of classicBreads) {
    allNames.push(bread);
  }

  const unique = [...new Set(allNames)];
  return unique.slice(offset, offset + count);
}

// ── Salad name generation (1,500+ unique names) ──────────────────────────

function generateSaladNames(count: number, offset: number = 0): string[] {
  const allNames: string[] = [];

  const saladCuisines = [
    "Greek", "Thai", "Mexican", "Japanese", "Italian", "Middle Eastern",
    "Vietnamese", "Korean", "Indian", "Moroccan", "French", "American",
    "Mediterranean", "Chinese", "Indonesian", "Hawaiian", "Turkish",
    "Lebanese", "Spanish", "Peruvian",
  ];

  const saladProteins = [
    "Chicken", "Grilled Chicken", "Crispy Chicken", "Salmon", "Tuna",
    "Prawn", "Steak", "Halloumi", "Goat Cheese", "Feta", "Mozzarella",
    "Tofu", "Chickpea", "Lentil", "Quinoa", "Black Bean",
    "Egg", "Bacon", "Duck", "Lamb", "Crab", "Lobster",
    "Tempeh", "Edamame", "Paneer",
  ];

  const saladDressings = [
    "Balsamic", "Ranch", "Caesar", "Tahini", "Lemon",
    "Honey Mustard", "Vinaigrette", "Miso", "Peanut",
    "Blue Cheese", "Greek", "Herb", "Citrus", "Sesame",
    "Chimichurri", "Harissa", "Pomegranate",
  ];

  const saladGreens = [
    "Caesar", "Garden", "Mixed Leaf", "Rocket", "Spinach", "Kale",
    "Romaine", "Iceberg", "Watercress", "Radicchio", "Endive",
    "Butter Lettuce", "Gem Lettuce", "Frisée", "Mesclun",
  ];

  const saladVegetables = [
    "Avocado", "Beetroot", "Sweet Potato", "Roasted Pepper", "Tomato",
    "Cucumber", "Corn", "Fennel", "Artichoke", "Asparagus",
    "Broccoli", "Cauliflower", "Carrot", "Radish", "Courgette",
    "Pumpkin", "Butternut Squash", "Green Bean", "Pea", "Mushroom",
  ];

  const saladStyles = [
    "Salad", "Slaw", "Bowl", "Grain Bowl", "Power Bowl",
    "Chopped Salad", "Tossed Salad", "Composed Salad",
  ];

  const classicSalads = [
    "Caesar Salad", "Nicoise Salad", "Cobb Salad", "Waldorf Salad",
    "Caprese Salad", "Greek Salad", "Fattoush", "Tabbouleh",
    "Panzanella", "Larb", "Som Tum", "Gado Gado",
    "Olivier Salad", "Potato Salad", "Coleslaw", "Pasta Salad",
    "Cous Cous Salad", "Rice Salad", "Noodle Salad", "Orzo Salad",
    "Pearl Barley Salad", "Bulgur Wheat Salad", "Grain Salad",
    "Watermelon Salad", "Mango Salad", "Papaya Salad",
    "Fennel and Orange Salad", "Pear and Walnut Salad",
    "Fig and Prosciutto Salad", "Peach and Burrata Salad",
  ];

  for (const salad of classicSalads) allNames.push(salad);

  for (const cuisine of saladCuisines) {
    for (const protein of saladProteins) {
      allNames.push(`${cuisine} ${protein} Salad`);
    }
  }

  for (const protein of saladProteins) {
    for (const veg of saladVegetables) {
      allNames.push(`${protein} and ${veg} Salad`);
    }
  }

  for (const dressing of saladDressings) {
    for (const green of saladGreens) {
      allNames.push(`${dressing} ${green} Salad`);
    }
  }

  for (const cuisine of saladCuisines.slice(0, 10)) {
    for (const veg of saladVegetables.slice(0, 10)) {
      for (const style of saladStyles.slice(0, 4)) {
        allNames.push(`${cuisine} ${veg} ${style}`);
      }
    }
  }

  for (const protein of saladProteins.slice(0, 15)) {
    for (const veg of saladVegetables.slice(0, 10)) {
      allNames.push(`Warm ${protein} and ${veg} Salad`);
    }
  }

  const unique = [...new Set(allNames)];
  return unique.slice(offset, offset + count);
}

// ── Curry name generation (700+ unique names) ─────────────────────────────

function generateCurryNames(count: number, offset: number = 0): string[] {
  const allNames: string[] = [];

  const curryStyles = [
    "Curry", "Masala", "Tikka Masala", "Korma", "Vindaloo",
    "Jalfrezi", "Madras", "Rogan Josh", "Bhuna", "Dopiaza",
    "Balti", "Dhansak", "Pathia", "Saag", "Keema",
  ];

  const thaiCurryStyles = [
    "Green Curry", "Red Curry", "Yellow Curry", "Massaman Curry",
    "Panang Curry", "Jungle Curry", "Khao Soi",
  ];

  const japaneseCurryStyles = [
    "Katsu Curry", "Japanese Curry", "Curry Udon", "Curry Rice",
  ];

  const otherRegionalCurries = [
    "Rendang", "Laksa", "Cape Malay Curry", "Bunny Chow",
    "Trinidadian Curry", "Jamaican Curry", "Burmese Curry",
    "Sri Lankan Curry", "Malaysian Curry", "Singaporean Curry",
    "Indonesian Curry", "Filipino Curry", "Durban Curry",
  ];

  const curryProteins = [
    "Chicken", "Lamb", "Beef", "Prawn", "Fish", "Pork",
    "Goat", "Duck", "Turkey", "Tofu", "Paneer", "Chickpea",
    "Lentil", "Mushroom", "Egg", "Aubergine", "Sweet Potato",
    "Cauliflower", "Spinach", "Mixed Vegetable", "Kidney Bean",
    "Butternut Squash",
  ];

  const curryExtras = [
    "and Spinach", "and Potato", "and Coconut", "and Lentil",
    "and Chickpea", "and Rice", "and Naan",
  ];

  for (const protein of curryProteins) {
    for (const style of curryStyles) {
      allNames.push(`${protein} ${style}`);
    }
  }

  for (const protein of curryProteins.slice(0, 15)) {
    for (const style of thaiCurryStyles) {
      allNames.push(`${protein} ${style}`);
    }
  }

  for (const protein of curryProteins.slice(0, 10)) {
    for (const style of japaneseCurryStyles) {
      allNames.push(`${protein} ${style}`);
    }
  }

  for (const protein of curryProteins.slice(0, 12)) {
    for (const regional of otherRegionalCurries) {
      allNames.push(`${protein} ${regional}`);
    }
  }

  for (const protein of curryProteins.slice(0, 12)) {
    for (const extra of curryExtras) {
      allNames.push(`${protein} Curry ${extra}`);
    }
  }

  const classicCurries = [
    "Butter Chicken", "Chicken Tikka Masala", "Lamb Rogan Josh",
    "Beef Rendang", "Thai Green Curry", "Thai Red Curry",
    "Massaman Curry", "Chana Masala", "Dal Makhani", "Dal Tadka",
    "Palak Paneer", "Aloo Gobi", "Malai Kofta", "Matar Paneer",
    "Biryani Curry", "Kadai Chicken", "Chettinad Chicken",
    "Goan Fish Curry", "Kerala Fish Curry", "Malabar Prawn Curry",
    "Saag Aloo", "Baingan Bharta", "Navratan Korma",
  ];
  for (const curry of classicCurries) allNames.push(curry);

  const unique = [...new Set(allNames)];
  return unique.slice(offset, offset + count);
}

// ── Asian dish name generation (12k+ unique names) ────────────────────────

function generateAsianDishNames(count: number, offset: number = 0): string[] {
  const allNames: string[] = [];

  const asianCuisines = [
    "Chinese", "Japanese", "Korean", "Thai", "Vietnamese",
    "Indonesian", "Malaysian", "Singaporean", "Filipino",
    "Burmese", "Taiwanese", "Cantonese", "Sichuan", "Hunan",
  ];

  const asianProteins = [
    "Chicken", "Beef", "Pork", "Lamb", "Duck", "Salmon", "Tuna",
    "Prawn", "Shrimp", "Squid", "Crab", "Scallop", "Fish",
    "Tofu", "Tempeh", "Egg", "Pork Belly", "Ribs",
    "Mussels", "Clams", "Octopus", "Eel",
  ];

  const asianDishTypes = [
    "Stir Fry", "Fried Rice", "Noodles", "Ramen", "Pho",
    "Dumplings", "Spring Rolls", "Bao Buns", "Curry",
    "Laksa", "Pad Thai", "Satay", "Teriyaki", "Katsu",
    "Bibimbap", "Gyoza", "Tempura", "Udon", "Soba",
    "Congee", "Hot Pot", "Soup", "Salad", "Bowl",
    "Rice Bowl", "Noodle Soup", "Lettuce Wraps", "Skewers",
    "Pancakes", "Omelette", "Donburi",
  ];

  const asianFlavours = [
    "Sesame", "Ginger", "Garlic", "Chilli", "Soy", "Miso",
    "Teriyaki", "Sweet and Sour", "Black Bean", "Oyster Sauce",
    "Hoisin", "Szechuan", "Lemongrass", "Coconut", "Peanut",
    "Sriracha", "Gochujang", "Wasabi", "Yuzu", "Ponzu",
    "Five Spice", "XO Sauce", "Sambal", "Tamarind", "Fish Sauce",
    "Lime and Chilli", "Honey and Soy", "Kung Pao", "Bulgogi",
  ];

  const classicAsianDishes = [
    "Kung Pao Chicken", "General Tso's Chicken", "Orange Chicken",
    "Peking Duck", "Char Siu Pork", "Mapo Tofu", "Dan Dan Noodles",
    "Wonton Soup", "Egg Drop Soup", "Hot and Sour Soup",
    "Chow Mein", "Lo Mein", "Chop Suey", "Moo Shu Pork",
    "Mongolian Beef", "Beef and Broccoli", "Sweet and Sour Pork",
    "Crispy Aromatic Duck", "Salt and Pepper Squid",
    "Sushi Bowl", "Poke Bowl", "Chirashi Don",
    "Tonkotsu Ramen", "Shoyu Ramen", "Miso Ramen",
    "Yakitori", "Takoyaki", "Okonomiyaki", "Teppanyaki",
    "Chicken Katsu", "Tonkatsu", "Karaage", "Unagi Don",
    "Kimchi Jjigae", "Japchae", "Tteokbokki", "Galbi",
    "Samgyeopsal", "Bulgogi", "Kimchi Fried Rice",
    "Pad Thai", "Pad See Ew", "Tom Yum Soup", "Tom Kha Gai",
    "Som Tum", "Massaman Curry", "Green Papaya Salad",
    "Banh Mi", "Pho Bo", "Pho Ga", "Bun Cha", "Goi Cuon",
    "Nasi Goreng", "Mie Goreng", "Satay Chicken", "Gado Gado",
    "Nasi Lemak", "Laksa", "Char Kway Teow", "Hainanese Chicken Rice",
    "Rendang", "Lumpia", "Adobo", "Sinigang",
    "Mohinga", "Tea Leaf Salad", "Oyster Omelette",
    "Beef Pho", "Bun Bo Hue", "Xiao Long Bao", "Siu Mai",
    "Har Gow", "Turnip Cake", "Congee with Century Egg",
    "Clay Pot Rice", "Steamed Fish with Ginger",
  ];

  const asianVegetables = [
    "Pak Choi", "Bean Sprout", "Edamame", "Bamboo Shoot",
    "Lotus Root", "Daikon", "Water Chestnut", "Shiitake Mushroom",
    "Enoki Mushroom", "Chinese Broccoli", "Morning Glory",
    "Snow Pea", "Sugar Snap Pea", "Baby Corn", "Aubergine",
    "Green Bean", "Bok Choy", "Napa Cabbage", "Kimchi",
    "Seaweed", "Wakame",
  ];

  for (const dish of classicAsianDishes) allNames.push(dish);

  for (const cuisine of asianCuisines) {
    for (const protein of asianProteins) {
      for (const dish of asianDishTypes) {
        allNames.push(`${cuisine} ${protein} ${dish}`);
      }
    }
  }

  for (const flavour of asianFlavours) {
    for (const protein of asianProteins) {
      for (const dish of asianDishTypes.slice(0, 15)) {
        allNames.push(`${flavour} ${protein} ${dish}`);
      }
    }
  }

  for (const cuisine of asianCuisines.slice(0, 8)) {
    for (const veg of asianVegetables) {
      for (const dish of asianDishTypes.slice(0, 10)) {
        allNames.push(`${cuisine} ${veg} ${dish}`);
      }
    }
  }

  for (const flavour of asianFlavours.slice(0, 15)) {
    for (const veg of asianVegetables) {
      allNames.push(`${flavour} ${veg} Stir Fry`);
    }
  }

  const unique = [...new Set(allNames)];
  return unique.slice(offset, offset + count);
}

// ── Recipe generation ─────────────────────────────────────────────────────

interface GeneratedRecipe {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: {
    name: string;
    quantity: string;
    unit: string | null;
    notes: string | null;
  }[];
  steps: {
    instruction: string;
    tipText: string | null;
  }[];
  dietaryTags: string[];
  categories: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
}

const RECIPE_PROMPT = (dishName: string) =>
  `Write an original recipe for "${dishName}". Return ONLY valid JSON with this exact structure, no other text. Do not wrap the JSON in code fences or markdown.

{
  "title": "Recipe Title",
  "description": "A 1-2 sentence appetising description of the dish.",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "difficulty": "Easy",
  "ingredients": [
    {"name": "ingredient name", "quantity": "2", "unit": "cups", "notes": "diced"}
  ],
  "steps": [
    {"instruction": "Step instruction here.", "tipText": "Optional helpful tip or null"}
  ],
  "dietaryTags": ["Vegan", "Gluten-Free"],
  "categories": ["Dinner"],
  "nutrition": {"calories": 450, "protein": 25.0, "carbs": 55.0, "fat": 12.0, "fiber": 6.0, "sugar": 8.0}
}

Rules:
- difficulty must be "Easy", "Medium", or "Hard"
- dietaryTags can include: Vegan, Vegetarian, Gluten-Free, Dairy-Free, Nut-Free (only if truly applicable)
- categories can include: Breakfast, Lunch, Dinner, Desserts, Snacks, Sides, Baking, Drinks
- prepTime and cookTime in minutes
- Write genuinely original instructions in your own words
- Use simple, round quantities — e.g. "400" ml not "473.18" ml, "200" g not "226.8" g. Never use decimal places in quantities
- Use metric units (g, ml, kg, L) with round numbers. Do NOT convert from US cups/oz — just write sensible metric amounts directly
- Include 6-15 ingredients and 4-10 steps
- unit can be null for items counted whole (e.g. "2 eggs")
- notes can be null if no preparation notes needed
- nutrition: estimate calories (int, kcal), protein, carbs, fat, fiber, sugar (floats, grams) PER SERVING`;

function repairJson(raw: string): string {
  const stripped = raw.replace(/[\x00-\x1F\x7F]/g, (ch) =>
    ch === "\n" || ch === "\r" || ch === "\t" ? ch : ""
  );
  try {
    return jsonrepair(stripped);
  } catch {
    return stripped.replace(/,\s*([}\]])/g, "$1");
  }
}

function parseRecipeJson(text: string, dishName: string): GeneratedRecipe {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in response for "${dishName}"`);
  }

  const cleaned = repairJson(jsonMatch[0]);

  let parsed: GeneratedRecipe;
  try {
    parsed = JSON.parse(cleaned) as GeneratedRecipe;
  } catch (err) {
    throw new Error(
      `Malformed JSON for "${dishName}": ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!parsed.title || !parsed.ingredients?.length || !parsed.steps?.length) {
    throw new Error(`Invalid recipe data for "${dishName}"`);
  }

  // Coerce numeric quantities to strings and round overly precise values
  for (const ing of parsed.ingredients) {
    ing.quantity = String(ing.quantity ?? "");
    const num = parseFloat(ing.quantity);
    if (!isNaN(num) && ing.quantity.includes(".")) {
      if (num >= 10) {
        ing.quantity = String(Math.round(num / 5) * 5 || 5);
      } else {
        ing.quantity = String(Math.round(num * 2) / 2 || 0.5);
      }
    }
  }

  return parsed;
}

async function ollamaChat(
  prompt: string,
  ollamaUrl: string,
  model: string
): Promise<string> {
  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.message?.content || "";
}

async function generateWithOllama(
  dishName: string,
  ollamaUrl: string,
  model: string
): Promise<GeneratedRecipe> {
  const text = await ollamaChat(RECIPE_PROMPT(dishName), ollamaUrl, model);

  try {
    return parseRecipeJson(text, dishName);
  } catch (firstErr) {
    console.warn(`  JSON parse failed, retrying with repair prompt...`);
    const repairPrompt = `The following text was supposed to be valid JSON for a recipe but contains errors. Return ONLY the corrected valid JSON, no other text, no code fences:\n\n${text}`;
    const repaired = await ollamaChat(repairPrompt, ollamaUrl, model);
    try {
      return parseRecipeJson(repaired, dishName);
    } catch {
      throw new Error(
        `Failed to generate valid JSON for "${dishName}" after retry. Original error: ${firstErr instanceof Error ? firstErr.message : String(firstErr)}`
      );
    }
  }
}

async function generateWithClaude(dishName: string): Promise<GeneratedRecipe> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic();

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: RECIPE_PROMPT(dishName) }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    return parseRecipeJson(text, dishName);
  } catch {
    const retry = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `The following JSON is invalid. Fix it and return ONLY the corrected JSON, nothing else:\n\n${text}`,
        },
      ],
    });
    const retryText = retry.content[0].type === "text" ? retry.content[0].text : "";
    return parseRecipeJson(retryText, dishName);
  }
}

// ── Save recipe to database ───────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function saveRecipe(
  db: PrismaClient,
  recipe: GeneratedRecipe,
  imageUrl: string,
  saveOpts: { imageStatus?: string; published?: boolean } = {}
): Promise<{ id: number; slug: string } | null> {
  try {
    let slug = slugify(recipe.title);

    const existing = await db.recipe.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Resolve dietary tag IDs
    const dietaryTagRecords = await Promise.all(
      recipe.dietaryTags.map((name) =>
        db.dietaryTag.findFirst({ where: { name: { equals: name } } })
      )
    );
    const validDietaryTagIds = dietaryTagRecords
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .map((t) => t.id);

    // Resolve category IDs
    const categoryRecords = await Promise.all(
      recipe.categories.map((name) =>
        db.category.findFirst({ where: { name: { equals: name } } })
      )
    );
    const validCategoryIds = categoryRecords
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .map((c) => c.id);

    // Upsert ingredients
    const ingredientData = await Promise.all(
      recipe.ingredients.map(async (ing, index) => {
        const ingredient = await db.ingredient.upsert({
          where: { name: ing.name.toLowerCase().trim() },
          update: {},
          create: { name: ing.name.toLowerCase().trim() },
        });
        return {
          ingredientId: ingredient.id,
          quantity: ing.quantity,
          unit: ing.unit || null,
          notes: ing.notes || null,
          orderIndex: index,
        };
      })
    );

    // Deduplicate ingredients
    const seen = new Set<number>();
    const uniqueIngredientData = ingredientData.filter((ing) => {
      if (seen.has(ing.ingredientId)) return false;
      seen.add(ing.ingredientId);
      return true;
    });

    const saved = await db.recipe.create({
      data: {
        slug,
        title: recipe.title,
        description: recipe.description,
        heroImage: imageUrl,
        source: "ai",
        imageStatus: saveOpts.imageStatus ?? "pending",
        published: saveOpts.published ?? false,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        ...(recipe.nutrition && {
          calories: recipe.nutrition.calories,
          protein: recipe.nutrition.protein,
          carbs: recipe.nutrition.carbs,
          fat: recipe.nutrition.fat,
          fiber: recipe.nutrition.fiber,
          sugar: recipe.nutrition.sugar,
          nutritionEstimatedAt: new Date(),
        }),
        ingredients: { create: uniqueIngredientData },
        steps: {
          create: recipe.steps
            .filter((step) => step.instruction)
            .map((step, index) => ({
              stepNumber: index + 1,
              instruction: step.instruction,
              tipText: step.tipText || null,
            })),
        },
        dietaryTags: {
          create: validDietaryTagIds.map((id) => ({ dietaryTagId: id })),
        },
        categories: {
          create: validCategoryIds.map((id) => ({ categoryId: id })),
        },
      },
    });

    return { id: saved.id, slug: saved.slug };
  } catch (error) {
    console.error(`Failed to save recipe "${recipe.title}":`, error);
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

// ── External (demand-driven) dish names ──────────────────────────────────

async function getExternalDishNames(
  db: PrismaClient,
  count: number
): Promise<string[]> {
  // Get high-popularity external recipes
  const external = await db.externalRecipe.findMany({
    where: {
      ratingCount: { not: null, gte: 10 },
      ratingValue: { not: null, gte: 3.5 },
    },
    select: { title: true, ratingCount: true, ratingValue: true },
    orderBy: { ratingCount: "desc" },
  });

  if (external.length === 0) {
    console.log("No external recipes found. Run the scraper first.");
    return [];
  }

  // Get existing internal recipe titles for dedup
  const existing = await db.recipe.findMany({
    where: { published: true },
    select: { title: true },
  });
  const existingTitleSets = existing.map((r) => titleWords(r.title));

  // Filter to external recipes with no close internal match
  const gaps: { title: string; score: number }[] = [];
  for (const ext of external) {
    const words = titleWords(ext.title);
    const hasDuplicate = existingTitleSets.some(
      (existing) => jaccard(words, existing) >= 0.4
    );
    if (!hasDuplicate) {
      gaps.push({
        title: ext.title,
        score: (ext.ratingCount ?? 0) * (ext.ratingValue ?? 0),
      });
    }
  }

  // Sort by popularity and return top N
  gaps.sort((a, b) => b.score - a.score);
  console.log(`Found ${gaps.length} external recipes not yet in our database`);
  return gaps.slice(0, count).map((g) => g.title);
}

// ── Duplicate checking ──────────────────────────────────────────────────

async function loadExistingTitleSets(
  db: PrismaClient
): Promise<Set<string>[]> {
  const existing = await db.recipe.findMany({
    select: { title: true },
  });
  return existing.map((r) => titleWords(r.title));
}

function isDuplicateTitle(
  candidateTitle: string,
  existingTitleSets: Set<string>[],
  threshold = 0.6
): boolean {
  const words = titleWords(candidateTitle);
  return existingTitleSets.some(
    (existing) => jaccard(words, existing) >= threshold
  );
}

async function main() {
  const opts = parseArgs();

  if (!opts.dbUrl) {
    console.error("ERROR: DATABASE_URL not set in .env and --db-url not provided");
    process.exit(1);
  }

  console.log(`Source: ${opts.source}`);
  console.log(`Category: ${opts.category}`);
  console.log(`Provider: ${opts.provider}`);
  if (opts.provider === "local") {
    console.log(`Ollama: ${opts.ollamaUrl} (model: ${opts.model})`);
  }

  const db = new PrismaClient({
    datasources: { db: { url: opts.dbUrl } },
  });

  try {
    // Use a separate offset key per category so they don't interfere
    const offsetKeys: Record<string, string> = {
      general: "generatorOffset",
      baking: "bakingGeneratorOffset",
      soups: "soupsGeneratorOffset",
      bread: "breadGeneratorOffset",
      salads: "saladsGeneratorOffset",
      curries: "curriesGeneratorOffset",
      asian: "asianGeneratorOffset",
    };
    const offsetKey = offsetKeys[opts.category] || "generatorOffset";

    // Get current offset
    let offset = opts.offset;
    if (offset === undefined) {
      const setting = await db.setting.findUnique({ where: { key: offsetKey } });
      offset = setting ? parseInt(setting.value, 10) : 0;
    }

    console.log(`Starting at offset ${offset}, generating ${opts.count} recipes\n`);

    let dishNames: string[];
    // Parallel array of source image filenames (for image-files mode); empty otherwise
    let imageFilenames: string[] = [];

    if (opts.source === "image-files") {
      if (!existsSync(opts.localImagesDir)) {
        console.error(`ERROR: --local-images-dir not found: ${opts.localImagesDir}`);
        process.exit(1);
      }
      const all = readdirSync(opts.localImagesDir)
        .filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f))
        .sort();
      const slice = all.slice(offset, offset + opts.count);
      imageFilenames = slice;
      dishNames = slice.map((f) => {
        const stem = f.replace(/\.[^.]+$/, "");
        return stem
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .replace(/\bAmp\b/g, "&")
          .replace(/\bWw\b/g, "WW");
      });
      console.log(`Using ${dishNames.length} image filenames as dish names (offset ${offset})`);
    } else if (opts.source === "external") {
      // Demand-driven: use popular external recipes not yet in our DB
      dishNames = await getExternalDishNames(db, opts.count);
    } else {
      // Combinatorial: use generated dish names
      const dishNameGenerators: Record<string, (count: number, offset: number) => string[]> = {
        general: generateDishNames,
        baking: generateBakingDishNames,
        soups: generateSoupNames,
        bread: generateBreadNames,
        salads: generateSaladNames,
        curries: generateCurryNames,
        asian: generateAsianDishNames,
      };
      const generator = dishNameGenerators[opts.category] || generateDishNames;
      dishNames = generator(opts.count, offset);
    }

    if (dishNames.length === 0) {
      console.log("No more dish names available.");
      return;
    }

    // Load existing titles for duplicate prevention
    const existingTitleSets = await loadExistingTitleSets(db);
    console.log(`Loaded ${existingTitleSets.length} existing recipes for duplicate checking`);

    if (opts.dryRun) {
      console.log(`\n[DRY RUN] Would generate ${dishNames.length} recipes:`);
      for (const name of dishNames.slice(0, 20)) {
        const dup = isDuplicateTitle(name, existingTitleSets);
        console.log(`  ${dup ? "[SKIP]" : "[  OK]"} ${name}`);
      }
      if (dishNames.length > 20) console.log(`  ... and ${dishNames.length - 20} more`);
      return;
    }

    const logPath = resolve(__dirname, "generated-recipes-log.jsonl");
    let success = 0;
    let failed = 0;

    // Local-images pool (shuffled, used set tracked across this run)
    let localImagePool: string[] = [];
    if (opts.localImages) {
      if (!existsSync(opts.localImagesDir)) {
        console.error(`ERROR: --local-images dir not found: ${opts.localImagesDir}`);
        process.exit(1);
      }
      const all = readdirSync(opts.localImagesDir).filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f));
      // Fisher-Yates shuffle
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      localImagePool = all;
      console.log(`Loaded ${localImagePool.length} local images from ${opts.localImagesDir}`);
    }

    for (let i = 0; i < dishNames.length; i++) {
      const dishName = dishNames[i];
      const currentOffset = offset + i;
      console.log(`[${i + 1}/${dishNames.length}] ${dishName}`);

      // Skip if a recipe with this slug already exists (crash-safe dedup)
      const expectedSlug = dishName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const alreadyExists = await db.recipe.findUnique({ where: { slug: expectedSlug } });
      if (alreadyExists) {
        console.log(`  Skipped (already exists: id=${alreadyExists.id})`);
        // Advance offset so we don't revisit this slot
        await db.setting.upsert({
          where: { key: offsetKey },
          update: { value: String(currentOffset + 1) },
          create: { key: offsetKey, value: String(currentOffset + 1) },
        });
        continue;
      }

      // Skip if title is too similar to an existing recipe (fuzzy dedup)
      if (isDuplicateTitle(dishName, existingTitleSets)) {
        console.log(`  Skipped (similar recipe already exists)`);
        await db.setting.upsert({
          where: { key: offsetKey },
          update: { value: String(currentOffset + 1) },
          create: { key: offsetKey, value: String(currentOffset + 1) },
        });
        continue;
      }

      try {
        const start = Date.now();

        let recipe: GeneratedRecipe;
        if (opts.provider === "local") {
          recipe = await generateWithOllama(dishName, opts.ollamaUrl, opts.model);
        } else {
          recipe = await generateWithClaude(dishName);
        }

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`  Generated "${recipe.title}" in ${elapsed}s`);

        let imageUrl: string;
        const saveOpts: { imageStatus?: string; published?: boolean } = {};

        // Pick image: in image-files mode, use the matching filename; otherwise random from pool
        let pickedFilename: string | null = null;
        if (opts.source === "image-files" && imageFilenames[i]) {
          pickedFilename = imageFilenames[i];
        } else if (opts.localImages && localImagePool.length > 0) {
          pickedFilename = localImagePool.pop()!;
        }

        if (pickedFilename) {
          const slug = slugify(recipe.title);
          const bucket = slug.slice(0, 2);
          const ext = pickedFilename.split(".").pop() || "webp";
          const destFilename = `${slug}.${ext}`;
          const destDir = resolve(__dirname, "..", "public", "images", "recipes", bucket);
          mkdirSync(destDir, { recursive: true });
          copyFileSync(resolve(opts.localImagesDir, pickedFilename), resolve(destDir, destFilename));
          imageUrl = `/images/recipes/${bucket}/${destFilename}`;
          saveOpts.imageStatus = "ready";
          saveOpts.published = opts.publish;
        } else {
          // Placeholder image — the image script will replace it
          const encoded = encodeURIComponent(recipe.title);
          imageUrl = `https://placehold.co/1200x1800/f59e0b/ffffff?text=${encoded}`;
          if (opts.publish) saveOpts.published = true;
        }

        const saved = await saveRecipe(db, recipe, imageUrl, saveOpts);
        if (saved) {
          console.log(`  Saved: id=${saved.id} slug=${saved.slug}`);
          success++;
          // Add to existing title sets so we don't generate duplicates in this batch
          existingTitleSets.push(titleWords(recipe.title));
        } else {
          console.log("  Failed to save to database");
          failed++;
        }

        // Update offset
        const newOffset = currentOffset + 1;
        await db.setting.upsert({
          where: { key: offsetKey },
          update: { value: String(newOffset) },
          create: { key: offsetKey, value: String(newOffset) },
        });

        // Log
        const logEntry = {
          timestamp: new Date().toISOString(),
          dishName,
          title: recipe.title,
          slug: saved?.slug,
          id: saved?.id,
          status: saved ? "success" : "save_failed",
          provider: opts.provider,
          model: opts.provider === "local" ? opts.model : "claude-haiku-4-5",
          generationTime: parseFloat(elapsed),
          offset: currentOffset,
        };
        appendFileSync(logPath, JSON.stringify(logEntry) + "\n");
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.log(`  ERROR: ${errMsg}`);
        failed++;

        const logEntry = {
          timestamp: new Date().toISOString(),
          dishName,
          status: "failed",
          error: errMsg,
          provider: opts.provider,
          offset: currentOffset,
        };
        appendFileSync(logPath, JSON.stringify(logEntry) + "\n");
      }
    }

    console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
    console.log(`Log: ${logPath}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
