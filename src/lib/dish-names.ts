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
 * Generate soup recipe names.
 * Combines soup styles, bases, and cuisines for 500+ unique names.
 */
export function generateSoupNames(
  count: number,
  offset: number = 0
): string[] {
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

  // Strategy 1: [Base] [Style] — e.g. "Tomato Soup", "Lobster Bisque"
  for (const base of soupBases) {
    for (const style of soupStyles) {
      allNames.push(`${base} ${style}`);
    }
  }

  // Strategy 2: [Cuisine] [Base] Soup — e.g. "Thai Coconut Soup"
  for (const cuisine of soupCuisines) {
    for (const base of soupBases) {
      allNames.push(`${cuisine} ${base} Soup`);
    }
  }

  // Strategy 3: Cream of [Base] Soup
  for (const base of soupBases.slice(0, 25)) {
    allNames.push(`Cream of ${base} Soup`);
  }

  // Strategy 4: Roasted [Base] Soup
  for (const base of soupBases.slice(0, 25)) {
    allNames.push(`Roasted ${base} Soup`);
  }

  // Strategy 5: Spiced [Base] Soup
  for (const base of soupBases.slice(0, 25)) {
    allNames.push(`Spiced ${base} Soup`);
  }

  const unique = [...new Set(allNames)];
  return unique.slice(offset, offset + count);
}

/**
 * Generate bread recipe names.
 * Combines bread types and flavours for 100+ unique names.
 */
export function generateBreadNames(
  count: number,
  offset: number = 0
): string[] {
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

  // Strategy 1: Plain bread types
  for (const type of breadTypes) {
    allNames.push(type);
  }

  // Strategy 2: [Flavour] [Bread Type]
  for (const flavour of breadFlavours) {
    for (const type of breadTypes) {
      allNames.push(`${flavour} ${type}`);
    }
  }

  // Strategy 3: Classic named breads
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

/**
 * Generate salad recipe names.
 * Combines salad styles, proteins, vegetables, dressings, and cuisines for 500+ unique names.
 */
export function generateSaladNames(
  count: number,
  offset: number = 0
): string[] {
  const allNames: string[] = [];

  const saladStyles = [
    "Salad", "Slaw", "Bowl", "Grain Bowl", "Power Bowl",
    "Chopped Salad", "Tossed Salad", "Composed Salad",
  ];

  const saladGreens = [
    "Caesar", "Garden", "Mixed Leaf", "Rocket", "Spinach", "Kale",
    "Romaine", "Iceberg", "Watercress", "Radicchio", "Endive",
    "Butter Lettuce", "Gem Lettuce", "Frisée", "Mesclun",
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

  const saladCuisines = [
    "Greek", "Thai", "Mexican", "Japanese", "Italian", "Middle Eastern",
    "Vietnamese", "Korean", "Indian", "Moroccan", "French", "American",
    "Mediterranean", "Chinese", "Indonesian", "Hawaiian", "Turkish",
    "Lebanese", "Spanish", "Peruvian",
  ];

  const saladVegetables = [
    "Avocado", "Beetroot", "Sweet Potato", "Roasted Pepper", "Tomato",
    "Cucumber", "Corn", "Fennel", "Artichoke", "Asparagus",
    "Broccoli", "Cauliflower", "Carrot", "Radish", "Courgette",
    "Pumpkin", "Butternut Squash", "Green Bean", "Pea", "Mushroom",
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

  // Strategy 1: Classic salads
  for (const salad of classicSalads) {
    allNames.push(salad);
  }

  // Strategy 2: [Cuisine] [Protein] Salad
  for (const cuisine of saladCuisines) {
    for (const protein of saladProteins) {
      allNames.push(`${cuisine} ${protein} Salad`);
    }
  }

  // Strategy 3: [Protein] and [Vegetable] Salad
  for (const protein of saladProteins) {
    for (const veg of saladVegetables) {
      allNames.push(`${protein} and ${veg} Salad`);
    }
  }

  // Strategy 4: [Dressing] [Greens] Salad
  for (const dressing of saladDressings) {
    for (const green of saladGreens) {
      allNames.push(`${dressing} ${green} Salad`);
    }
  }

  // Strategy 5: [Cuisine] [Vegetable] [Style]
  for (const cuisine of saladCuisines.slice(0, 10)) {
    for (const veg of saladVegetables.slice(0, 10)) {
      for (const style of saladStyles.slice(0, 4)) {
        allNames.push(`${cuisine} ${veg} ${style}`);
      }
    }
  }

  // Strategy 6: Warm [Protein] and [Vegetable] Salad
  for (const protein of saladProteins.slice(0, 15)) {
    for (const veg of saladVegetables.slice(0, 10)) {
      allNames.push(`Warm ${protein} and ${veg} Salad`);
    }
  }

  const unique = [...new Set(allNames)];
  return unique.slice(offset, offset + count);
}

/**
 * Generate curry recipe names.
 * Combines curry styles, proteins, and regional variations for 100+ unique names.
 */
export function generateCurryNames(
  count: number,
  offset: number = 0
): string[] {
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

  // Strategy 1: [Protein] [Indian Style]
  for (const protein of curryProteins) {
    for (const style of curryStyles) {
      allNames.push(`${protein} ${style}`);
    }
  }

  // Strategy 2: Thai curries with protein
  for (const protein of curryProteins.slice(0, 15)) {
    for (const style of thaiCurryStyles) {
      allNames.push(`${protein} ${style}`);
    }
  }

  // Strategy 3: Japanese curries
  for (const protein of curryProteins.slice(0, 10)) {
    for (const style of japaneseCurryStyles) {
      allNames.push(`${protein} ${style}`);
    }
  }

  // Strategy 4: Regional curries with protein
  for (const protein of curryProteins.slice(0, 12)) {
    for (const regional of otherRegionalCurries) {
      allNames.push(`${protein} ${regional}`);
    }
  }

  // Strategy 5: [Protein] Curry with [Extra]
  for (const protein of curryProteins.slice(0, 12)) {
    for (const extra of curryExtras) {
      allNames.push(`${protein} Curry ${extra}`);
    }
  }

  // Strategy 6: Classic named curries
  const classicCurries = [
    "Butter Chicken", "Chicken Tikka Masala", "Lamb Rogan Josh",
    "Beef Rendang", "Thai Green Curry", "Thai Red Curry",
    "Massaman Curry", "Chana Masala", "Dal Makhani", "Dal Tadka",
    "Palak Paneer", "Aloo Gobi", "Malai Kofta", "Matar Paneer",
    "Biryani Curry", "Kadai Chicken", "Chettinad Chicken",
    "Goan Fish Curry", "Kerala Fish Curry", "Malabar Prawn Curry",
    "Saag Aloo", "Baingan Bharta", "Navratan Korma",
  ];
  for (const curry of classicCurries) {
    allNames.push(curry);
  }

  const unique = [...new Set(allNames)];
  return unique.slice(offset, offset + count);
}

/**
 * Generate Asian dish recipe names.
 * Combines cuisines, dish types, proteins, and cooking styles for 1000+ unique names.
 */
export function generateAsianDishNames(
  count: number,
  offset: number = 0
): string[] {
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

  // Strategy 1: Classic dishes
  for (const dish of classicAsianDishes) {
    allNames.push(dish);
  }

  // Strategy 2: [Cuisine] [Protein] [Dish Type]
  for (const cuisine of asianCuisines) {
    for (const protein of asianProteins) {
      for (const dish of asianDishTypes) {
        allNames.push(`${cuisine} ${protein} ${dish}`);
      }
    }
  }

  // Strategy 3: [Flavour] [Protein] [Dish Type]
  for (const flavour of asianFlavours) {
    for (const protein of asianProteins) {
      for (const dish of asianDishTypes.slice(0, 15)) {
        allNames.push(`${flavour} ${protein} ${dish}`);
      }
    }
  }

  // Strategy 4: [Cuisine] [Vegetable] [Dish Type] (vegetarian)
  for (const cuisine of asianCuisines.slice(0, 8)) {
    for (const veg of asianVegetables) {
      for (const dish of asianDishTypes.slice(0, 10)) {
        allNames.push(`${cuisine} ${veg} ${dish}`);
      }
    }
  }

  // Strategy 5: [Flavour] [Vegetable] Stir Fry
  for (const flavour of asianFlavours.slice(0, 15)) {
    for (const veg of asianVegetables) {
      allNames.push(`${flavour} ${veg} Stir Fry`);
    }
  }

  const unique = [...new Set(allNames)];
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
