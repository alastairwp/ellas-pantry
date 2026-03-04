/**
 * Programmatic dish name generator.
 * Combines cuisines, proteins, cooking methods, vegetables, and dish types
 * to produce 100,000+ unique recipe names.
 */

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

const sides = [
  "Coleslaw", "Potato Salad", "Rice Pilaf", "Cornbread", "Garlic Bread",
  "Bruschetta", "Hummus", "Guacamole", "Salsa", "Tzatziki", "Raita",
  "Naan Bread", "Focaccia", "Grissini", "Polenta", "Couscous",
  "Tabbouleh", "Fattoush", "Waldorf Salad", "Caesar Salad",
  "Dauphinoise Potatoes", "Hasselback Potatoes", "Roast Potatoes",
  "Mashed Potatoes", "Chips", "Wedges", "Onion Rings", "Tempura",
  "Slaw", "Pickled Vegetables",
];

const snacks = [
  "Hummus", "Trail Mix", "Popcorn", "Crisps", "Crackers",
  "Bruschetta", "Crostini", "Stuffed Mushrooms", "Devilled Eggs",
  "Cheese Straws", "Sausage Rolls", "Scotch Eggs", "Pakoras",
  "Bhajis", "Arancini", "Mini Quiches", "Blinis", "Canapes",
  "Pita Chips", "Edamame Beans", "Roasted Chickpeas", "Granola Bars",
  "Energy Balls", "Cheese Board", "Antipasti",
];

/**
 * Generate a batch of unique dish names.
 * Uses different combination strategies to produce varied recipe names.
 */
export function generateDishNames(
  count: number,
  offset: number = 0
): string[] {
  const allNames: string[] = [];

  // Strategy 1: [Cooking Method] [Protein] with [Vegetable]
  // ~28 * 51 * 45 = ~64,260 combinations
  for (const method of cookingMethods) {
    for (const protein of proteins) {
      for (const veg of vegetables) {
        allNames.push(`${method} ${protein} with ${veg}`);
      }
    }
  }

  // Strategy 2: [Cuisine] [Protein] [Dish Type]
  // ~50 * 51 * 68 = ~173,400 combinations
  for (const cuisine of cuisines) {
    for (const protein of proteins) {
      for (const dish of dishTypes) {
        allNames.push(`${cuisine} ${protein} ${dish}`);
      }
    }
  }

  // Strategy 3: [Flavour] [Protein] [Dish Type]
  // ~48 * 51 * 68 = ~166,464 combinations
  for (const flavour of flavourProfiles) {
    for (const protein of proteins) {
      for (const dish of dishTypes) {
        allNames.push(`${flavour} ${protein} ${dish}`);
      }
    }
  }

  // Strategy 4: [Cuisine] [Vegetable] [Dish Type] (vegetarian)
  // ~50 * 45 * 68 = ~153,000 combinations
  for (const cuisine of cuisines) {
    for (const veg of vegetables) {
      for (const dish of dishTypes) {
        allNames.push(`${cuisine} ${veg} ${dish}`);
      }
    }
  }

  // Strategy 5: [Dessert Flavour] [Dessert]
  // ~47 * 45 = ~2,115 combinations
  for (const flavour of dessertFlavours) {
    for (const dessert of desserts) {
      allNames.push(`${flavour} ${dessert}`);
    }
  }

  // Strategy 6: [Cuisine] [Dessert Flavour] [Dessert]
  // ~50 * 47 * 45 = ~105,750 combinations (sample subset)
  for (const cuisine of cuisines) {
    for (const flavour of dessertFlavours) {
      for (const dessert of desserts) {
        allNames.push(`${cuisine}-Style ${flavour} ${dessert}`);
      }
    }
  }

  // Strategy 7: Breakfast variations
  for (const cuisine of cuisines) {
    for (const dish of breakfastDishes) {
      allNames.push(`${cuisine} ${dish}`);
    }
  }

  // Strategy 8: [Flavour] [Vegetable] sides
  for (const flavour of flavourProfiles) {
    for (const veg of vegetables) {
      allNames.push(`${flavour} ${veg}`);
    }
  }

  // Strategy 9: Drinks
  for (const flavour of dessertFlavours) {
    for (const drink of drinks) {
      allNames.push(`${flavour} ${drink}`);
    }
  }

  // Strategy 10: [Cooking Method] [Vegetable] with [Flavour]
  for (const method of cookingMethods) {
    for (const veg of vegetables) {
      for (const flavour of flavourProfiles.slice(0, 15)) {
        allNames.push(`${method} ${veg} with ${flavour}`);
      }
    }
  }

  // Deduplicate
  const unique = [...new Set(allNames)];

  // Return requested slice
  return unique.slice(offset, offset + count);
}

/**
 * Get the total number of available unique dish names.
 */
export function getTotalDishNames(): number {
  // Calculate without generating (approximate)
  return generateDishNames(1, 0).length; // This is inefficient, see below
}

/**
 * Get total count efficiently by generating all names once.
 */
let _cachedTotal: number | null = null;
export function getDishNameCount(): number {
  if (_cachedTotal !== null) return _cachedTotal;
  // Generate a large batch to count uniques
  const all = generateDishNames(999999, 0);
  _cachedTotal = all.length;
  return _cachedTotal;
}
