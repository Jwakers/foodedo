import type {
  ComplexityTier,
  Cuisine,
  PreparationOption,
  PrimaryProtein,
  RecipeCategory,
  RecipeSource,
  Unit,
} from "./constants";

/** Ingredient shape for system recipe seed (matches recipes table, no ingredientId). */
type SystemRecipeIngredient = {
  name: string;
  amount?: number;
  unit?: Unit;
  preparation?: PreparationOption;
};

/** Method step shape for system recipe seed (matches recipes table). */
type SystemRecipeMethodStep = {
  title: string;
  description?: string;
};

/** Nutrition shape for system recipe seed (matches recipes table). */
type SystemRecipeNutrition = {
  calories?: number;
  protein?: number;
  fat?: number;
  carbohydrates?: number;
};

/** System recipe seed: schema-aligned type for SYSTEM_RECIPES (no circular ref). _id is string; migration casts to Id<"recipes">. */
export type SystemRecipeSeed = {
  _id: string;
  _creationTime: number;
  title: string;
  prepTime: number;
  serves: number;
  category: RecipeCategory;
  updatedAt: number;
  description?: string;
  cookTime?: number;
  ingredients?: SystemRecipeIngredient[];
  method?: SystemRecipeMethodStep[];
  nutrition?: SystemRecipeNutrition;
  source?: RecipeSource;
  primaryProtein?: PrimaryProtein;
  complexityTier?: ComplexityTier;
  cuisine?: Cuisine[];
  totalTimeMinutes?: number;
  isGeneratorEligible?: boolean;
  /** Optional stable public URL segment; otherwise derived from title in migration. */
  publicSlug?: string;
  /** In seed file this is a URL string; not used by migration (image left unchanged). */
  image?: string;
};

export const SYSTEM_RECIPES: SystemRecipeSeed[] = [
  {
    _creationTime: 1771344763633.521,
    _id: "j9702hkfkdfe65sjy78n23qdkd81bj83",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["other"],
    description:
      "Rich, creamy stroganoff with tender beef and mushrooms over silky egg noodles.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/68ff72fa-6ba3-4d34-820c-fd7230c7a1d3",
    ingredients: [
      {
        amount: 500,
        name: "beef sirloin",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 200,
        name: "mushrooms",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 250, name: "beef stock", unit: "ml" },
      { amount: 150, name: "sour cream", unit: "ml" },
      { amount: 300, name: "egg noodles", unit: "g" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      {
        amount: 1,
        name: "parsley",
        preparation: "chopped",
        unit: "bunch",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Boil the egg noodles according to package instructions, then drain and set aside.",
        title: "Cook the noodles",
      },
      {
        description:
          "Season the beef with salt and pepper. Heat 1 tbsp olive oil in a large frying pan over medium-high heat and sauté the sliced beef in a single layer until browned. Remove and set aside—don’t crowd the pan or the beef will steam.",
        title: "Sauté the beef",
      },
      {
        description:
          "In the same pan, add the remaining oil, then the onion, garlic, and mushrooms. Cook until softened and any mushroom liquid has evaporated.",
        title: "Cook the vegetables",
      },
      {
        description:
          "Return the beef and any resting juices to the pan. Pour in the beef stock and scrape up any browned bits (deglazing adds flavour). Simmer for 5 minutes, then turn off the heat and stir in the sour cream. Warm through without boiling so the cream doesn’t split.",
        title: "Combine and simmer",
      },
      {
        description:
          "Serve the stroganoff over the egg noodles and garnish with parsley.",
        title: "Serve",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 60,
      fat: 30,
      protein: 40,
    },
    prepTime: 10,
    primaryProtein: "beef",
    serves: 4,
    source: "system",
    title: "Beef Stroganoff",
    totalTimeMinutes: 30,
    updatedAt: 1771362344447,
  },
  {
    _creationTime: 1771344763633.5212,
    _id: "j97d2jxt0rw4bbxxt4jbzbjjt981b42a",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["mexican"],
    description:
      "Spiced beef in soft tortillas with fresh toppings and a hit of lime.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/f5f90de6-0f0c-451b-adc5-f303c2770dc8",
    ingredients: [
      { amount: 500, name: "minced beef", unit: "g" },
      { amount: 2, name: "taco seasoning", unit: "tbsp" },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 1,
        name: "red pepper",
        preparation: "diced",
        unit: "whole",
      },
      { amount: 8, name: "tortillas", unit: "piece" },
      {
        amount: 100,
        name: "lettuce",
        preparation: "shredded",
        unit: "g",
      },
      {
        amount: 2,
        name: "tomato",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 100,
        name: "cheddar cheese",
        preparation: "grated",
        unit: "g",
      },
      { amount: 100, name: "sour cream", unit: "ml" },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "In a pan, heat olive oil and sauté the onion until soft. Add minced beef and cook until browned. Stir in taco seasoning.",
        title: "Cook the beef",
      },
      {
        description: "Chop the lettuce, tomatoes, and red pepper.",
        title: "Prepare toppings",
      },
      {
        description:
          "Warm the tortillas and fill with the beef mixture, then top with lettuce, tomatoes, cheese, and sour cream.",
        title: "Assemble tacos",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 40,
      fat: 25,
      protein: 35,
    },
    prepTime: 15,
    primaryProtein: "beef",
    serves: 4,
    source: "system",
    title: "Beef Tacos",
    totalTimeMinutes: 30,
    updatedAt: 1771362677168,
  },
  {
    _creationTime: 1771344763633.5215,
    _id: "j975ey2p5qppch25571d84m34981btc9",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["chinese"],
    description:
      "Tender beef and crisp broccoli in a savoury soy glaze, served over steamed rice.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/a73c2d5e-f6f1-4d8a-9eee-96417906a819",
    ingredients: [
      {
        amount: 500,
        name: "beef flank steak",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 300,
        name: "broccoli",
        preparation: "chopped",
        unit: "g",
      },
      { amount: 60, name: "soy sauce", unit: "ml" },
      {
        amount: 1,
        name: "ginger",
        preparation: "grated",
        unit: "piece",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 300, name: "rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions (or 2:1 water to rice, simmer covered 15–18 minutes). Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "Heat 1 tbsp vegetable oil in a wok or large frying pan over high heat. Add the beef in a single layer and stir-fry until browned. Remove and set aside.",
        title: "Stir-fry the beef",
      },
      {
        description:
          "Add the remaining oil to the wok. Stir-fry the garlic and ginger for 30 seconds, then add the broccoli and a splash of water. Cover briefly if needed until the broccoli is tender-crisp.",
        title: "Cook the vegetables",
      },
      {
        description:
          "Return the beef to the wok, add the soy sauce, and toss for 1 minute. Serve over the cooked rice.",
        title: "Combine and serve",
      },
    ],
    nutrition: {
      calories: 480,
      carbohydrates: 45,
      fat: 20,
      protein: 38,
    },
    prepTime: 10,
    primaryProtein: "beef",
    serves: 4,
    source: "system",
    title: "Beef and Broccoli Stir-Fry",
    totalTimeMinutes: 25,
    updatedAt: 1771362695384,
  },
  {
    _creationTime: 1771344763633.5217,
    _id: "j97e6ws381hxex2rq2y0r857j581bq6t",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 30,
    cuisine: ["italian"],
    description:
      "Juicy beef meatballs simmered in a rich tomato sauce served with spaghetti.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/f07758c9-3256-4b60-9c40-192c6f0476ab",
    ingredients: [
      { amount: 500, name: "minced beef", unit: "g" },
      { amount: 100, name: "bread crumbs", unit: "g" },
      {
        amount: 1,
        name: "egg",
        preparation: "beaten",
        unit: "whole",
      },
      {
        amount: 50,
        name: "parmesan cheese",
        preparation: "grated",
        unit: "g",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      { amount: 400, name: "tomato sauce", unit: "ml" },
      { amount: 300, name: "spaghetti", unit: "g" },
      { amount: 1, name: "olive oil", unit: "tbsp" },
      {
        amount: 1,
        name: "basil",
        preparation: "chopped",
        unit: "bunch",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "In a bowl, combine minced beef, bread crumbs, beaten egg, parmesan, garlic, and onion. Form into meatballs.",
        title: "Make meatballs",
      },
      {
        description:
          "In a pan, heat olive oil and brown the meatballs. Add tomato sauce and simmer for 20 minutes.",
        title: "Cook meatballs",
      },
      {
        description:
          "Cook spaghetti according to package instructions, then drain.",
        title: "Cook spaghetti",
      },
      {
        description: "Serve meatballs over spaghetti and garnish with basil.",
        title: "Serve",
      },
    ],
    nutrition: {
      calories: 700,
      carbohydrates: 60,
      fat: 25,
      protein: 45,
    },
    prepTime: 15,
    primaryProtein: "beef",
    serves: 4,
    source: "system",
    title: "Italian Beef Meatballs",
    totalTimeMinutes: 45,
    updatedAt: 1771362713989,
  },
  {
    _creationTime: 1771344763633.522,
    _id: "j97acvh21h10jrt349vwj4f9nx81b0sj",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 30,
    cuisine: ["british"],
    description:
      "A simple one-pan beef and vegetable traybake, perfect for busy evenings.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/a39ea4b1-921e-44e0-93a8-63d046e221bf",
    ingredients: [
      {
        amount: 500,
        name: "beef stew meat",
        preparation: "cubed",
        unit: "g",
      },
      {
        amount: 200,
        name: "carrots",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 300,
        name: "potatoes",
        preparation: "cubed",
        unit: "g",
      },
      {
        amount: 1,
        name: "red onion",
        preparation: "quartered",
        unit: "whole",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 1, name: "mixed herbs", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description: "Preheat the oven to 200°C (180°C fan).",
        title: "Preheat oven",
      },
      {
        description:
          "In a large bowl, combine beef, carrots, potatoes, red onion, olive oil, mixed herbs, salt, and pepper.",
        title: "Prepare ingredients",
      },
      {
        description:
          "Spread the mixture onto a baking tray and bake for 30 minutes, or until the beef is cooked and vegetables are tender.",
        title: "Bake",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 45,
      fat: 25,
      protein: 40,
    },
    prepTime: 10,
    primaryProtein: "beef",
    serves: 4,
    source: "system",
    title: "Beef and Vegetable Traybake",
    totalTimeMinutes: 40,
    updatedAt: 1771362731883,
  },
  {
    _creationTime: 1771344763633.5222,
    _id: "j97dxn8afv7f9mrtj0h9tr556x81beqn",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["chinese"],
    description:
      "A quick and colorful stir-fry with tender strips of beef and fresh vegetables, served over rice.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/bf9a6eac-483c-4557-994f-ef84b0d729d4",
    ingredients: [
      {
        amount: 500,
        name: "beef sirloin",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "carrot",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 200,
        name: "broccoli",
        preparation: "chopped",
        unit: "g",
      },
      { amount: 60, name: "soy sauce", unit: "ml" },
      { amount: 250, name: "rice", unit: "g" },
      {
        amount: 2,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      {
        amount: 10,
        name: "ginger",
        preparation: "grated",
        unit: "g",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description: "Prepare rice according to package instructions.",
        title: "Cook the rice",
      },
      {
        description:
          "Heat 1 tbsp oil in a wok or large frying pan over high heat. Add the beef in a single layer and stir-fry until browned. Remove and set aside.",
        title: "Stir-fry the beef",
      },
      {
        description:
          "Add the remaining oil, then the garlic, ginger, bell pepper, carrot, and broccoli. Stir-fry until the vegetables are tender but still crisp.",
        title: "Cook the vegetables",
      },
      {
        description:
          "Return the beef to the pan, add the soy sauce, and toss to combine. Serve over the cooked rice.",
        title: "Combine and serve",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 60,
      fat: 15,
      protein: 40,
    },
    prepTime: 15,
    primaryProtein: "beef",
    serves: 4,
    source: "system",
    title: "Beef and Vegetable Stir-Fry",
    totalTimeMinutes: 30,
    updatedAt: 1771362748816,
  },
  {
    _creationTime: 1771344763633.5225,
    _id: "j97cctqmfbpnqgaghksny4n7e981ah9h",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 40,
    cuisine: ["italian"],
    description:
      "A classic Italian meat sauce, rich and hearty, perfect for spaghetti or any pasta.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/27f3e481-c720-47b5-aa34-1786860e2c5a",
    ingredients: [
      { amount: 500, name: "minced beef", unit: "g" },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 1,
        name: "carrot",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 1,
        name: "celery",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 400, name: "canned tomatoes", unit: "g" },
      { amount: 2, name: "tomato purée", unit: "tbsp" },
      { amount: 100, name: "red wine", unit: "ml" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 300, name: "spaghetti", unit: "g" },
      { amount: 1, name: "dried oregano", unit: "tsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "In a large pan, heat olive oil and sauté onion, carrot, celery, and garlic until soft.",
        title: "Cook the vegetables",
      },
      {
        description: "Add minced beef to the pan and cook until browned.",
        title: "Brown the beef",
      },
      {
        description:
          "Stir in canned tomatoes, tomato purée, red wine, and oregano. Simmer for 30 minutes.",
        title: "Add remaining ingredients",
      },
      {
        description:
          "Meanwhile, cook spaghetti according to package instructions. Serve sauce over pasta.",
        title: "Cook the pasta",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 75,
      fat: 20,
      protein: 40,
    },
    prepTime: 10,
    primaryProtein: "beef",
    serves: 4,
    source: "system",
    title: "Beef Bolognese",
    totalTimeMinutes: 50,
    updatedAt: 1771362767365,
  },
  {
    _creationTime: 1771344763633.5227,
    _id: "j9752a48c3217gn4yrem3rs9j181bmzw",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["middle_eastern"],
    description:
      "Spiced beef koftas served with fluffy couscous and a fresh salad.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/cf5779d6-ccc3-4c09-b0ba-1dce9b62ed2e",
    ingredients: [
      { amount: 500, name: "minced beef", unit: "g" },
      {
        amount: 1,
        name: "onion",
        preparation: "grated",
        unit: "whole",
      },
      { amount: 1, name: "cumin", unit: "tsp" },
      { amount: 1, name: "coriander", unit: "tsp" },
      { amount: 250, name: "couscous", unit: "g" },
      { amount: 300, name: "boiling water", unit: "ml" },
      { amount: 1, name: "olive oil", unit: "tbsp" },
      {
        amount: 1,
        name: "parsley",
        preparation: "chopped",
        unit: "bunch",
      },
      {
        amount: 1,
        name: "cucumber",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 2,
        name: "tomato",
        preparation: "diced",
        unit: "whole",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "In a bowl, combine minced beef, onion, cumin, and coriander. Shape into kofta.",
        title: "Mix the kofta",
      },
      {
        description:
          "Heat oil in a pan and cook kofta until browned and cooked through.",
        title: "Cook the kofta",
      },
      {
        description:
          "Put couscous in a bowl, pour boiling water over it, cover, and let sit for 5 minutes.",
        title: "Prepare the couscous",
      },
      {
        description:
          "Fluff couscous with a fork, mix in parsley. Combine diced cucumber and tomato for the salad. Serve with kofta and salad.",
        title: "Serve",
      },
    ],
    nutrition: {
      calories: 500,
      carbohydrates: 45,
      fat: 20,
      protein: 35,
    },
    prepTime: 20,
    primaryProtein: "beef",
    serves: 4,
    source: "system",
    title: "Beef Kofta with Couscous",
    totalTimeMinutes: 35,
    updatedAt: 1771362786712,
  },
  {
    _creationTime: 1771344763633.523,
    _id: "j979131y9jvwc8c2eqjdhyn22s81bvhd",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["mexican"],
    description:
      "Sizzling beef fajitas with peppers and onions, perfect for wrapping in tortillas.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/c9c62d70-a44e-435d-8aaf-388655c02a6a",
    ingredients: [
      {
        amount: 500,
        name: "beef steak",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 2,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 8, name: "tortillas", unit: "piece" },
      { amount: 2, name: "fajita seasoning", unit: "tbsp" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 150, name: "sour cream", unit: "ml" },
      { amount: 150, name: "guacamole", unit: "ml" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Heat olive oil in a pan, add beef and seasoning, and cook until browned.",
        title: "Cook the beef",
      },
      {
        description: "Add bell pepper and onion, cooking until softened.",
        title: "Add vegetables",
      },
      {
        description:
          "Serve the beef and vegetable mixture in tortillas with sour cream and guacamole.",
        title: "Serve",
      },
    ],
    nutrition: {
      calories: 600,
      carbohydrates: 50,
      fat: 25,
      protein: 40,
    },
    prepTime: 15,
    primaryProtein: "beef",
    serves: 4,
    source: "system",
    title: "Beef Fajitas",
    totalTimeMinutes: 30,
    updatedAt: 1771362806129,
  },
  {
    _creationTime: 1771344763633.5232,
    _id: "j9782ny7fs0x03jmg937av662s81apj2",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 35,
    cuisine: ["british"],
    description:
      "A hearty one-pan dish with seasoned beef and tender potatoes, perfect for a family dinner.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/277be04a-bc09-4948-ace1-3747ad781521",
    ingredients: [
      {
        amount: 500,
        name: "beef stewing steak",
        preparation: "cubed",
        unit: "g",
      },
      {
        amount: 600,
        name: "potatoes",
        preparation: "cubed",
        unit: "g",
      },
      {
        amount: 2,
        name: "carrot",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "roughly chopped",
        unit: "whole",
      },
      { amount: 500, name: "beef stock", unit: "ml" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 1, name: "dried thyme", unit: "tsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat oven to 200°C. In a large ovenproof pan, heat olive oil.",
        title: "Prepare the pan",
      },
      {
        description: "Add beef and brown on all sides.",
        title: "Brown the beef",
      },
      {
        description:
          "Add potatoes, carrots, onion, thyme, and stock. Bring to a simmer.",
        title: "Add vegetables and stock",
      },
      {
        description:
          "Cover and bake for 30 minutes, until beef and potatoes are tender.",
        title: "Bake",
      },
    ],
    nutrition: {
      calories: 700,
      carbohydrates: 65,
      fat: 20,
      protein: 45,
    },
    prepTime: 10,
    primaryProtein: "beef",
    serves: 4,
    source: "system",
    title: "One-Pan Beef and Potatoes",
    totalTimeMinutes: 45,
    updatedAt: 1771362823757,
  },
  {
    _creationTime: 1771344763633.5234,
    _id: "j97aqhwztqqzkaebcndaddhbfh81ajeq",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 50,
    cuisine: ["british"],
    description:
      "A comforting pie filled with tender beef and mushrooms, encased in flaky pastry.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/009af3ee-37de-4ef4-927e-4d45c5821a51",
    ingredients: [
      {
        amount: 500,
        name: "beef chuck",
        preparation: "diced",
        unit: "g",
      },
      {
        amount: 200,
        name: "mushrooms",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      { amount: 300, name: "beef stock", unit: "ml" },
      { amount: 350, name: "shortcrust pastry", unit: "g" },
      { amount: 1, name: "olive oil", unit: "tbsp" },
      { amount: 1, name: "dried thyme", unit: "tsp" },
      {
        amount: 1,
        name: "egg",
        preparation: "beaten",
        unit: "whole",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "In a pan, heat olive oil, add onion, and sauté until soft. Add beef and mushrooms, cooking until browned.",
        title: "Cook the filling",
      },
      {
        description:
          "Stir in beef stock and thyme, simmer for 20 minutes until thickened.",
        title: "Add stock and simmer",
      },
      {
        description:
          "Fill pastry with beef mixture, cover with another pastry layer, and brush with beaten egg.",
        title: "Assemble the pie",
      },
      {
        description: "Bake at 200°C for 25 minutes until golden brown.",
        title: "Bake",
      },
    ],
    nutrition: {
      calories: 800,
      carbohydrates: 60,
      fat: 35,
      protein: 50,
    },
    prepTime: 20,
    primaryProtein: "beef",
    serves: 4,
    source: "system",
    title: "Beef and Mushroom Pie",
    totalTimeMinutes: 70,
    updatedAt: 1771362842515,
  },
  {
    _creationTime: 1771344763633.5237,
    _id: "j973pjqwedwhvpv496q6rs3c1581ajgt",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 30,
    cuisine: ["other"],
    description:
      "A creamy and comforting beef stroganoff with tender mushrooms, served over egg noodles.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/e0dde457-d9df-4d60-a7a4-5c955b8275cc",
    ingredients: [
      {
        amount: 500,
        name: "beef sirloin",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 250,
        name: "mushrooms",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 300, name: "beef stock", unit: "ml" },
      { amount: 200, name: "sour cream", unit: "ml" },
      { amount: 300, name: "egg noodles", unit: "g" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      {
        amount: 1,
        name: "parsley",
        preparation: "chopped",
        unit: "bunch",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "In a pot of salted boiling water, cook the egg noodles according to package instructions until al dente. Drain and set aside.",
        title: "Cook the noodles",
      },
      {
        description:
          "In a large frying pan, heat olive oil over medium-high heat. Add the sliced beef, season with salt and black pepper, and cook until browned. Remove beef and set aside.",
        title: "Sauté the beef",
      },
      {
        description:
          "In the same pan, add the finely chopped onion and cook until softened. Add the garlic and sliced mushrooms, cooking until mushrooms are browned.",
        title: "Cook the vegetables",
      },
      {
        description:
          "Pour in the beef stock and bring to a simmer. Stir in the sour cream and return the beef to the pan. Cook for a few minutes until heated through.",
        title: "Make the sauce",
      },
      {
        description:
          "Serve the beef stroganoff over the cooked egg noodles and garnish with chopped parsley.",
        title: "Serve",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 60,
      fat: 30,
      protein: 40,
    },
    prepTime: 15,
    primaryProtein: "beef",
    serves: 4,
    source: "system",
    title: "Beef and Mushroom Stroganoff",
    totalTimeMinutes: 45,
    updatedAt: 1771362920689,
  },
  {
    _creationTime: 1771344763633.524,
    _id: "j97akec9t2x2p9x019rpqkcej981azsb",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 30,
    cuisine: ["indian"],
    description:
      "Tender chicken in a creamy, spiced tomato and coconut sauce—comforting and full of flavour.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/79366c53-040e-4fbf-ab6f-57ec6540e0f4",
    ingredients: [
      {
        amount: 600,
        name: "chicken breast",
        preparation: "diced",
        unit: "g",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 3,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      {
        amount: 20,
        name: "ginger",
        preparation: "grated",
        unit: "g",
      },
      { amount: 400, name: "canned tomatoes", unit: "g" },
      { amount: 400, name: "coconut milk", unit: "ml" },
      { amount: 2, name: "garam masala", unit: "tbsp" },
      { amount: 300, name: "rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions (or 2:1 water to rice, simmer covered 15–18 minutes). Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "In a large pan, heat the oil and sauté the onion until soft. Add the garlic and ginger and cook for 1 minute until fragrant.",
        title: "Sauté onion, garlic and ginger",
      },
      {
        description:
          "Season the chicken with salt and pepper. Add to the pan and cook until lightly browned on all sides.",
        title: "Brown the chicken",
      },
      {
        description:
          "Stir in the garam masala and cook for 30 seconds to toast the spices, then add the canned tomatoes. Simmer for 10 minutes until slightly thickened.",
        title: "Add spices and tomatoes",
      },
      {
        description:
          "Pour in the coconut milk and simmer gently for another 10 minutes until the chicken is cooked through and the sauce is rich. Check seasoning. Serve over the cooked rice.",
        title: "Finish with coconut milk and serve",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 60,
      fat: 30,
      protein: 40,
    },
    prepTime: 15,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken Tikka Masala",
    totalTimeMinutes: 45,
    updatedAt: 1771362938373,
  },
  {
    _creationTime: 1771344763633.5242,
    _id: "j9743j6qwfsbcxj6cgxpeb6j5h81b723",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 35,
    cuisine: ["british"],
    description:
      "One tray of golden chicken thighs, potatoes, and carrots with lemon and herbs—minimal washing up, maximum flavour.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/1f3e1519-f779-446c-860b-06ff29875f0a",
    ingredients: [
      { amount: 600, name: "chicken thighs", unit: "g" },
      {
        amount: 500,
        name: "potatoes",
        preparation: "quartered",
        unit: "g",
      },
      {
        amount: 300,
        name: "carrots",
        preparation: "sliced",
        unit: "g",
      },
      { amount: 3, name: "olive oil", unit: "tbsp" },
      {
        amount: 1,
        name: "lemon",
        preparation: "whole",
        unit: "whole",
      },
      { amount: 2, name: "mixed herbs", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description: "Preheat the oven to 200°C (180°C fan).",
        title: "Preheat oven",
      },
      {
        description:
          "In a large bowl, toss the potatoes and carrots with 2 tbsp olive oil, half the salt and pepper. Tip onto a large baking tray.",
        title: "Prepare vegetables",
      },
      {
        description:
          "Add the chicken thighs to the bowl with the remaining oil, lemon juice, mixed herbs, and the rest of the salt and pepper. Toss to coat, then place the chicken on the tray among the vegetables.",
        title: "Season the chicken",
      },
      {
        description:
          "Roast for 30–35 minutes until the chicken is cooked through and the potatoes and carrots are tender and golden. Rest the chicken for a few minutes before serving.",
        title: "Roast and rest",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 45,
      fat: 28,
      protein: 38,
    },
    prepTime: 10,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "One-Pan Lemon Herb Chicken and Vegetables",
    totalTimeMinutes: 45,
    updatedAt: 1771362955866,
  },
  {
    _creationTime: 1771344763633.5244,
    _id: "j9700nxgk5k97c81ra18nztacd81a2pq",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["mexican"],
    description:
      "Sizzling chicken with charred peppers and onions, wrapped in warm tortillas with a squeeze of lime.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/a8327655-97e9-43b2-a422-63bbfde1349e",
    ingredients: [
      {
        amount: 500,
        name: "chicken breast",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 2,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 2, name: "fajita seasoning", unit: "tbsp" },
      { amount: 8, name: "tortillas", unit: "piece" },
      {
        amount: 1,
        name: "lime",
        preparation: "whole",
        unit: "whole",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Season the chicken strips with the fajita seasoning and a pinch of salt. Heat 1 tbsp olive oil in a large frying pan over high heat and fry the chicken until golden and cooked through. Remove and set aside.",
        title: "Cook the chicken",
      },
      {
        description:
          "In the same pan, add the remaining oil and stir-fry the bell peppers and onion until charred at the edges and tender. Return the chicken and toss together.",
        title: "Sauté vegetables and combine",
      },
      {
        description:
          "Warm the tortillas in a dry pan or over a gas flame. Serve the chicken and vegetables in tortillas with lime juice squeezed over.",
        title: "Warm tortillas and serve",
      },
    ],
    nutrition: {
      calories: 600,
      carbohydrates: 55,
      fat: 20,
      protein: 40,
    },
    prepTime: 15,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken Fajitas",
    totalTimeMinutes: 30,
    updatedAt: 1771362973483,
  },
  {
    _creationTime: 1771344763633.5247,
    _id: "j97caj9k6cabnw4pdkz8rx7s8s81bdj7",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["chinese"],
    description:
      "Quick chicken and crisp vegetables in a savoury soy and ginger glaze over steamed rice.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/4f579d2d-6206-4227-8b8e-c6736c0d267b",
    ingredients: [
      {
        amount: 500,
        name: "chicken breast",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 200,
        name: "broccoli",
        preparation: "chopped",
        unit: "g",
      },
      {
        amount: 1,
        name: "carrot",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 3, name: "soy sauce", unit: "tbsp" },
      {
        amount: 10,
        name: "ginger",
        preparation: "grated",
        unit: "g",
      },
      { amount: 300, name: "rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions (or 2:1 water to rice, simmer covered 15–18 minutes). Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "Heat 1 tbsp oil in a wok or large frying pan over high heat. Add the chicken in a single layer and stir-fry until golden and cooked through. Remove and set aside.",
        title: "Stir-fry the chicken",
      },
      {
        description:
          "Add the remaining oil, then the broccoli, carrot, and bell pepper. Stir-fry for 3–4 minutes until tender-crisp. Add a splash of water and cover briefly if the broccoli needs to soften.",
        title: "Stir-fry the vegetables",
      },
      {
        description:
          "Return the chicken to the pan. Add the soy sauce and ginger and toss for 1 minute. Serve over the cooked rice.",
        title: "Add sauce and serve",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 60,
      fat: 15,
      protein: 43,
    },
    prepTime: 10,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken Stir-Fry",
    totalTimeMinutes: 25,
    updatedAt: 1771362989752,
  },
  {
    _creationTime: 1771344763633.525,
    _id: "j971gnb87fgzkfp27q3yk73ar981as4q",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 30,
    cuisine: ["mediterranean"],
    description:
      "Chicken thighs baked with tomatoes, olives, and garlic—serve with fluffy couscous to soak up the juices.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/75f5e5b2-c094-4076-af92-b08bd7e642cf",
    ingredients: [
      { amount: 600, name: "chicken thighs", unit: "g" },
      { amount: 400, name: "canned tomatoes", unit: "g" },
      { amount: 100, name: "kalamata olives", unit: "g" },
      {
        amount: 3,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 250, name: "couscous", unit: "g" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 2, name: "mixed herbs", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 200°C (180°C fan). Season the chicken thighs with salt and pepper.",
        title: "Preheat and season chicken",
      },
      {
        description:
          "Heat 1 tbsp olive oil in a large ovenproof dish over medium heat. Brown the chicken thighs skin-side down for 5 minutes, then turn and remove from the heat.",
        title: "Brown the chicken",
      },
      {
        description:
          "Add the canned tomatoes, olives, garlic, mixed herbs, and the remaining oil. Stir around the chicken and bake uncovered for 30 minutes until the chicken is cooked through and the sauce is bubbling.",
        title: "Add tomatoes and bake",
      },
      {
        description:
          "Meanwhile, prepare the couscous according to package instructions (usually pour over boiling water, cover and leave for 5 minutes, then fluff with a fork). Serve the chicken and sauce with the couscous.",
        title: "Prepare couscous and serve",
      },
    ],
    nutrition: {
      calories: 600,
      carbohydrates: 50,
      fat: 28,
      protein: 42,
    },
    prepTime: 15,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Mediterranean Chicken Bake",
    totalTimeMinutes: 45,
    updatedAt: 1771363008155,
  },
  {
    _creationTime: 1771344763633.5251,
    _id: "j976nmkjr6cy85x643n673xczx81b582",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 30,
    cuisine: ["japanese"],
    description:
      "Crispy panko-coated chicken with a rich Japanese-style curry sauce over steamed rice.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/72b8beef-39a0-4347-bedb-103e3103bbf6",
    ingredients: [
      {
        amount: 600,
        name: "chicken breast",
        preparation: "butterflied",
        unit: "g",
      },
      { amount: 150, name: "panko breadcrumbs", unit: "g" },
      { amount: 100, name: "plain flour", unit: "g" },
      {
        amount: 1,
        name: "egg",
        preparation: "beaten",
        unit: "whole",
      },
      { amount: 2, name: "curry paste", unit: "tbsp" },
      { amount: 400, name: "coconut milk", unit: "ml" },
      { amount: 300, name: "rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions. Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "Set up three shallow dishes: flour, beaten egg, and panko. Season the butterflied chicken with salt and pepper. Coat each piece in flour, then egg, then panko, pressing so the crumbs stick.",
        title: "Coat the chicken",
      },
      {
        description:
          "Heat the oil in a large frying pan over medium-high heat. Fry the chicken in batches until golden and cooked through, about 4–5 minutes per side. Drain on kitchen paper.",
        title: "Fry the katsu",
      },
      {
        description:
          "For the curry sauce: in a saucepan, fry the curry paste for 1 minute, then add the coconut milk and simmer for 5 minutes until slightly thickened. Serve the katsu over rice with the curry sauce poured over.",
        title: "Make the sauce and serve",
      },
    ],
    nutrition: {
      calories: 700,
      carbohydrates: 60,
      fat: 35,
      protein: 45,
    },
    prepTime: 20,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken Katsu Curry",
    totalTimeMinutes: 50,
    updatedAt: 1771363026525,
  },
  {
    _creationTime: 1771344763633.5254,
    _id: "j977eehfdxe09hk43rkcqbk5f981begj",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 20,
    cuisine: ["italian"],
    description:
      "Creamy pasta with tender chicken and wilted spinach—quick, satisfying, and easy to get on the table.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/19a19f19-832d-495d-9e0a-9d5f696fe99c",
    ingredients: [
      { amount: 300, name: "pasta", unit: "g" },
      {
        amount: 400,
        name: "chicken breast",
        preparation: "diced",
        unit: "g",
      },
      {
        amount: 150,
        name: "spinach",
        preparation: "roughly chopped",
        unit: "g",
      },
      { amount: 200, name: "cream", unit: "ml" },
      {
        amount: 50,
        name: "parmesan cheese",
        preparation: "grated",
        unit: "g",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Bring a large pot of salted water to the boil and cook the pasta according to package instructions. Drain and reserve a little pasta water.",
        title: "Cook the pasta",
      },
      {
        description:
          "Season the chicken with salt and pepper. Heat 1 tbsp olive oil in a large frying pan over medium-high heat and fry the chicken until golden and cooked through. Remove and set aside.",
        title: "Sauté the chicken",
      },
      {
        description:
          "In the same pan, add the remaining oil and the garlic. Cook for 1 minute, then add the spinach and stir until wilted.",
        title: "Wilt the spinach",
      },
      {
        description:
          "Lower the heat and pour in the cream. Simmer gently for 2–3 minutes, then stir in the parmesan. Return the chicken, add the pasta and toss. Add a splash of pasta water if the sauce is thick. Serve with extra parmesan and black pepper.",
        title: "Finish the sauce and serve",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 55,
      fat: 30,
      protein: 40,
    },
    prepTime: 10,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken and Spinach Pasta",
    totalTimeMinutes: 30,
    updatedAt: 1771363044414,
  },
  {
    _creationTime: 1771344763633.5256,
    _id: "j979pj5fnpcemwrqda2vyh91jn81aefe",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["other"],
    description:
      "Sticky honey-garlic chicken with crisp stir-fried vegetables over steamed rice.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/c6cf17e8-e555-47bd-a11f-48bc0c8e074c",
    ingredients: [
      {
        amount: 600,
        name: "chicken breast",
        preparation: "cubed",
        unit: "g",
      },
      { amount: 4, name: "honey", unit: "tbsp" },
      { amount: 3, name: "soy sauce", unit: "tbsp" },
      {
        amount: 3,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 300, name: "mixed vegetables", unit: "g" },
      { amount: 300, name: "rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions. Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "Mix the honey, soy sauce, and garlic in a small bowl. Season the chicken with salt and pepper. Heat 1 tbsp oil in a wok or large frying pan over high heat and stir-fry the chicken until golden and cooked through. Remove and set aside.",
        title: "Cook the chicken",
      },
      {
        description:
          "Add the remaining oil to the pan and stir-fry the mixed vegetables until tender-crisp. Return the chicken, pour in the honey-garlic mixture and toss until glossy and slightly thickened.",
        title: "Stir-fry vegetables and glaze",
      },
      {
        description:
          "Serve the honey garlic chicken and vegetables over the cooked rice.",
        title: "Serve",
      },
    ],
    nutrition: {
      calories: 600,
      carbohydrates: 70,
      fat: 15,
      protein: 38,
    },
    prepTime: 10,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Honey Garlic Chicken",
    totalTimeMinutes: 30,
    updatedAt: 1771363063067,
  },
  {
    _creationTime: 1771344763633.526,
    _id: "j97fhsrp15055kvkf8zkm1qyr581bkxy",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 30,
    cuisine: ["italian"],
    description:
      "Creamy arborio rice with tender chicken and mushrooms—stir often for the best texture.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/af77c7ac-60a3-40cc-bf90-78f365086428",
    ingredients: [
      {
        amount: 400,
        name: "chicken breast",
        preparation: "diced",
        unit: "g",
      },
      { amount: 300, name: "arborio rice", unit: "g" },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 200,
        name: "mushrooms",
        preparation: "sliced",
        unit: "g",
      },
      { amount: 1, name: "chicken stock", unit: "l" },
      {
        amount: 50,
        name: "parmesan cheese",
        preparation: "grated",
        unit: "g",
      },
      {
        amount: 30,
        name: "butter",
        preparation: "melted",
        unit: "g",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "In a large pan, heat olive oil over medium heat. Add the diced chicken and cook until golden, about 5 minutes. Remove and set aside.",
        title: "Cook the Chicken",
      },
      {
        description:
          "In the same pan, add the onion and mushrooms. Cook until softened, about 5 minutes.",
        title: "Sauté the Vegetables",
      },
      {
        description:
          "Stir in the arborio rice and cook for 1-2 minutes until lightly toasted.",
        title: "Add Rice",
      },
      {
        description:
          "Keep the stock warm in a separate pan. Add it to the rice one ladle at a time, stirring frequently and waiting until each addition is absorbed before adding more. This gives you a creamy risotto.",
        title: "Add stock gradually",
      },
      {
        description:
          "Once the rice is creamy and al dente, stir in the chicken, butter, and parmesan. Season with salt and pepper to taste.",
        title: "Finish Risotto",
      },
    ],
    nutrition: {
      calories: 620,
      carbohydrates: 70,
      fat: 20,
      protein: 45,
    },
    prepTime: 10,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken and Mushroom Risotto",
    totalTimeMinutes: 40,
    updatedAt: 1771363079605,
  },
  {
    _creationTime: 1771344763633.5261,
    _id: "j977jzh2tg86649y5zhyxt4s1s81b0z9",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["mexican"],
    description:
      "Spiced chicken in soft tortillas with a cool, creamy avocado and tomato salsa.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/ac9d7bcf-8817-43dc-9e29-e7797007d0b1",
    ingredients: [
      {
        amount: 500,
        name: "chicken thigh",
        preparation: "sliced",
        unit: "g",
      },
      { amount: 2, name: "taco seasoning", unit: "tbsp" },
      { amount: 1, name: "olive oil", unit: "tbsp" },
      { amount: 8, name: "tortillas", unit: "whole" },
      {
        amount: 1,
        name: "avocado",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 200,
        name: "cherry tomatoes",
        preparation: "halved",
        unit: "g",
      },
      {
        amount: 1,
        name: "red onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 1,
        name: "lime",
        preparation: "whole",
        unit: "whole",
      },
      {
        amount: 1,
        name: "coriander",
        preparation: "chopped",
        unit: "bunch",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Season the chicken with the taco seasoning and a pinch of salt. Heat the olive oil in a frying pan over medium-high heat and cook the chicken until browned and cooked through. Set aside and keep warm.",
        title: "Cook the chicken",
      },
      {
        description:
          "In a bowl, combine the avocado, cherry tomatoes, red onion, lime juice, and coriander. Season with a little salt.",
        title: "Make the avocado salsa",
      },
      {
        description:
          "Warm the tortillas in a dry pan or over a gas flame. Fill with the chicken and top with the avocado salsa. Serve straight away.",
        title: "Assemble and serve",
      },
    ],
    nutrition: {
      calories: 540,
      carbohydrates: 40,
      fat: 30,
      protein: 35,
    },
    prepTime: 15,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken Tacos with Avocado Salsa",
    totalTimeMinutes: 35,
    updatedAt: 1771363133532,
  },
  {
    _creationTime: 1771344763633.5264,
    _id: "j972hhbq48yaetvhfx6z9a9pks81bhtw",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["japanese"],
    description:
      "Sweet-salty teriyaki chicken with crisp vegetables and sesame over steamed rice.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/3d6668dd-4a5e-4a39-ad4f-109d2b308045",
    ingredients: [
      {
        amount: 400,
        name: "chicken breast",
        preparation: "thinly sliced",
        unit: "g",
      },
      {
        amount: 200,
        name: "broccoli",
        preparation: "chopped",
        unit: "g",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "carrot",
        preparation: "julienned",
        unit: "whole",
      },
      { amount: 100, name: "teriyaki sauce", unit: "ml" },
      { amount: 300, name: "rice", unit: "g" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 1, name: "sesame seeds", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions. Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "Heat 1 tbsp olive oil in a wok or large frying pan over high heat. Stir-fry the chicken until golden and cooked through. Remove and set aside.",
        title: "Stir-fry the chicken",
      },
      {
        description:
          "Add the remaining oil, then the broccoli, bell pepper, and carrot. Stir-fry for 4–5 minutes until tender-crisp. Add a splash of water and cover briefly if the broccoli needs to soften.",
        title: "Stir-fry the vegetables",
      },
      {
        description:
          "Return the chicken to the pan, pour in the teriyaki sauce and toss until everything is glossy. Serve over the rice and sprinkle with sesame seeds.",
        title: "Add sauce and serve",
      },
    ],
    nutrition: {
      calories: 500,
      carbohydrates: 45,
      fat: 15,
      protein: 40,
    },
    prepTime: 10,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken Teriyaki Stir-Fry",
    totalTimeMinutes: 25,
    updatedAt: 1771363156056,
  },
  {
    _creationTime: 1771344763633.5266,
    _id: "j97740yt8393r647sz42pnt4y981bm26",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 40,
    cuisine: ["british"],
    description:
      "Creamy chicken and leek filling under a golden, flaky puff pastry lid.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/2b30ee2d-9522-49b3-8e19-9d3e8cb9b303",
    ingredients: [
      {
        amount: 500,
        name: "chicken breast",
        preparation: "cubed",
        unit: "g",
      },
      {
        amount: 2,
        name: "leeks",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 500, name: "chicken stock", unit: "ml" },
      { amount: 150, name: "double cream", unit: "ml" },
      { amount: 1, name: "puff pastry", unit: "sheet" },
      {
        amount: 30,
        name: "butter",
        unit: "g",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Melt the butter in a large pan over medium heat. Sauté the leeks until soft, about 8 minutes. Season the chicken with salt and pepper, add to the pan and cook until lightly browned.",
        title: "Cook the leeks and chicken",
      },
      {
        description:
          "Pour in the chicken stock and bring to a simmer. Cook for 10 minutes until the chicken is done, then stir in the cream and simmer until the filling has thickened. Taste and adjust seasoning. Leave to cool slightly.",
        title: "Make the filling",
      },
      {
        description:
          "Transfer the filling to a pie dish. Roll out the puff pastry to fit the dish, place on top and trim the edges. Cut a small slit in the centre to let steam escape. Bake at 200°C (180°C fan) for 25–30 minutes until the pastry is golden and puffed. Rest for 5 minutes before serving.",
        title: "Top with pastry and bake",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 45,
      fat: 35,
      protein: 50,
    },
    prepTime: 20,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken and Leek Pie",
    totalTimeMinutes: 60,
    updatedAt: 1771363172135,
  },
  {
    _creationTime: 1771344763633.5269,
    _id: "j972nnbs29yqf8b8vx1pdph2wn81adaz",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 30,
    cuisine: ["middle_eastern"],
    description:
      "Tender chicken and chickpeas in a spiced tomato stew—hearty and full of flavour.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/3584b06c-8527-44bf-bc3d-822c258f8ca9",
    ingredients: [
      {
        amount: 400,
        name: "chicken thigh",
        preparation: "cubed",
        unit: "g",
      },
      {
        amount: 400,
        name: "chickpeas",
        preparation: "drained",
        unit: "g",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 3,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 400, name: "canned tomatoes", unit: "g" },
      { amount: 1, name: "paprika", unit: "tbsp" },
      { amount: 1, name: "cumin", unit: "tbsp" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Heat the olive oil in a large pot over medium heat. Sauté the onion until soft, then add the garlic and cook for 1 minute.",
        title: "Sauté onion and garlic",
      },
      {
        description:
          "Add the chicken and cook until browned on all sides. Stir in the paprika and cumin and cook for 30 seconds to toast the spices.",
        title: "Brown the chicken and add spices",
      },
      {
        description:
          "Add the chickpeas, canned tomatoes, salt, and pepper. Bring to a simmer, then cover and cook for 20–25 minutes until the chicken is tender and the sauce has thickened. Serve with bread or rice.",
        title: "Simmer and serve",
      },
    ],
    nutrition: {
      calories: 480,
      carbohydrates: 50,
      fat: 18,
      protein: 40,
    },
    prepTime: 15,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Spicy Chicken and Chickpea Stew",
    totalTimeMinutes: 45,
    updatedAt: 1771363189380,
  },
  {
    _creationTime: 1771344763633.527,
    _id: "j9782teqzdy8ftswqw6da7c4mx81a4x6",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 25,
    cuisine: ["italian"],
    description:
      "Crispy breadcrumb-coated chicken with tomato sauce and melted mozzarella and parmesan.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/d68866d7-f134-45b1-92bf-9a917b4e91cd",
    ingredients: [
      {
        amount: 400,
        name: "chicken breast",
        preparation: "butterflied",
        unit: "g",
      },
      { amount: 100, name: "breadcrumbs", unit: "g" },
      {
        amount: 50,
        name: "parmesan cheese",
        preparation: "grated",
        unit: "g",
      },
      {
        amount: 100,
        name: "mozzarella cheese",
        preparation: "grated",
        unit: "g",
      },
      { amount: 200, name: "tomato sauce", unit: "g" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 200°C (180°C fan). Mix the breadcrumbs with half the parmesan, salt, and pepper. Brush the butterflied chicken with olive oil and press into the breadcrumb mix to coat both sides.",
        title: "Preheat and coat the chicken",
      },
      {
        description:
          "Heat 1 tbsp olive oil in a large frying pan over medium-high heat. Fry the chicken until golden on both sides, about 4–5 minutes per side. Transfer to a baking dish.",
        title: "Fry the chicken",
      },
      {
        description:
          "Spoon the tomato sauce over the chicken and scatter with the mozzarella and remaining parmesan. Bake for 15–20 minutes until the cheese is melted and bubbling. Rest for 2–3 minutes before serving.",
        title: "Add sauce and cheese, then bake",
      },
    ],
    nutrition: {
      calories: 620,
      carbohydrates: 40,
      fat: 25,
      protein: 45,
    },
    prepTime: 15,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken Parmesan Bake",
    totalTimeMinutes: 40,
    updatedAt: 1771363228136,
  },
  {
    _creationTime: 1771344763633.5273,
    _id: "j9707nvx4p0vyrmp0kqpkkr1hh81bcem",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["mediterranean"],
    description:
      "Lemon and herb-marinated grilled chicken with a simple green salad.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/ad383b47-f56c-48eb-88b1-d3f8fb1d9424",
    ingredients: [
      {
        amount: 500,
        name: "chicken breast",
        preparation: "butterflied",
        unit: "g",
      },
      {
        amount: 1,
        name: "lemon",
        preparation: "whole",
        unit: "whole",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 1, name: "mixed herbs", unit: "tbsp" },
      { amount: 100, name: "salad leaves", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Mix the lemon juice, olive oil, mixed herbs, salt, and pepper in a bowl. Add the chicken and turn to coat. Marinate for at least 30 minutes (or up to a few hours in the fridge).",
        title: "Marinate the chicken",
      },
      {
        description:
          "Preheat the grill or griddle pan to medium-high. Cook the chicken for 6–8 minutes per side until cooked through and nicely marked. Rest for 5 minutes before slicing—this keeps the juices in.",
        title: "Grill and rest",
      },
      {
        description:
          "Slice the chicken and serve with the salad leaves and an extra drizzle of olive oil or lemon if you like.",
        title: "Serve",
      },
    ],
    nutrition: {
      calories: 430,
      carbohydrates: 5,
      fat: 20,
      protein: 50,
    },
    prepTime: 10,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Lemon Herb Grilled Chicken",
    totalTimeMinutes: 30,
    updatedAt: 1771363245081,
  },
  {
    _creationTime: 1771344763633.5276,
    _id: "j97bzas461jd874sn6e5wbh2h181atwf",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["italian"],
    description:
      "Creamy fettuccine Alfredo with tender chicken and a hit of garlic and parsley.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/acd2f2b1-092d-4a71-9ae4-aa7b2a518817",
    ingredients: [
      {
        amount: 400,
        name: "chicken breast",
        preparation: "sliced",
        unit: "g",
      },
      { amount: 300, name: "fettuccine pasta", unit: "g" },
      { amount: 200, name: "double cream", unit: "ml" },
      {
        amount: 50,
        name: "parmesan cheese",
        preparation: "grated",
        unit: "g",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      {
        amount: 1,
        name: "parsley",
        preparation: "chopped",
        unit: "bunch",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Bring a large pot of salted water to the boil and cook the fettuccine according to package instructions. Drain and reserve a little pasta water.",
        title: "Cook the pasta",
      },
      {
        description:
          "Season the chicken with salt and pepper. Heat 1 tbsp olive oil in a large frying pan over medium-high heat and cook the chicken until golden and cooked through. Remove and set aside.",
        title: "Sauté the chicken",
      },
      {
        description:
          "In the same pan, add the remaining oil and the garlic. Cook for 1 minute, then pour in the cream. Bring to a gentle simmer and stir in the parmesan until melted. Do not boil or the cream can split. Return the chicken and any resting juices, add the pasta and toss. Loosen with pasta water if needed. Stir in the parsley and serve.",
        title: "Make the sauce and serve",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 63,
      fat: 30,
      protein: 38,
    },
    prepTime: 10,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken Alfredo Pasta",
    totalTimeMinutes: 30,
    updatedAt: 1771363261684,
  },
  {
    _creationTime: 1771344763633.5278,
    _id: "j971ykf65adbns09ab5vfztsb581b1wg",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["chinese"],
    description:
      "Quick, colourful chicken and vegetable stir-fry with soy and ginger, great over rice.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/eb93375f-d436-4f00-aa2f-757626d516d8",
    ingredients: [
      {
        amount: 400,
        name: "chicken thigh",
        preparation: "diced",
        unit: "g",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 200,
        name: "broccoli",
        preparation: "chopped",
        unit: "g",
      },
      {
        amount: 1,
        name: "carrot",
        preparation: "thinly sliced",
        unit: "whole",
      },
      { amount: 60, name: "soy sauce", unit: "ml" },
      { amount: 1, name: "sesame oil", unit: "tbsp" },
      {
        amount: 1,
        name: "ginger",
        preparation: "minced",
        unit: "piece",
      },
      {
        amount: 2,
        name: "spring onion",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 300, name: "rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions. Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "Heat the sesame oil in a wok or large frying pan over high heat. Add the chicken and stir-fry until golden and cooked through. Remove and set aside.",
        title: "Stir-fry the chicken",
      },
      {
        description:
          "Add the broccoli, bell pepper, carrot, and ginger. Stir-fry for 4–5 minutes until tender-crisp. Add a splash of water and cover briefly if needed.",
        title: "Stir-fry the vegetables",
      },
      {
        description:
          "Return the chicken, pour in the soy sauce and toss for 1–2 minutes. Garnish with spring onion and serve over the rice.",
        title: "Finish and serve",
      },
    ],
    nutrition: {
      calories: 450,
      carbohydrates: 30,
      fat: 20,
      protein: 34,
    },
    prepTime: 10,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken and Vegetable Stir-Fry",
    totalTimeMinutes: 25,
    updatedAt: 1771363280113,
  },
  {
    _creationTime: 1771344763633.528,
    _id: "j9722mm59wh7g1bb82mwazazb581ay9r",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 10,
    cuisine: ["mexican"],
    description:
      "Spiced chicken in soft tortillas with fresh tomato salsa and creamy avocado.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/8e47930e-c8f4-433f-9924-871dc3133e0f",
    ingredients: [
      {
        amount: 400,
        name: "chicken breast",
        preparation: "diced",
        unit: "g",
      },
      { amount: 2, name: "taco seasoning", unit: "tbsp" },
      { amount: 8, name: "tortillas", unit: "whole" },
      {
        amount: 2,
        name: "tomato",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "red onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 1,
        name: "coriander",
        preparation: "chopped",
        unit: "bunch",
      },
      {
        amount: 1,
        name: "lime",
        preparation: "whole",
        unit: "whole",
      },
      {
        amount: 1,
        name: "avocado",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Season the chicken with the taco seasoning and a pinch of salt. Heat the olive oil in a frying pan over medium-high heat and cook the chicken until golden and cooked through. Set aside.",
        title: "Cook the chicken",
      },
      {
        description:
          "In a bowl, mix the tomato, red onion, coriander, and lime juice for the salsa. Season with a little salt.",
        title: "Make the salsa",
      },
      {
        description:
          "Warm the tortillas in a dry pan or over a gas flame. Fill with the chicken, salsa, and sliced avocado. Serve with extra lime.",
        title: "Assemble and serve",
      },
    ],
    nutrition: {
      calories: 500,
      carbohydrates: 40,
      fat: 25,
      protein: 35,
    },
    prepTime: 15,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken Tacos with Salsa",
    totalTimeMinutes: 25,
    updatedAt: 1771363297331,
  },
  {
    _creationTime: 1771344763633.5283,
    _id: "j97etbjmpq1tv1avj3m82ybwj181adt5",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 25,
    cuisine: ["thai"],
    description:
      "Fragrant Thai green curry with tender chicken, pepper, and aubergine in coconut milk.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/94c79a41-31b1-4800-83d1-b88812556acf",
    ingredients: [
      {
        amount: 400,
        name: "chicken thigh",
        preparation: "sliced",
        unit: "g",
      },
      { amount: 400, name: "coconut milk", unit: "ml" },
      {
        amount: 3,
        name: "green curry paste",
        unit: "tbsp",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "aubergine",
        preparation: "cubed",
        unit: "whole",
      },
      {
        amount: 1,
        name: "basil",
        preparation: "chopped",
        unit: "bunch",
      },
      {
        amount: 1,
        name: "lime",
        preparation: "whole",
        unit: "whole",
      },
      { amount: 300, name: "rice", unit: "g" },
      { amount: 1, name: "fish sauce", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions. Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "Scoop the thick cream from the top of the coconut milk into a large pan and heat over medium. Fry the curry paste for 2–3 minutes until fragrant—toasting the paste deepens the flavour.",
        title: "Fry the curry paste",
      },
      {
        description:
          "Add the chicken and stir to coat. Pour in the rest of the coconut milk and add the bell pepper and aubergine. Simmer for 15 minutes until the chicken is cooked and the vegetables are tender. Add fish sauce and a squeeze of lime to taste.",
        title: "Add chicken and vegetables",
      },
      {
        description:
          "Stir in most of the basil. Serve the curry over the rice with the remaining basil and lime wedges.",
        title: "Finish and serve",
      },
    ],
    nutrition: {
      calories: 620,
      carbohydrates: 40,
      fat: 40,
      protein: 36,
    },
    prepTime: 15,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Thai Green Curry Chicken",
    totalTimeMinutes: 40,
    updatedAt: 1771363317144,
  },
  {
    _creationTime: 1771344763633.5286,
    _id: "j9735en61zt4h6hdabwcfx5mj181ackb",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 35,
    cuisine: ["british"],
    description:
      "Golden chicken thighs and potatoes roasted with lemon, garlic, and thyme.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/3f5f30e6-6916-49c3-9685-3b9180ae802d",
    ingredients: [
      { amount: 800, name: "chicken thigh", unit: "g" },
      {
        amount: 1,
        name: "lemon",
        preparation: "whole",
        unit: "whole",
      },
      {
        amount: 4,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      {
        amount: 1,
        name: "thyme",
        preparation: "chopped",
        unit: "bunch",
      },
      { amount: 3, name: "olive oil", unit: "tbsp" },
      {
        amount: 500,
        name: "potatoes",
        preparation: "cubed",
        unit: "g",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 200°C (180°C fan). In a bowl, mix the olive oil, lemon juice, garlic, thyme, salt, and pepper. Add the chicken thighs and potatoes and toss to coat.",
        title: "Preheat and marinate",
      },
      {
        description:
          "Tip everything into a roasting dish and spread in a single layer. The potatoes will crisp better with space around them.",
        title: "Arrange in the dish",
      },
      {
        description:
          "Roast for 35–40 minutes until the chicken is cooked through and the potatoes are golden and tender. Rest the chicken for a few minutes before serving.",
        title: "Roast and rest",
      },
    ],
    nutrition: {
      calories: 680,
      carbohydrates: 35,
      fat: 40,
      protein: 45,
    },
    prepTime: 10,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Lemon Herb Roasted Chicken Thighs",
    totalTimeMinutes: 45,
    updatedAt: 1771363334600,
  },
  {
    _creationTime: 1771344763633.5288,
    _id: "j97f0jhb4zkymckcgatxd6zmv581bdex",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["middle_eastern"],
    description:
      "Spiced chicken in warm pita with cucumber, tomato, and a garlicky yogurt sauce.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/5a8cfd35-404f-4cd7-8fe2-435d1644b77a",
    ingredients: [
      {
        amount: 400,
        name: "chicken breast",
        preparation: "sliced",
        unit: "g",
      },
      { amount: 4, name: "pita bread", unit: "whole" },
      {
        amount: 1,
        name: "cucumber",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 2,
        name: "tomato",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 200, name: "yogurt", unit: "ml" },
      { amount: 1, name: "cumin", unit: "tsp" },
      { amount: 1, name: "paprika", unit: "tsp" },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Mix the chicken with the cumin, paprika, half the garlic, and a pinch of salt and pepper. In a bowl, combine the yogurt with the remaining garlic and a pinch of salt for the sauce.",
        title: "Season the chicken and make yogurt sauce",
      },
      {
        description:
          "Heat the olive oil in a frying pan over medium-high heat. Cook the chicken until golden and cooked through, about 5–6 minutes. Rest for a couple of minutes.",
        title: "Cook the chicken",
      },
      {
        description:
          "Warm the pitta in a dry pan or toaster. Fill with the chicken, cucumber, tomato, and a generous spoonful of the yogurt sauce. Wrap or serve open and eat straight away.",
        title: "Assemble and serve",
      },
    ],
    nutrition: {
      calories: 500,
      carbohydrates: 45,
      fat: 20,
      protein: 36,
    },
    prepTime: 15,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken Shawarma Wraps",
    totalTimeMinutes: 30,
    updatedAt: 1771363353691,
  },
  {
    _creationTime: 1771344763633.529,
    _id: "j9714bamacfyyvrxq1g1am4h9d81a7k0",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 45,
    cuisine: ["other"],
    description:
      "One-pan baked chicken and rice with peas and carrot—comforting and hands-off.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/cfcd6652-5a07-4bd4-a8d8-826623dfe89a",
    ingredients: [
      {
        amount: 400,
        name: "chicken breast",
        preparation: "cubed",
        unit: "g",
      },
      { amount: 250, name: "rice", unit: "g" },
      { amount: 600, name: "chicken stock", unit: "ml" },
      { amount: 150, name: "peas", unit: "g" },
      {
        amount: 1,
        name: "carrot",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 180°C (160°C fan). Season the chicken with salt and pepper.",
        title: "Preheat and season",
      },
      {
        description:
          "Heat the olive oil in a large ovenproof casserole over medium heat. Sauté the onion and carrot until soft, about 5 minutes. Push to one side, add the chicken and brown briefly.",
        title: "Sauté vegetables and chicken",
      },
      {
        description:
          "Stir in the rice and pour over the chicken stock. Add the peas, bring to a simmer, then cover with a tight-fitting lid and bake for 45 minutes until the rice is tender and has absorbed the liquid. Fluff with a fork and serve.",
        title: "Add rice and bake",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 65,
      fat: 15,
      protein: 40,
    },
    prepTime: 10,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Baked Chicken and Rice Casserole",
    totalTimeMinutes: 55,
    updatedAt: 1771363371661,
  },
  {
    _creationTime: 1771344763633.5293,
    _id: "j9767wwg7411anwvqrgf26chnd81b4b9",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 30,
    cuisine: ["spanish"],
    description:
      "Spanish-style paella with chicken, chorizo, and rice—a colourful one-pan centrepiece.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/5c82d193-4460-4aa0-87da-be8da5349595",
    ingredients: [
      {
        amount: 400,
        name: "chicken thigh",
        preparation: "cubed",
        unit: "g",
      },
      {
        amount: 150,
        name: "chorizo",
        preparation: "sliced",
        unit: "g",
      },
      { amount: 300, name: "rice", unit: "g" },
      { amount: 600, name: "chicken stock", unit: "ml" },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "tomato",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 1, name: "paprika", unit: "tsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Heat the olive oil in a large paella pan or wide frying pan over medium-high heat. Season the chicken and brown on all sides. Add the chorizo and fry until it releases its oil. Remove the chicken and chorizo and set aside.",
        title: "Brown the chicken and chorizo",
      },
      {
        description:
          "In the same pan, add the bell pepper, tomato, and garlic. Cook for 5 minutes until softening. Stir in the rice and paprika so the rice is coated in the oil.",
        title: "Add vegetables and rice",
      },
      {
        description:
          "Pour in the chicken stock and bring to a simmer. Return the chicken and chorizo, nestling them into the rice. Do not stir from here—let the rice absorb the stock. Cook for 25–30 minutes until the rice is tender and the bottom is golden and crisp at the edges if you like socarrat. Rest for 5 minutes, then serve.",
        title: "Simmer and rest",
      },
    ],
    nutrition: {
      calories: 700,
      carbohydrates: 50,
      fat: 30,
      protein: 40,
    },
    prepTime: 15,
    primaryProtein: "chicken",
    serves: 4,
    source: "system",
    title: "Chicken and Chorizo Paella",
    totalTimeMinutes: 45,
    updatedAt: 1771363390613,
  },
  {
    _creationTime: 1771344763633.5295,
    _id: "j97epsgz6hrnkk0zhek90h1rv581bd2p",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["other"],
    description:
      "Salmon baked with garlic, lemon, and parsley butter—simple and full of flavour.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/0d55e697-7a4d-4144-875c-fe7f638391d6",
    ingredients: [
      { amount: 600, name: "salmon fillet", unit: "g" },
      { amount: 50, name: "butter", unit: "g" },
      {
        amount: 3,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      {
        amount: 1,
        name: "whole lemon",
        preparation: "whole",
        unit: "whole",
      },
      {
        amount: 15,
        name: "fresh parsley",
        preparation: "finely chopped",
        unit: "g",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 200°C (180°C fan). Melt the butter and mix with the garlic, lemon juice, salt, and pepper.",
        title: "Preheat and make the butter sauce",
      },
      {
        description:
          "Place the salmon in a baking dish, skin-side down if it has skin. Pour the butter sauce over the top and bake for 15–20 minutes until the salmon is just cooked through—it should still be slightly translucent in the centre. Rest for 2–3 minutes before serving.",
        title: "Bake and rest the salmon",
      },
      {
        description:
          "Sprinkle with chopped parsley and serve with the buttery juices from the dish.",
        title: "Garnish and serve",
      },
    ],
    nutrition: {
      calories: 520,
      carbohydrates: 2,
      fat: 36,
      protein: 40,
    },
    prepTime: 10,
    primaryProtein: "fish",
    serves: 4,
    source: "system",
    title: "Lemon Garlic Butter Salmon",
    totalTimeMinutes: 30,
    updatedAt: 1771363408088,
  },
  {
    _creationTime: 1771344763633.5298,
    _id: "j971fp3wh9btm2kdkw3w07c6g181aevp",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 25,
    cuisine: ["thai"],
    description:
      "Creamy Thai red curry with white fish, pepper, and broccoli—fragrant and satisfying.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/1c5d525d-9cc4-4924-832c-35a24d3b9dd7",
    ingredients: [
      {
        amount: 600,
        name: "white fish fillet",
        preparation: "cubed",
        unit: "g",
      },
      { amount: 400, name: "coconut milk", unit: "ml" },
      { amount: 3, name: "red curry paste", unit: "tbsp" },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 200,
        name: "broccoli",
        preparation: "chopped",
        unit: "g",
      },
      {
        amount: 15,
        name: "fresh coriander",
        preparation: "chopped",
        unit: "g",
      },
      {
        amount: 1,
        name: "lime",
        preparation: "whole",
        unit: "whole",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Heat the oil in a large pan over medium heat. Fry the curry paste for 1–2 minutes until fragrant. Add the thick part of the coconut milk first and stir to form a paste, then pour in the rest. Bring to a gentle simmer.",
        title: "Fry the curry paste and add coconut milk",
      },
      {
        description:
          "Add the bell pepper and broccoli and simmer for 5 minutes until starting to soften. Add the fish cubes and cook for 5–8 minutes until the fish is just cooked through—don’t overcook or it will break up. Season with salt and a squeeze of lime.",
        title: "Add vegetables and fish",
      },
      {
        description:
          "Stir in most of the coriander. Serve with rice, with the remaining coriander on top.",
        title: "Finish and serve",
      },
    ],
    nutrition: {
      calories: 450,
      carbohydrates: 10,
      fat: 30,
      protein: 35,
    },
    prepTime: 15,
    primaryProtein: "fish",
    serves: 4,
    source: "system",
    title: "Thai Fish Curry",
    totalTimeMinutes: 40,
    updatedAt: 1771363424303,
  },
  {
    _creationTime: 1771344763633.53,
    _id: "j97chqeeqekeynmbc4gy2x6hq581ajmh",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["mexican"],
    description:
      "Pan-fried fish in warm tortillas with a crisp cabbage and carrot slaw and lime.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/8ed0a8b7-1a2c-43d0-b123-5a214354e441",
    ingredients: [
      {
        amount: 400,
        name: "white fish fillet",
        preparation: "sliced",
        unit: "g",
      },
      { amount: 8, name: "corn tortillas", unit: "piece" },
      {
        amount: 200,
        name: "cabbage",
        preparation: "shredded",
        unit: "g",
      },
      {
        amount: 1,
        name: "carrot",
        preparation: "grated",
        unit: "whole",
      },
      {
        amount: 1,
        name: "lime",
        preparation: "whole",
        unit: "whole",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 1, name: "cumin", unit: "tsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "In a bowl, mix the cabbage, carrot, half the lime juice, 1 tbsp olive oil, and a pinch of salt and pepper. Set the slaw aside. Warm the tortillas in a dry pan or over a gas flame.",
        title: "Make the slaw and warm tortillas",
      },
      {
        description:
          "Season the fish with the cumin, salt, and pepper. Heat the remaining oil in a frying pan over medium-high heat and cook the fish for 2–3 minutes per side until golden and just cooked through. Flake into chunks.",
        title: "Cook the fish",
      },
      {
        description:
          "Fill the tortillas with the fish and top with the slaw and an extra squeeze of lime. Serve immediately.",
        title: "Assemble and serve",
      },
    ],
    nutrition: {
      calories: 480,
      carbohydrates: 50,
      fat: 18,
      protein: 30,
    },
    prepTime: 15,
    primaryProtein: "fish",
    serves: 4,
    source: "system",
    title: "Fish Tacos with Cabbage Slaw",
    totalTimeMinutes: 30,
    updatedAt: 1771363442127,
  },
  {
    _creationTime: 1771344763633.5303,
    _id: "j974tgrcxv6wxcdv6rk54dhge981aq2z",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["mediterranean"],
    description:
      "Cod baked with cherry tomatoes, garlic, and basil—light, fresh, and easy.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/f9d46b76-20b7-4cf5-a6cf-3c758c512cc6",
    ingredients: [
      { amount: 600, name: "cod fillet", unit: "g" },
      {
        amount: 250,
        name: "cherry tomatoes",
        preparation: "halved",
        unit: "g",
      },
      {
        amount: 15,
        name: "fresh basil",
        preparation: "chopped",
        unit: "g",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 180°C (160°C fan). Place the cod in a baking dish and scatter the tomatoes and garlic around and over it. Drizzle with olive oil and season with salt and pepper.",
        title: "Preheat and assemble",
      },
      {
        description:
          "Bake for 15–20 minutes until the cod is opaque and flakes easily. Rest for 1–2 minutes, then scatter with basil and serve with the tomato juices.",
        title: "Bake and serve",
      },
    ],
    nutrition: {
      calories: 390,
      carbohydrates: 10,
      fat: 20,
      protein: 37,
    },
    prepTime: 10,
    primaryProtein: "fish",
    serves: 4,
    source: "system",
    title: "Oven-Baked Cod with Tomato and Basil",
    totalTimeMinutes: 30,
    updatedAt: 1771363460179,
  },
  {
    _creationTime: 1771344763633.5305,
    _id: "j97a7qbmv07jzgsvbg9mv1fv0s81b3ye",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 25,
    cuisine: ["italian"],
    description:
      "White fish and roasted vegetables with a pesto crust—one tray, minimal fuss.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/96305944-70fb-4a52-9860-e3cfdd313670",
    ingredients: [
      { amount: 600, name: "white fish fillet", unit: "g" },
      { amount: 4, name: "pesto", unit: "tbsp" },
      {
        amount: 1,
        name: "courgette",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "red onion",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 200°C (180°C fan). In a baking tray, toss the courgette, bell pepper, and red onion with 1 tbsp olive oil, salt, and pepper. Spread in a single layer.",
        title: "Preheat and prepare the vegetables",
      },
      {
        description:
          "Season the fish with salt and pepper and place on top of the vegetables. Spread the pesto over the fish and drizzle with the remaining oil. Bake for 20–25 minutes until the fish is cooked through and the vegetables are tender. Rest for 1–2 minutes before serving.",
        title: "Add the fish and bake",
      },
    ],
    nutrition: {
      calories: 460,
      carbohydrates: 20,
      fat: 25,
      protein: 35,
    },
    prepTime: 10,
    primaryProtein: "fish",
    serves: 4,
    source: "system",
    title: "Baked Pesto Fish with Vegetables",
    totalTimeMinutes: 35,
    updatedAt: 1771363477589,
  },
  {
    _creationTime: 1771344763633.5308,
    _id: "j97ag32ze8bc7nhxffemebgs6h81bm5m",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 10,
    cuisine: ["british"],
    description:
      "Grilled mackerel with lemon and dill—quick, oily, and full of flavour.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/96df1106-a649-4b9e-9120-10e05934f79f",
    ingredients: [
      { amount: 600, name: "mackerel fillet", unit: "g" },
      {
        amount: 1,
        name: "whole lemon",
        preparation: "whole",
        unit: "whole",
      },
      {
        amount: 15,
        name: "fresh dill",
        preparation: "chopped",
        unit: "g",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the grill to medium-high. Rub the mackerel fillets with olive oil and season with salt and pepper on both sides.",
        title: "Preheat and season the fish",
      },
      {
        description:
          "Grill skin-side up first for about 4–5 minutes, then flip and grill for 3–4 minutes until cooked through and the skin is crisp. Rest for 1–2 minutes.",
        title: "Grill the mackerel",
      },
      {
        description:
          "Drizzle with lemon juice and scatter with dill. Serve with lemon wedges.",
        title: "Finish and serve",
      },
    ],
    nutrition: {
      calories: 420,
      carbohydrates: 2,
      fat: 28,
      protein: 38,
    },
    prepTime: 10,
    primaryProtein: "fish",
    serves: 4,
    source: "system",
    title: "Grilled Mackerel with Lemon and Dill",
    totalTimeMinutes: 20,
    updatedAt: 1771363500900,
  },
  {
    _creationTime: 1771344763633.531,
    _id: "j972v7vr12zzv2sn0161ah6gkn81a7tv",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 30,
    cuisine: ["british"],
    description:
      "Creamy fish and smoked haddock under a mash lid with peas—proper comfort food.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/cc652b3b-7388-49ee-af13-88e323076866",
    ingredients: [
      {
        amount: 300,
        name: "white fish fillet",
        preparation: "cubed",
        unit: "g",
      },
      {
        amount: 300,
        name: "smoked haddock fillet",
        preparation: "cubed",
        unit: "g",
      },
      {
        amount: 800,
        name: "potatoes",
        preparation: "cubed",
        unit: "g",
      },
      { amount: 200, name: "milk", unit: "ml" },
      { amount: 50, name: "butter", unit: "g" },
      { amount: 50, name: "plain flour", unit: "g" },
      { amount: 150, name: "frozen peas", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Boil the potatoes in salted water until tender, drain, then mash with a little of the butter. Keep warm. Preheat the oven to 200°C (180°C fan).",
        title: "Cook and mash the potatoes",
      },
      {
        description:
          "Melt the remaining butter in a pan, stir in the flour and cook for 1 minute. Take off the heat and gradually whisk in the milk until smooth. Return to the heat and simmer gently for 2–3 minutes. Season with salt and pepper. Add the fish and peas and stir gently—the fish will cook in the sauce. Pour into a baking dish.",
        title: "Make the sauce and add the fish",
      },
      {
        description:
          "Spoon or pipe the mash over the fish mixture. Bake for 25–30 minutes until golden and bubbling. Rest for 5 minutes before serving.",
        title: "Top with mash and bake",
      },
    ],
    nutrition: {
      calories: 680,
      carbohydrates: 70,
      fat: 25,
      protein: 40,
    },
    prepTime: 20,
    primaryProtein: "fish",
    serves: 4,
    source: "system",
    title: "Fish Pie",
    totalTimeMinutes: 50,
    updatedAt: 1771363732938,
  },
  {
    _creationTime: 1771344763633.5312,
    _id: "j97djaq10d6r88h8kae67txkrh81agnv",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 25,
    cuisine: ["other"],
    description:
      "Haddock baked with lemon and thyme—minimal ingredients, maximum flavour.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/543ca86a-35d8-451d-80f5-29fcc2bbc949",
    ingredients: [
      { amount: 600, name: "haddock fillet", unit: "g" },
      {
        amount: 1,
        name: "whole lemon",
        preparation: "whole",
        unit: "whole",
      },
      {
        amount: 15,
        name: "fresh thyme",
        preparation: "chopped",
        unit: "g",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 200°C (180°C fan). Place the haddock in a baking tray. Drizzle with olive oil and lemon juice, then season with salt and pepper and scatter with thyme.",
        title: "Preheat and prepare the fish",
      },
      {
        description:
          "Bake for 20–25 minutes until the fish is opaque and flakes easily. Rest for 1–2 minutes, then serve with the pan juices and extra lemon.",
        title: "Bake and serve",
      },
    ],
    nutrition: {
      calories: 420,
      carbohydrates: 2,
      fat: 25,
      protein: 38,
    },
    prepTime: 10,
    primaryProtein: "fish",
    serves: 4,
    source: "system",
    title: "Baked Fish with Lemon and Herbs",
    totalTimeMinutes: 35,
    updatedAt: 1771363749665,
  },
  {
    _creationTime: 1771344763633.5315,
    _id: "j971qg5zsm5847g2n98sxvr9z181br9g",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["middle_eastern"],
    description:
      "Spiced lamb kofta with cool tzatziki and warm pitta—great from the grill or griddle.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/daaa67c9-d4f3-4b81-b817-6793ab91e50d",
    ingredients: [
      { amount: 500, name: "lamb mince", unit: "g" },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 1, name: "cumin", unit: "tsp" },
      { amount: 1, name: "coriander", unit: "tsp" },
      { amount: 1, name: "paprika", unit: "tsp" },
      { amount: 4, name: "pitta bread", unit: "whole" },
      {
        amount: 0.5,
        name: "cucumber",
        preparation: "grated",
        unit: "whole",
      },
      { amount: 200, name: "yogurt", unit: "g" },
      {
        amount: 1,
        name: "mint",
        preparation: "finely chopped",
        unit: "bunch",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "For the tzatziki: grate the cucumber and squeeze out the excess liquid. Mix with the yogurt and mint, season with a little salt, and set aside. This gives the cucumber time to release flavour without watering down the sauce.",
        title: "Make the tzatziki",
      },
      {
        description:
          "In a bowl, combine the lamb mince, onion, garlic, cumin, coriander, paprika, salt, and pepper. Mix with your hands until just combined—don’t overwork or the kofta can become dense. Shape into sausage-shaped kebabs on skewers (or form into ovals without skewers).",
        title: "Shape the kofta",
      },
      {
        description:
          "Preheat the grill or griddle to medium-high. Cook the kofta for 8–10 minutes, turning occasionally, until cooked through and nicely charred. Rest for 2–3 minutes. Warm the pitta and serve with the kofta and tzatziki.",
        title: "Grill and serve",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 30,
      fat: 30,
      protein: 37,
    },
    prepTime: 15,
    primaryProtein: "lamb",
    serves: 4,
    source: "system",
    title: "Lamb Kofta Kebabs with Tzatziki",
    totalTimeMinutes: 30,
    updatedAt: 1771363768267,
  },
  {
    _creationTime: 1771344763633.5317,
    _id: "j97e4yvayyrgqwacadagmtkf8n81bk3j",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 40,
    cuisine: ["british"],
    description:
      "Lamb steaks and root veg roasted on one tray with olive oil and herbs—minimal fuss, maximum flavour.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/b0634f8e-7868-495d-b7ac-77bba1f40087",
    ingredients: [
      { amount: 600, name: "lamb leg steaks", unit: "g" },
      {
        amount: 3,
        name: "carrots",
        preparation: "chopped",
        unit: "whole",
      },
      {
        amount: 500,
        name: "potatoes",
        preparation: "cubed",
        unit: "g",
      },
      {
        amount: 1,
        name: "red onion",
        preparation: "quartered",
        unit: "whole",
      },
      {
        amount: 4,
        name: "garlic",
        preparation: "whole",
        unit: "clove",
      },
      { amount: 3, name: "olive oil", unit: "tbsp" },
      { amount: 1, name: "mixed herbs", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 200°C (180°C fan). Season the lamb steaks with salt and pepper.",
        title: "Preheat and season the lamb",
      },
      {
        description:
          "On a large baking tray, toss the carrots, potatoes, red onion, and whole garlic cloves with 2 tbsp olive oil, the mixed herbs, salt, and pepper. Spread in an even layer. Drizzle the lamb with the remaining oil and nestle among the vegetables.",
        title: "Arrange on the tray",
      },
      {
        description:
          "Roast for 30–35 minutes until the lamb is cooked to your liking (pink in the middle or well done) and the vegetables are tender and golden. Rest the lamb for 5 minutes before serving with the vegetables and any tray juices.",
        title: "Roast and rest",
      },
    ],
    nutrition: {
      calories: 700,
      carbohydrates: 60,
      fat: 30,
      protein: 42,
    },
    prepTime: 10,
    primaryProtein: "lamb",
    serves: 4,
    source: "system",
    title: "Lamb and Vegetable Traybake",
    totalTimeMinutes: 50,
    updatedAt: 1771363788207,
  },
  {
    _creationTime: 1771344763633.532,
    _id: "j97bbzgt3nvy929cccabmapd8d81bajk",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 40,
    cuisine: ["indian"],
    description:
      "Fragrant one-pot lamb biryani with basmati rice, yogurt, and biryani spices.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/241a1ea4-138f-456d-9648-d7f9ccbd9a39",
    ingredients: [
      {
        amount: 500,
        name: "lamb shoulder",
        preparation: "diced",
        unit: "g",
      },
      {
        amount: 300,
        name: "basmati rice",
        preparation: "rinsed",
        unit: "g",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 3,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      {
        amount: 20,
        name: "ginger",
        preparation: "grated",
        unit: "g",
      },
      {
        amount: 1,
        name: "tomato",
        preparation: "chopped",
        unit: "whole",
      },
      { amount: 100, name: "yoghurt", unit: "g" },
      {
        amount: 2,
        name: "biryani spice mix",
        unit: "tbsp",
      },
      { amount: 600, name: "water", unit: "ml" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Rinse the basmati rice in cold water until the water runs clear, then drain. In a large pot, heat the oil and sauté the sliced onion until golden, about 8–10 minutes. A well-browned onion base adds depth to the biryani.",
        title: "Sauté the onion",
      },
      {
        description:
          "Add the lamb and brown on all sides. Stir in the garlic, ginger, and biryani spice mix and cook for 1–2 minutes until fragrant. Add the tomato and yoghurt and cook for 3–4 minutes, stirring.",
        title: "Brown the lamb and add spices",
      },
      {
        description:
          "Add the rinsed rice and water. Bring to a boil, then reduce the heat, cover with a tight-fitting lid, and simmer for 25 minutes until the rice is tender and the liquid is absorbed. Turn off the heat and leave to rest, covered, for 5–10 minutes. Fluff with a fork and serve.",
        title: "Add rice, cook and rest",
      },
    ],
    nutrition: {
      calories: 720,
      carbohydrates: 80,
      fat: 20,
      protein: 40,
    },
    prepTime: 20,
    primaryProtein: "lamb",
    serves: 4,
    source: "system",
    title: "Lamb Biryani",
    totalTimeMinutes: 60,
    updatedAt: 1771363805825,
  },
  {
    _creationTime: 1771344763633.5322,
    _id: "j975r95jn8wr7keqwq9xgtx4n981bjq1",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["italian"],
    description:
      "Creamy penne with lamb mince and fresh mint—comforting and quick to make.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/38a279a0-8632-4198-850b-47eb72219fed",
    ingredients: [
      { amount: 500, name: "lamb mince", unit: "g" },
      { amount: 300, name: "penne pasta", unit: "g" },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 200, name: "double cream", unit: "ml" },
      {
        amount: 50,
        name: "parmesan cheese",
        preparation: "finely grated",
        unit: "g",
      },
      {
        amount: 1,
        name: "mint",
        preparation: "finely chopped",
        unit: "bunch",
      },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Bring a large pot of salted water to the boil and cook the penne according to package instructions. Drain and reserve a little pasta water.",
        title: "Cook the pasta",
      },
      {
        description:
          "Heat the olive oil in a large frying pan over medium heat. Sauté the onion until soft, then add the garlic and cook for 1 minute. Add the lamb mince, break it up with a spoon, and cook until browned and no pink remains. Season with salt and pepper.",
        title: "Sauté the lamb",
      },
      {
        description:
          "Lower the heat and stir in the double cream and parmesan. Simmer gently for 2–3 minutes until the sauce has thickened slightly—don’t boil or the cream can split. Add the mint, then toss in the pasta. Add a splash of pasta water if the sauce is thick. Serve immediately.",
        title: "Make the sauce and serve",
      },
    ],
    nutrition: {
      calories: 640,
      carbohydrates: 60,
      fat: 30,
      protein: 35,
    },
    prepTime: 10,
    primaryProtein: "lamb",
    serves: 4,
    source: "system",
    title: "Lamb and Mint Pasta",
    totalTimeMinutes: 30,
    updatedAt: 1771363824701,
  },
  {
    _creationTime: 1771344763633.5325,
    _id: "j970cf67xbvymrp3sve6m6cnxd81btx2",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 25,
    cuisine: ["french"],
    description:
      "Pan-seared duck breast with crisp skin, orange sauce, green beans, and new potatoes.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/d7c6766f-94d6-4ba5-84bd-360cf6a3642a",
    ingredients: [
      { amount: 2, name: "duck breast", unit: "whole" },
      { amount: 100, name: "orange juice", unit: "ml" },
      {
        amount: 1,
        name: "orange",
        preparation: "zested",
        unit: "whole",
      },
      { amount: 1, name: "honey", unit: "tbsp" },
      { amount: 1, name: "soy sauce", unit: "tbsp" },
      {
        amount: 200,
        name: "green beans",
        preparation: "trimmed",
        unit: "g",
      },
      { amount: 400, name: "new potatoes", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Boil the new potatoes in salted water until tender, then drain. In a small saucepan, combine the orange juice, honey, soy sauce, and orange zest. Simmer for 5–8 minutes until slightly thickened. Set aside.",
        title: "Cook the potatoes and make the sauce",
      },
      {
        description:
          "Score the duck skin in a crosshatch pattern and season with salt and pepper. Place skin-side down in a cold frying pan and set over medium heat—starting cold helps render the fat and crisp the skin. Cook for 6–8 minutes until the skin is golden and crisp. Flip and cook for 4–5 minutes for medium-rare. Rest for 5–10 minutes before slicing so the juices redistribute.",
        title: "Cook the duck",
      },
      {
        description:
          "Blanch the green beans in boiling salted water for 3–4 minutes until tender-crisp. Drain and season with a little salt. Slice the duck and serve with the orange sauce, green beans, and potatoes.",
        title: "Prepare vegetables and serve",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 30,
      fat: 40,
      protein: 40,
    },
    prepTime: 15,
    primaryProtein: "other",
    serves: 2,
    source: "system",
    title: "Duck Breast with Orange Sauce",
    totalTimeMinutes: 40,
    updatedAt: 1771363843120,
  },
  {
    _creationTime: 1771344763633.5327,
    _id: "j9773sjxa0vpav7a9ywbmk37z981ba8p",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 35,
    cuisine: ["other"],
    description:
      "Hearty venison chilli with kidney beans and spices—serve with bread or rice.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/c7951bc3-a00b-417b-b504-0985fe2a1d79",
    ingredients: [
      { amount: 500, name: "venison mince", unit: "g" },
      {
        amount: 1,
        name: "red onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      {
        amount: 1,
        name: "red bell pepper",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 400,
        name: "canned kidney beans",
        preparation: "drained",
        unit: "g",
      },
      {
        amount: 400,
        name: "canned chopped tomatoes",
        unit: "g",
      },
      { amount: 2, name: "chilli powder", unit: "tbsp" },
      { amount: 1, name: "cumin", unit: "tbsp" },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Heat the olive oil in a large pot over medium heat. Sauté the red onion until soft, then add the garlic and bell pepper and cook for 2–3 minutes. Add the chilli powder and cumin and cook for 30 seconds to toast the spices.",
        title: "Sauté the base and toast spices",
      },
      {
        description:
          "Add the venison mince and cook until browned, breaking it up with a spoon. Season with salt and pepper.",
        title: "Brown the venison",
      },
      {
        description:
          "Stir in the tomatoes and kidney beans. Bring to a simmer and cook uncovered for 20 minutes, stirring occasionally, until the chilli has thickened. Taste and adjust seasoning. Serve with bread or rice.",
        title: "Simmer and serve",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 40,
      fat: 20,
      protein: 45,
    },
    prepTime: 10,
    primaryProtein: "other",
    serves: 4,
    source: "system",
    title: "Venison Chilli",
    totalTimeMinutes: 45,
    updatedAt: 1771363860081,
  },
  {
    _creationTime: 1771344763633.533,
    _id: "j9789q02nckxkp6t570h1fq0r181aq5w",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["other"],
    description:
      "Golden marinated tofu with broccoli and pepper over steamed rice—quick and satisfying.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/c1ac278e-c605-4962-b10e-02e0491e11bb",
    ingredients: [
      { amount: 300, name: "firm tofu", unit: "g" },
      {
        amount: 200,
        name: "broccoli",
        preparation: "chopped",
        unit: "g",
      },
      {
        amount: 1,
        name: "red bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 3, name: "soy sauce", unit: "tbsp" },
      { amount: 1, name: "sesame oil", unit: "tbsp" },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      {
        amount: 1,
        name: "ginger",
        preparation: "grated",
        unit: "piece",
      },
      { amount: 250, name: "rice", unit: "g" },
      {
        amount: 2,
        name: "spring onions",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "black sesame seeds",
        unit: "tbsp",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions. Keep warm. Press the tofu between kitchen paper to remove excess moisture, then cut into cubes. In a bowl, mix 1 tbsp soy sauce, half the sesame oil, half the garlic, and the ginger. Add the tofu and toss. Marinate for at least 10 minutes.",
        title: "Cook rice, press and marinate tofu",
      },
      {
        description:
          "Heat the remaining sesame oil in a non-stick wok or frying pan over medium-high heat. Add the tofu and fry until golden on all sides. Remove and set aside.",
        title: "Fry the tofu",
      },
      {
        description:
          "Add the broccoli and bell pepper to the pan and stir-fry for 4–5 minutes until tender-crisp. Return the tofu, add the remaining soy sauce and garlic, and toss for 1 minute. Serve over the rice, garnished with spring onions and sesame seeds.",
        title: "Stir-fry vegetables and serve",
      },
    ],
    nutrition: {
      calories: 450,
      carbohydrates: 60,
      fat: 15,
      protein: 25,
    },
    prepTime: 15,
    primaryProtein: "other",
    serves: 2,
    source: "system",
    title: "Tofu Stir-Fry with Broccoli and Peppers",
    totalTimeMinutes: 30,
    updatedAt: 1771363877089,
  },

  {
    _creationTime: 1771344763633.5334,
    _id: "j9719dj8a94bxt9ng6dfkd71jx81a3cd",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["chinese"],
    description:
      "Quick, colourful stir-fry with tender pork and crisp vegetables over rice.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/7dd84e82-bcc2-4512-a707-f4e3bb776cdd",
    ingredients: [
      {
        amount: 500,
        name: "pork loin",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 200,
        name: "broccoli",
        preparation: "chopped",
        unit: "g",
      },
      {
        amount: 1,
        name: "carrot",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 60, name: "soy sauce", unit: "ml" },
      {
        amount: 10,
        name: "ginger",
        preparation: "grated",
        unit: "g",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 300, name: "rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions (or use 2:1 water to rice, bring to a boil, then simmer covered for 15–18 minutes). Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "Heat 1 tbsp vegetable oil in a wok or large frying pan over high heat. Season the pork slices with a little salt and stir-fry until browned. Remove and set aside.",
        title: "Stir-fry the pork",
      },
      {
        description:
          "Add the remaining oil to the pan. Stir-fry the ginger and garlic for 30 seconds, then add the bell pepper, broccoli, and carrot. Cook for 3–4 minutes until tender but still crisp.",
        title: "Stir-fry the vegetables",
      },
      {
        description:
          "Return the pork to the pan, pour in the soy sauce, and toss everything together for 1–2 minutes. Serve over the cooked rice.",
        title: "Combine and serve",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 70,
      fat: 15,
      protein: 40,
    },
    prepTime: 15,
    primaryProtein: "pork",
    serves: 4,
    source: "system",
    title: "Pork Stir-Fry with Vegetables",
    totalTimeMinutes: 30,
    updatedAt: 1771363912961,
  },
  {
    _creationTime: 1771344763633.5337,
    _id: "j97c404m0j49q41qcfkfpkchbn81a22b",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 60,
    cuisine: ["british"],
    description:
      "Tender pork and sweet apples in a simple, comforting casserole.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/a8f66d3d-2492-44dd-ad6e-55e86ff3df0b",
    ingredients: [
      {
        amount: 800,
        name: "pork shoulder",
        preparation: "cubed",
        unit: "g",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 2,
        name: "apple",
        preparation: "quartered",
        unit: "whole",
      },
      { amount: 500, name: "chicken stock", unit: "ml" },
      { amount: 1, name: "thyme", unit: "sprig" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 180°C (160°C fan). Season the pork cubes with salt and pepper.",
        title: "Preheat and season",
      },
      {
        description:
          "Heat the olive oil in a large ovenproof casserole over medium-high heat. Brown the pork in batches so it colours well, then remove and set aside.",
        title: "Brown the pork",
      },
      {
        description:
          "In the same dish, soften the onion for a few minutes. Add the apples, thyme, and chicken stock. Return the pork and any resting juices, bring to a gentle simmer, then cover with a lid.",
        title: "Add aromatics and stock",
      },
      {
        description:
          "Transfer to the oven and bake for about 1 hour until the pork is tender. Check seasoning and serve with mash or crusty bread.",
        title: "Bake and serve",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 40,
      fat: 30,
      protein: 50,
    },
    prepTime: 20,
    primaryProtein: "pork",
    serves: 4,
    source: "system",
    title: "Pork and Apple Casserole",
    totalTimeMinutes: 80,
    updatedAt: 1771363931226,
  },
  {
    _creationTime: 1771344763633.534,
    _id: "j9754fs35jv8jw0pfmaqe1t00981af0x",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["mexican"],
    description:
      "Spiced pork mince in soft tortillas with a fresh tomato and coriander salsa.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/99c96073-f567-4de4-8fbb-b4771c68f023",
    ingredients: [
      { amount: 500, name: "pork mince", unit: "g" },
      { amount: 2, name: "taco seasoning", unit: "tbsp" },
      { amount: 8, name: "tortillas", unit: "piece" },
      {
        amount: 2,
        name: "tomato",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "red onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 1,
        name: "coriander",
        preparation: "chopped",
        unit: "bunch",
      },
      {
        amount: 1,
        name: "lime",
        preparation: "whole",
        unit: "whole",
      },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "In a large frying pan, heat the olive oil and fry the pork mince over medium-high heat, breaking it up with a spoon, until browned and no pink remains.",
        title: "Brown the pork",
      },
      {
        description:
          "Stir in the taco seasoning and a splash of water. Simmer for 4–5 minutes until the mixture is thick and fragrant.",
        title: "Season and simmer",
      },
      {
        description:
          "Meanwhile, mix the diced tomato, red onion, and chopped coriander in a bowl for the salsa. Warm the tortillas in a dry pan or microwave.",
        title: "Make the salsa and warm tortillas",
      },
      {
        description:
          "Fill the tortillas with the pork and top with the salsa and a squeeze of lime. Serve immediately.",
        title: "Assemble and serve",
      },
    ],
    nutrition: {
      calories: 450,
      carbohydrates: 35,
      fat: 20,
      protein: 30,
    },
    prepTime: 15,
    primaryProtein: "pork",
    serves: 4,
    source: "system",
    title: "Pork Tacos with Salsa",
    totalTimeMinutes: 30,
    updatedAt: 1771363948381,
  },
  {
    _creationTime: 1771344763633.5342,
    _id: "j97ejp7q64qhtez0c47saychx581a3ea",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 30,
    cuisine: ["other"],
    description:
      "Golden, crispy schnitzel with a tangy potato salad—a classic combo that never disappoints.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/710e3c67-6863-4e03-9fae-9781d2649a04",
    ingredients: [
      { amount: 500, name: "pork loin", unit: "g" },
      { amount: 100, name: "flour", unit: "g" },
      {
        amount: 1,
        name: "egg",
        preparation: "beaten",
        unit: "whole",
      },
      { amount: 100, name: "breadcrumbs", unit: "g" },
      { amount: 500, name: "potatoes", unit: "g" },
      { amount: 100, name: "mayonnaise", unit: "g" },
      { amount: 1, name: "mustard", unit: "tbsp" },
      {
        amount: 1,
        name: "parsley",
        preparation: "chopped",
        unit: "bunch",
      },
      { amount: 80, name: "vegetable or sunflower oil", unit: "ml" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Boil the potatoes in salted water until tender, about 15–20 minutes. Drain, leave to cool slightly, then slice or cube.",
        title: "Cook the potatoes",
      },
      {
        description:
          "Slice the pork loin into escalopes about 1 cm thick. Place between two sheets of cling film or in a bag and pound with a rolling pin or meat mallet until about 5 mm thick. Season both sides with salt and pepper.",
        title: "Flatten the pork",
      },
      {
        description:
          "Set up three shallow dishes: flour, beaten egg, and breadcrumbs. Coat each escalope in flour, then egg, then breadcrumbs, pressing so the crumbs stick.",
        title: "Coat the schnitzels",
      },
      {
        description:
          "Heat the oil in a large frying pan over medium-high heat. Fry the schnitzels in batches until golden and cooked through, about 2–3 minutes per side. Drain on kitchen paper. A hot pan gives a crisp crust without greasy results.",
        title: "Fry the schnitzels",
      },
      {
        description:
          "Mix the cooled potatoes with mayonnaise, mustard, and chopped parsley. Season to taste. Serve the schnitzels with the potato salad and a wedge of lemon if you like.",
        title: "Make the salad and serve",
      },
    ],
    nutrition: {
      calories: 700,
      carbohydrates: 50,
      fat: 40,
      protein: 45,
    },
    prepTime: 20,
    primaryProtein: "pork",
    serves: 4,
    source: "system",
    title: "Pork Schnitzel with Potato Salad",
    totalTimeMinutes: 50,
    updatedAt: 1771363966091,
  },
  {
    _creationTime: 1771344763633.5344,
    _id: "j97d4c30q2n2q2rs9jtcqda0ms81afjr",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["other"],
    description:
      "Succulent pork chops with a sticky honey-garlic glaze and tender green beans.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/b9bbc77f-3664-47b6-b729-23b3071a3d01",
    ingredients: [
      { amount: 4, name: "pork chops", unit: "whole" },
      { amount: 60, name: "honey", unit: "ml" },
      {
        amount: 4,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 30, name: "soy sauce", unit: "ml" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      {
        amount: 300,
        name: "green beans",
        preparation: "trimmed",
        unit: "g",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Mix the honey, garlic, and soy sauce in a small bowl. Season the pork chops with salt and pepper on both sides.",
        title: "Make the glaze and season chops",
      },
      {
        description:
          "Heat a grill or griddle pan to medium-high. Brush the chops with a little olive oil and grill for 5–6 minutes per side until well marked and nearly cooked through.",
        title: "Grill the chops",
      },
      {
        description:
          "Brush the chops with the honey-garlic glaze and cook for another minute or two on each side, until glossy and caramelised. Rest for a couple of minutes before serving.",
        title: "Glaze and rest",
      },
      {
        description:
          "Meanwhile, steam or boil the green beans until tender. Serve the chops with the beans and any remaining glaze drizzled over.",
        title: "Cook beans and serve",
      },
    ],
    nutrition: {
      calories: 600,
      carbohydrates: 25,
      fat: 30,
      protein: 40,
    },
    prepTime: 10,
    primaryProtein: "pork",
    serves: 4,
    source: "system",
    title: "Honey Garlic Pork Chops",
    totalTimeMinutes: 30,
    updatedAt: 1771363984978,
  },
  {
    _creationTime: 1771344763633.5347,
    _id: "j97cwmzj8dspnffpp9f51vphy581aet0",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 20,
    cuisine: ["italian"],
    description:
      "Creamy pasta with tender pork and golden mushrooms—simple and satisfying.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/1748551c-c293-4db8-9c94-f5566ae1398c",
    ingredients: [
      {
        amount: 400,
        name: "pork fillet",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 250,
        name: "mushrooms",
        preparation: "sliced",
        unit: "g",
      },
      { amount: 300, name: "pasta", unit: "g" },
      { amount: 100, name: "double cream", unit: "ml" },
      {
        amount: 50,
        name: "parmesan",
        preparation: "grated",
        unit: "g",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Bring a large pot of salted water to the boil and cook the pasta according to package instructions. Drain and reserve a little pasta water.",
        title: "Cook the pasta",
      },
      {
        description:
          "Season the pork slices with salt and pepper. Heat 1 tbsp olive oil in a large frying pan over medium-high heat and fry the pork until golden and just cooked through. Remove and set aside.",
        title: "Sear the pork",
      },
      {
        description:
          "In the same pan, add the remaining oil and fry the mushrooms until golden and any liquid has evaporated. Add the garlic and cook for 1 minute.",
        title: "Cook the mushrooms",
      },
      {
        description:
          "Lower the heat, pour in the cream and let it bubble gently for 2–3 minutes. Stir in the parmesan, return the pork and any resting juices, and toss. Add a splash of pasta water if the sauce is thick. Serve over the pasta.",
        title: "Finish the sauce and serve",
      },
    ],
    nutrition: {
      calories: 700,
      carbohydrates: 60,
      fat: 35,
      protein: 45,
    },
    prepTime: 15,
    primaryProtein: "pork",
    serves: 4,
    source: "system",
    title: "Pork and Mushroom Pasta",
    totalTimeMinutes: 35,
    updatedAt: 1771364002605,
  },
  {
    _creationTime: 1771344763633.535,
    _id: "j973asqmkgxs1gjje6wsq5pz8d81bk4b",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 480,
    cuisine: ["american"],
    description:
      "Fall-apart pulled pork in sticky BBQ sauce, piled into buns with coleslaw.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/b14ea576-7c09-415f-8754-567a2fba2aae",
    ingredients: [
      { amount: 1, name: "pork shoulder", unit: "kg" },
      { amount: 250, name: "BBQ sauce", unit: "ml" },
      { amount: 6, name: "buns", unit: "piece" },
      { amount: 300, name: "coleslaw", unit: "g" },
      {
        amount: 1,
        name: "onion",
        preparation: "sliced",
        unit: "whole",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Season the pork shoulder all over with salt and pepper. Place it in the slow cooker and pour over the BBQ sauce. Scatter the sliced onion around the meat.",
        title: "Prepare and add to slow cooker",
      },
      {
        description:
          "Cook on low for 8 hours (or high for 4–5) until the pork is tender and shreds easily with two forks.",
        title: "Slow cook",
      },
      {
        description:
          "Transfer the pork to a board and shred, discarding large pieces of fat. Skim excess fat from the cooking liquid if you like, then return the shredded pork to the sauce and toss.",
        title: "Shred the pork",
      },
      {
        description:
          "Warm the buns, pile with pulled pork and a spoonful of coleslaw. Serve with extra sauce and onion on the side.",
        title: "Assemble and serve",
      },
    ],
    nutrition: {
      calories: 800,
      carbohydrates: 70,
      fat: 30,
      protein: 50,
    },
    prepTime: 15,
    primaryProtein: "pork",
    serves: 6,
    source: "system",
    title: "BBQ Pulled Pork Sandwiches",
    totalTimeMinutes: 495,
    updatedAt: 1771364020345,
  },
  {
    _creationTime: 1771344763633.5352,
    _id: "j97aj0h0stzjym78z4zvy0jf7h81b221",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 30,
    cuisine: ["other"],
    description:
      "A hearty one-pan hash of spiced pork, sweet potato, and pepper—comforting and filling.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/89924574-0e63-4e65-b2e3-04568bc2b1e5",
    ingredients: [
      { amount: 500, name: "pork mince", unit: "g" },
      {
        amount: 400,
        name: "sweet potato",
        preparation: "diced",
        unit: "g",
      },
      {
        amount: 1,
        name: "red bell pepper",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "diced",
        unit: "whole",
      },
      { amount: 1, name: "paprika", unit: "tsp" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Heat the olive oil in a large frying pan over medium heat. Add the onion and cook until softened, about 5 minutes.",
        title: "Sauté the onion",
      },
      {
        description:
          "Add the diced sweet potato and a splash of water. Cover and cook for 8–10 minutes, stirring occasionally, until the sweet potato is tender.",
        title: "Cook the sweet potato",
      },
      {
        description:
          "Add the pork mince and break it up with a spoon. Cook until no pink remains, then add the bell pepper and paprika. Season with salt and pepper and fry for another 5 minutes until everything is golden and the pork is crisp in places.",
        title: "Add pork and finish",
      },
      {
        description:
          "Serve the hash as is, or with a fried egg on top and a simple green salad.",
        title: "Serve",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 50,
      fat: 25,
      protein: 35,
    },
    prepTime: 15,
    primaryProtein: "pork",
    serves: 4,
    source: "system",
    title: "Pork and Sweet Potato Hash",
    totalTimeMinutes: 45,
    updatedAt: 1771364037584,
  },
  {
    _creationTime: 1771344763633.5354,
    _id: "j972hns56x5kyh13gznjhk9a8981as1h",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["italian"],
    description:
      "Prawns in lemon garlic butter with spaghetti and parsley—quick and satisfying.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/e6821086-b05d-425d-9493-da72ce065c11",
    ingredients: [
      {
        amount: 500,
        name: "prawns",
        unit: "g",
      },
      { amount: 50, name: "butter", unit: "g" },
      {
        amount: 3,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 1, name: "lemon", unit: "whole" },
      { amount: 300, name: "spaghetti", unit: "g" },
      {
        amount: 20,
        name: "parsley",
        preparation: "chopped",
        unit: "g",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Bring a large pan of salted water to the boil and cook the spaghetti until al dente. Reserve a cup of pasta water, then drain.",
        title: "Cook the pasta",
      },
      {
        description:
          "Melt the butter in a large frying pan over medium heat. Add the garlic and cook for 1 minute until fragrant—don’t let it burn. Add the prawns and cook for 2–3 minutes until pink and just cooked through; overcooked prawns go rubbery.",
        title: "Cook the prawns in garlic butter",
      },
      {
        description:
          "Add the pasta to the pan with a splash of pasta water, the lemon juice, most of the parsley, and a pinch of salt. Toss well and serve with the remaining parsley on top.",
        title: "Combine and serve",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 60,
      fat: 20,
      protein: 30,
    },
    prepTime: 10,
    primaryProtein: "seafood",
    serves: 4,
    source: "system",
    title: "Lemon Garlic Butter Prawns",
    totalTimeMinutes: 25,
    updatedAt: 1771364054813,
  },
  {
    _creationTime: 1771344763633.5356,
    _id: "j978rxfk05zj851yt4ryyzh8x181bbpp",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 25,
    cuisine: ["thai"],
    description:
      "Thai green curry with white fish, pepper, and courgette—fragrant and creamy.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/8899b374-a5a5-41fc-80f2-4a8347dcebb0",
    ingredients: [
      {
        amount: 500,
        name: "white fish fillets",
        preparation: "cubed",
        unit: "g",
      },
      { amount: 400, name: "coconut milk", unit: "ml" },
      {
        amount: 2,
        name: "green curry paste",
        unit: "tbsp",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "courgette",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 10,
        name: "basil",
        preparation: "chopped",
        unit: "g",
      },
      { amount: 300, name: "rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Rinse the rice, then cook in a pan with the usual amount of water (or according to packet) until tender. Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "Heat the oil in a pan and fry the curry paste for 1–2 minutes. Add the thick part of the coconut milk and stir to combine, then pour in the rest. Bring to a gentle simmer, add the pepper and courgette, and cook for 4–5 minutes.",
        title: "Fry the paste and make the curry base",
      },
      {
        description:
          "Add the fish cubes and simmer for 4–6 minutes until just cooked—don’t stir too hard or the fish will break up. Season with a pinch of salt and stir in most of the basil. Serve over the rice with the remaining basil on top.",
        title: "Add the fish and serve",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 60,
      fat: 30,
      protein: 35,
    },
    prepTime: 15,
    primaryProtein: "seafood",
    serves: 4,
    source: "system",
    title: "Thai Green Curry with Fish",
    totalTimeMinutes: 40,
    updatedAt: 1771364072412,
  },
  {
    _creationTime: 1771344763633.536,
    _id: "j979gd7kan1wdj3wh4jp2fhab981axwx",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 25,
    cuisine: ["mediterranean"],
    description:
      "Salmon and roasted Mediterranean vegetables with herbs and lemon—one tray.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/9f18d13c-799d-41d7-b948-df592fdcace0",
    ingredients: [
      { amount: 4, name: "salmon fillets", unit: "fillet" },
      { amount: 30, name: "olive oil", unit: "ml" },
      { amount: 1, name: "mixed herbs", unit: "tbsp" },
      { amount: 1, name: "lemon", unit: "whole" },
      {
        amount: 250,
        name: "cherry tomatoes",
        preparation: "halved",
        unit: "g",
      },
      {
        amount: 1,
        name: "courgette",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "red onion",
        preparation: "sliced",
        unit: "whole",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 200°C (180°C fan). Toss the tomatoes, courgette, and onion with half the olive oil and a pinch of salt and pepper. Spread on a baking tray.",
        title: "Preheat and prepare the vegetables",
      },
      {
        description:
          "Nestle the salmon among the vegetables, drizzle with the remaining oil and lemon juice, and sprinkle with the herbs. Bake for 18–20 minutes until the salmon is just cooked and the vegetables are tender. Rest for 2–3 minutes before serving.",
        title: "Bake the salmon and serve",
      },
    ],
    nutrition: {
      calories: 700,
      carbohydrates: 20,
      fat: 40,
      protein: 40,
    },
    prepTime: 10,
    primaryProtein: "seafood",
    serves: 4,
    source: "system",
    title: "Mediterranean Baked Salmon",
    totalTimeMinutes: 35,
    updatedAt: 1771364090599,
  },
  {
    _creationTime: 1771344763633.5361,
    _id: "j97ft70300barxqqdwdkmha2s181b8y6",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["mexican"],
    description:
      "Pan-fried fish in tortillas with fresh mango, red onion, and coriander salsa.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/87a59fc2-a94e-4aa1-957a-7d8bf1c2375e",
    ingredients: [
      {
        amount: 400,
        name: "white fish fillets",
        preparation: "sliced",
        unit: "g",
      },
      { amount: 8, name: "tortillas", unit: "piece" },
      {
        amount: 1,
        name: "mango",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "red onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 10,
        name: "coriander",
        preparation: "chopped",
        unit: "g",
      },
      { amount: 1, name: "lime", unit: "whole" },
      { amount: 1, name: "cumin", unit: "tsp" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "In a bowl, mix the mango, red onion, most of the coriander, and the lime juice. Set the salsa aside. Warm the tortillas in a dry pan or over a gas flame.",
        title: "Make the salsa and warm tortillas",
      },
      {
        description:
          "Season the fish with the cumin, salt, and pepper. Heat the oil in a frying pan over medium-high heat and cook the fish for 2–3 minutes per side until golden and just cooked through. Flake into chunks.",
        title: "Cook the fish",
      },
      {
        description:
          "Fill the tortillas with the fish and top with the mango salsa and remaining coriander. Serve with lime wedges.",
        title: "Assemble and serve",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 65,
      fat: 15,
      protein: 25,
    },
    prepTime: 15,
    primaryProtein: "seafood",
    serves: 4,
    source: "system",
    title: "Fish Tacos with Mango Salsa",
    totalTimeMinutes: 35,
    updatedAt: 1771364106589,
  },
  {
    _creationTime: 1771344763633.5364,
    _id: "j97b2p8e52c7n69qtw01nyr96981b3kp",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 10,
    cuisine: ["chinese"],
    description:
      "Stir-fried fish with peppers, carrot, and broccoli in a tangy lemon-soy sauce.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/04353a42-c0e9-44b8-a257-7d1ca9bc9f30",
    ingredients: [
      {
        amount: 500,
        name: "white fish fillets",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "carrot",
        preparation: "julienned",
        unit: "whole",
      },
      {
        amount: 200,
        name: "broccoli",
        preparation: "chopped",
        unit: "g",
      },
      { amount: 1, name: "cornflour", unit: "tbsp" },
      { amount: 2, name: "soy sauce", unit: "tbsp" },
      { amount: 1, name: "lemon", unit: "whole" },
      { amount: 300, name: "rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "If serving with rice, start it first—cook according to packet instructions. In a small bowl, mix the soy sauce, cornflour, and lemon juice with 2 tbsp water. Set aside.",
        title: "Cook the rice and make the sauce",
      },
      {
        description:
          "Heat 1 tbsp oil in a wok or large frying pan over high heat. Add the fish and stir-fry for 2–3 minutes until just cooked; transfer to a plate. Add the remaining oil, then the pepper, carrot, and broccoli. Stir-fry for 3–4 minutes until tender-crisp.",
        title: "Stir-fry the fish and vegetables",
      },
      {
        description:
          "Return the fish to the pan, pour in the sauce, and toss until thickened. Serve immediately over rice or noodles.",
        title: "Add the sauce and serve",
      },
    ],
    nutrition: {
      calories: 450,
      carbohydrates: 55,
      fat: 10,
      protein: 30,
    },
    prepTime: 15,
    primaryProtein: "seafood",
    serves: 4,
    source: "system",
    title: "Chinese Lemon Fish Stir-Fry",
    totalTimeMinutes: 25,
    updatedAt: 1771364124844,
  },
  {
    _creationTime: 1771344763633.5366,
    _id: "j97cn4pta3z768zmk9vsz5kfpn81bfdg",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 30,
    cuisine: ["italian"],
    description:
      "Creamy risotto with prawns and chorizo—comforting and full of flavour.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/f65af4af-b8bd-49ba-b61e-0836ec6b3f04",
    ingredients: [
      {
        amount: 300,
        name: "prawns",
        unit: "g",
      },
      {
        amount: 100,
        name: "chorizo",
        preparation: "diced",
        unit: "g",
      },
      { amount: 300, name: "arborio rice", unit: "g" },
      { amount: 1, name: "chicken stock", unit: "l" },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      {
        amount: 50,
        name: "parmesan",
        preparation: "finely grated",
        unit: "g",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Warm the stock in a separate pan and keep at a gentle simmer. In a large pan, heat the oil and fry the chorizo for 2–3 minutes until it releases its oil. Add the onion and garlic and cook until soft, about 5 minutes.",
        title: "Warm the stock and fry the base",
      },
      {
        description:
          "Stir in the rice and cook for 1 minute. Add the stock a ladleful at a time, stirring often and waiting until each addition is mostly absorbed before adding the next. This takes about 20–25 minutes. When the rice is almost tender, add the prawns and cook for 2–3 minutes until pink and just cooked.",
        title: "Cook the risotto and add the prawns",
      },
      {
        description:
          "Take off the heat, stir in the Parmesan and a pinch of salt and pepper. Rest for 1–2 minutes, then serve.",
        title: "Finish and serve",
      },
    ],
    nutrition: {
      calories: 700,
      carbohydrates: 85,
      fat: 20,
      protein: 35,
    },
    prepTime: 10,
    primaryProtein: "seafood",
    serves: 4,
    source: "system",
    title: "Prawn and Chorizo Risotto",
    totalTimeMinutes: 40,
    updatedAt: 1771364143096,
  },
  {
    _creationTime: 1771344763633.5369,
    _id: "j97dyabeawmc4rtmqp3qm6n0cs81b4cy",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["mediterranean"],
    description:
      "Grilled whole sardines with lemon, garlic, and parsley—simple and bold.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/8d5e930f-50b7-446e-9770-3611e341bd20",
    ingredients: [
      {
        amount: 4,
        name: "sardines",
        preparation: "trimmed",
        unit: "whole",
      },
      { amount: 1, name: "lemon", unit: "whole" },
      {
        amount: 2,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 30, name: "olive oil", unit: "ml" },
      {
        amount: 10,
        name: "parsley",
        preparation: "chopped",
        unit: "g",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the grill to high. Drizzle the sardines with olive oil and lemon juice, then rub with the garlic and season with salt and pepper.",
        title: "Preheat and season the sardines",
      },
      {
        description:
          "Grill the sardines for 3–4 minutes on each side until the skin is charred and the flesh is cooked through. Rest for 1 minute.",
        title: "Grill the sardines",
      },
      {
        description:
          "Scatter with parsley and serve with lemon wedges and a drizzle of oil.",
        title: "Finish and serve",
      },
    ],
    nutrition: {
      calories: 400,
      carbohydrates: 5,
      fat: 25,
      protein: 30,
    },
    prepTime: 10,
    primaryProtein: "seafood",
    serves: 2,
    source: "system",
    title: "Grilled Sardines with Lemon and Garlic",
    totalTimeMinutes: 25,
    updatedAt: 1771364160249,
  },
  {
    _creationTime: 1771344763633.537,
    _id: "j974wxvg6wgq2hn37f1vgq6d0s81a4ar",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["chinese"],
    description:
      "Classic shrimp fried rice with peas, carrot, egg, and spring onion.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/23a0beb0-bfa6-43e4-8633-ab8cf3fdbe5e",
    ingredients: [
      {
        amount: 300,
        name: "shrimp",
        unit: "g",
      },
      { amount: 300, name: "rice", unit: "g" },
      { amount: 100, name: "peas", unit: "g" },
      {
        amount: 1,
        name: "carrot",
        preparation: "finely chopped",
        unit: "whole",
      },
      { amount: 3, name: "soy sauce", unit: "tbsp" },
      {
        amount: 2,
        name: "spring onion",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 2,
        name: "egg",
        preparation: "beaten",
        unit: "whole",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to packet instructions, then spread on a tray to cool and dry slightly—day-old or cooled rice works best for fried rice. Heat 1 tbsp oil in a wok or large frying pan over high heat. Add the shrimp and stir-fry until pink; transfer to a plate.",
        title: "Cook the rice and shrimp",
      },
      {
        description:
          "Add the remaining oil to the pan. Add the carrot and peas and stir-fry for 2 minutes. Add the rice and break up any lumps. Stir-fry for 3–4 minutes until the rice is hot and starting to crisp. Add the soy sauce and toss well.",
        title: "Fry the rice and vegetables",
      },
      {
        description:
          "Push the rice to one side, pour in the egg and scramble until just set, then mix through the rice. Return the shrimp, add most of the spring onion, and toss. Serve immediately with the remaining spring onion on top.",
        title: "Add egg and shrimp, then serve",
      },
    ],
    nutrition: {
      calories: 500,
      carbohydrates: 75,
      fat: 10,
      protein: 25,
    },
    prepTime: 10,
    primaryProtein: "seafood",
    serves: 4,
    source: "system",
    title: "Shrimp Fried Rice",
    totalTimeMinutes: 25,
    updatedAt: 1771364178161,
  },
  {
    _creationTime: 1771344763633.5374,
    _id: "j974hxy6f92sxrstv7gkr0etr581angv",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["mexican"],
    description:
      "Spiced turkey mince in crisp taco shells with lettuce, tomato, cheese, and sour cream.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/9cd3201a-250f-443e-ac47-b5270e2e48bc",
    ingredients: [
      { amount: 500, name: "turkey mince", unit: "g" },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 1, name: "chilli powder", unit: "tbsp" },
      { amount: 1, name: "cumin", unit: "tsp" },
      { amount: 8, name: "taco shells", unit: "piece" },
      {
        amount: 100,
        name: "lettuce",
        preparation: "shredded",
        unit: "g",
      },
      {
        amount: 2,
        name: "tomato",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 100,
        name: "cheddar cheese",
        preparation: "grated",
        unit: "g",
      },
      { amount: 100, name: "sour cream", unit: "g" },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Heat the olive oil in a large frying pan over medium heat. Sauté the onion until soft, then add the garlic and cook for 1 minute. Add the turkey mince and break it up with a spoon. Cook until no pink remains, then stir in the chilli powder and cumin and a pinch of salt. Cook for 2 minutes until fragrant.",
        title: "Cook the turkey",
      },
      {
        description:
          "Warm the taco shells in the oven according to package directions. Put the lettuce, tomato, cheese, and sour cream in bowls for topping.",
        title: "Warm shells and prepare toppings",
      },
      {
        description:
          "Fill the taco shells with the turkey mixture and top with lettuce, tomato, cheddar, and sour cream. Serve immediately.",
        title: "Assemble and serve",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 50,
      fat: 30,
      protein: 40,
    },
    prepTime: 15,
    primaryProtein: "turkey",
    serves: 4,
    source: "system",
    title: "Turkey Tacos",
    totalTimeMinutes: 30,
    updatedAt: 1771364197538,
  },
  {
    _creationTime: 1771344763633.5376,
    _id: "j978acqzr5n5jxaxykzjs8a55581azrv",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["chinese"],
    description:
      "Turkey and crisp vegetables in a savoury soy glaze over steamed rice.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/2e956b25-2886-4fbf-b6d4-195d2a2de97e",
    ingredients: [
      {
        amount: 500,
        name: "turkey breast",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 200,
        name: "broccoli",
        preparation: "chopped",
        unit: "g",
      },
      {
        amount: 1,
        name: "carrot",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 60, name: "soy sauce", unit: "ml" },
      {
        amount: 1,
        name: "ginger",
        preparation: "grated",
        unit: "piece",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 300, name: "rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions (or 2:1 water to rice, simmer covered 15–18 minutes). Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "Heat 1 tbsp olive oil in a wok or large frying pan over high heat. Season the turkey with a pinch of salt and stir-fry until golden and cooked through. Remove and set aside.",
        title: "Stir-fry the turkey",
      },
      {
        description:
          "Add the remaining oil, then the ginger, broccoli, bell pepper, and carrot. Stir-fry for 4–5 minutes until tender-crisp. Add a splash of water and cover briefly if the broccoli needs to soften.",
        title: "Stir-fry the vegetables",
      },
      {
        description:
          "Return the turkey to the pan, pour in the soy sauce and toss for 1 minute. Serve over the cooked rice.",
        title: "Add sauce and serve",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 60,
      fat: 15,
      protein: 45,
    },
    prepTime: 10,
    primaryProtein: "turkey",
    serves: 4,
    source: "system",
    title: "Turkey and Vegetable Stir-fry",
    totalTimeMinutes: 30,
    updatedAt: 1771364216162,
  },
  {
    _creationTime: 1771344763633.5378,
    _id: "j97ddpte1k8v9sxyvfafwkydgd81bhjr",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 30,
    cuisine: ["italian"],
    description:
      "Baked turkey meatballs with spaghetti and marinara—comforting and easy to scale up.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/b6588431-a46d-4086-8132-18c1651e5b48",
    ingredients: [
      { amount: 500, name: "turkey mince", unit: "g" },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "finely chopped",
        unit: "clove",
      },
      { amount: 50, name: "breadcrumbs", unit: "g" },
      {
        amount: 1,
        name: "egg",
        preparation: "beaten",
        unit: "whole",
      },
      { amount: 300, name: "spaghetti", unit: "g" },
      { amount: 400, name: "marinara sauce", unit: "g" },
      {
        amount: 50,
        name: "parmesan cheese",
        preparation: "finely grated",
        unit: "g",
      },
      {
        amount: 1,
        name: "basil",
        preparation: "chopped",
        unit: "bunch",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 190°C (170°C fan). In a bowl, combine the turkey mince, onion, garlic, breadcrumbs, beaten egg, salt, and pepper. Mix with your hands until just combined, then shape into balls and place on a baking tray.",
        title: "Shape the meatballs",
      },
      {
        description:
          "Bake the meatballs for 20 minutes until cooked through and lightly golden. Meanwhile, bring a large pot of salted water to the boil and cook the spaghetti according to package instructions. Drain. Heat the marinara sauce in a saucepan.",
        title: "Bake meatballs and cook pasta",
      },
      {
        description:
          "Serve the meatballs over the spaghetti, topped with the marinara sauce and sprinkled with parmesan and basil.",
        title: "Serve",
      },
    ],
    nutrition: {
      calories: 700,
      carbohydrates: 80,
      fat: 20,
      protein: 45,
    },
    prepTime: 15,
    primaryProtein: "turkey",
    serves: 4,
    source: "system",
    title: "Baked Turkey Meatballs with Spaghetti",
    totalTimeMinutes: 45,
    updatedAt: 1771364233432,
  },
  {
    _creationTime: 1771344763633.538,
    _id: "j973kgqx89x37x3gs8ew5e671181bg0s",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 35,
    cuisine: ["british"],
    description:
      "One-tray turkey thighs with sweet potato and spinach—minimal washing up, maximum flavour.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/9f6f49ee-4023-4f62-812f-6830b8aa768d",
    ingredients: [
      { amount: 500, name: "turkey thighs", unit: "g" },
      {
        amount: 400,
        name: "sweet potatoes",
        preparation: "cubed",
        unit: "g",
      },
      { amount: 200, name: "spinach", unit: "g" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 1, name: "paprika", unit: "tsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 200°C (180°C fan). In a large baking tray, toss the turkey thighs and sweet potato cubes with the olive oil, paprika, salt, and pepper. Spread in a single layer so everything roasts evenly.",
        title: "Preheat and arrange the tray",
      },
      {
        description:
          "Roast for 30 minutes until the turkey is cooked through and the sweet potato is tender. Scatter the spinach over the tray and return to the oven for 3–5 minutes until wilted. Rest the turkey for a few minutes before serving.",
        title: "Bake and add spinach",
      },
    ],
    nutrition: {
      calories: 600,
      carbohydrates: 45,
      fat: 25,
      protein: 50,
    },
    prepTime: 10,
    primaryProtein: "turkey",
    serves: 4,
    source: "system",
    title: "Turkey and Spinach Traybake",
    totalTimeMinutes: 45,
    updatedAt: 1771364251139,
  },
  {
    _creationTime: 1771344763633.5383,
    _id: "j97ftamn3qb21rdbpgv0ddc76n81a0e3",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["chinese"],
    description:
      "Crisp golden tofu and colourful vegetables in a savoury soy glaze over steamed rice.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/635cc28a-c379-4f02-b90e-ea17d65981a0",
    ingredients: [
      { amount: 400, name: "tofu", unit: "g" },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 2,
        name: "carrot",
        preparation: "thinly sliced",
        unit: "whole",
      },
      {
        amount: 200,
        name: "broccoli",
        preparation: "chopped",
        unit: "g",
      },
      { amount: 60, name: "soy sauce", unit: "ml" },
      { amount: 300, name: "rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions (or 2:1 water to rice, simmer covered 15–18 minutes). Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "Press the tofu between kitchen paper or a clean tea towel to remove excess moisture—dry tofu browns better. Cut into cubes. Heat 1 tbsp oil in a wok or large frying pan over high heat and fry the tofu until golden on all sides. Remove and set aside.",
        title: "Press and fry the tofu",
      },
      {
        description:
          "Add the remaining oil to the pan. Stir-fry the bell pepper, carrot, and broccoli for 4–5 minutes until tender-crisp. Add a splash of water and cover briefly if the broccoli needs to soften.",
        title: "Stir-fry the vegetables",
      },
      {
        description:
          "Return the tofu to the pan, add the soy sauce and toss for 1 minute. Serve over the cooked rice.",
        title: "Combine and serve",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 70,
      fat: 22,
      protein: 20,
    },
    prepTime: 10,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Vegetable Stir-Fry",
    totalTimeMinutes: 25,
    updatedAt: 1771364268823,
  },
  {
    _creationTime: 1771344763633.5386,
    _id: "j9771tyh09ga6x9exyxhv15vf981b6ap",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 30,
    cuisine: ["indian"],
    description:
      "Creamy chickpea and spinach curry with coconut milk—comforting and full of flavour.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/25940656-bce5-49a5-a18b-f394a02962ee",
    ingredients: [
      {
        amount: 400,
        name: "chickpeas",
        preparation: "drained",
        unit: "g",
      },
      { amount: 400, name: "coconut milk", unit: "ml" },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      {
        amount: 20,
        name: "ginger",
        preparation: "grated",
        unit: "g",
      },
      {
        amount: 200,
        name: "spinach",
        preparation: "roughly chopped",
        unit: "g",
      },
      { amount: 2, name: "curry powder", unit: "tbsp" },
      { amount: 300, name: "rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions. Keep warm.",
        title: "Cook the rice",
      },
      {
        description:
          "Heat the oil in a large pan over medium heat. Sauté the onion until soft, then add the garlic and ginger and cook for 1 minute. Stir in the curry powder and cook for 30 seconds to toast the spices.",
        title: "Sauté aromatics and toast spices",
      },
      {
        description:
          "Add the chickpeas and stir to coat. Pour in the coconut milk and simmer for 12–15 minutes until the sauce has thickened slightly.",
        title: "Add chickpeas and coconut milk",
      },
      {
        description:
          "Stir in the spinach and cook until wilted. Season with salt to taste. Serve the curry over the cooked rice.",
        title: "Add spinach and serve",
      },
    ],
    nutrition: {
      calories: 600,
      carbohydrates: 80,
      fat: 25,
      protein: 18,
    },
    prepTime: 10,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Chickpea Curry",
    totalTimeMinutes: 40,
    updatedAt: 1771364285711,
  },
  {
    _creationTime: 1771344763633.5388,
    _id: "j97cepkbg5nxkrdr2arbrxkeen81a1ga",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 10,
    cuisine: ["mexican"],
    description:
      "Spiced black beans in soft tortillas with fresh tomato salsa and creamy avocado.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/4ffac563-500f-48f2-a26c-686005ddc062",
    ingredients: [
      {
        amount: 400,
        name: "black beans",
        preparation: "drained",
        unit: "g",
      },
      { amount: 2, name: "taco seasoning", unit: "tbsp" },
      { amount: 8, name: "tortillas", unit: "whole" },
      {
        amount: 1,
        name: "avocado",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 2,
        name: "tomato",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 1,
        name: "coriander",
        preparation: "chopped",
        unit: "bunch",
      },
      { amount: 1, name: "olive oil", unit: "tbsp" },
      { amount: 1, name: "lime", unit: "whole" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "In a pan, heat the olive oil and add the black beans with their liquid (or a splash of water if drained). Stir in the taco seasoning and simmer for 5 minutes, mashing some of the beans so the mixture thickens slightly.",
        title: "Prepare the beans",
      },
      {
        description:
          "In a bowl, mix the tomato, onion, and coriander for the salsa. Warm the tortillas in a dry pan or over a gas flame.",
        title: "Make the salsa and warm tortillas",
      },
      {
        description:
          "Fill the tortillas with the spiced beans and top with the salsa, avocado, and a squeeze of lime. Serve immediately.",
        title: "Assemble and serve",
      },
    ],
    nutrition: {
      calories: 450,
      carbohydrates: 55,
      fat: 20,
      protein: 15,
    },
    prepTime: 15,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Vegetarian Tacos",
    totalTimeMinutes: 25,
    updatedAt: 1771364303520,
  },
  {
    _creationTime: 1771344763633.539,
    _id: "j97bemnc5b3w1z3s0gsez157g581bwb7",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["italian"],
    description:
      "Pasta tossed with tender courgette, pepper, and carrot in a vibrant pesto sauce.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/003bbb8a-4b4b-4060-8433-157ea52b2c4c",
    ingredients: [
      { amount: 300, name: "pasta", unit: "g" },
      {
        amount: 1,
        name: "courgette",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "carrot",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 100, name: "pesto", unit: "g" },
      {
        amount: 40,
        name: "parmesan",
        preparation: "finely grated",
        unit: "g",
      },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Bring a large pot of salted water to the boil and cook the pasta according to package instructions. Drain and reserve a little pasta water.",
        title: "Cook the pasta",
      },
      {
        description:
          "In a large frying pan, heat the olive oil and sauté the courgette, bell pepper, and carrot for 5–7 minutes until tender but still bright. Season with a pinch of salt and pepper.",
        title: "Sauté the vegetables",
      },
      {
        description:
          "Add the cooked pasta and pesto to the pan. Toss well, adding a splash of pasta water if needed to coat the pasta. Serve with grated parmesan and extra black pepper.",
        title: "Combine and serve",
      },
    ],
    nutrition: {
      calories: 600,
      carbohydrates: 80,
      fat: 22,
      protein: 18,
    },
    prepTime: 10,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Pasta Primavera",
    totalTimeMinutes: 30,
    updatedAt: 1771364318769,
  },
  {
    _creationTime: 1771344763633.5393,
    _id: "j972pbem3wk0d5f41z2k35dm7d81bfqg",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 30,
    cuisine: ["italian"],
    description:
      "Creamy arborio rice with golden mushrooms and sweet peas—stir often for the best texture.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/13be8f83-f6ec-4c7f-9525-50bbc93ff723",
    ingredients: [
      { amount: 300, name: "arborio rice", unit: "g" },
      {
        amount: 250,
        name: "mushrooms",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 1,
        name: "onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 1, name: "vegetable stock", unit: "l" },
      {
        amount: 100,
        name: "peas",
        preparation: "frozen",
        unit: "g",
      },
      {
        amount: 40,
        name: "parmesan",
        preparation: "finely grated",
        unit: "g",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Keep the vegetable stock warm in a separate pan. Heat 1 tbsp oil in a large pan and fry the mushrooms until golden. Remove and set aside. In the same pan, add the remaining oil and sauté the onion until soft, then add the garlic and cook for 1 minute.",
        title: "Fry mushrooms and sauté aromatics",
      },
      {
        description:
          "Stir in the arborio rice and cook for 1–2 minutes until the grains look translucent at the edges. Add the stock a ladle at a time, stirring frequently and waiting until each addition is absorbed before adding more. This gives you a creamy risotto.",
        title: "Add rice and stock gradually",
      },
      {
        description:
          "When the rice is almost tender, stir in the mushrooms and peas. Cook for 2–3 minutes more. Off the heat, stir in the parmesan and season with salt and pepper. Serve immediately.",
        title: "Finish and serve",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 100,
      fat: 18,
      protein: 14,
    },
    prepTime: 10,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Mushroom Risotto",
    totalTimeMinutes: 40,
    updatedAt: 1771364335907,
  },
  {
    _creationTime: 1771344763633.5396,
    _id: "j97dydasry9e43kyf8vmykkryn81ad13",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 10,
    cuisine: ["italian"],
    description:
      "Classic Caprese: ripe tomatoes, milky mozzarella, and basil with garlicky toasted bread.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/75a81ce2-a5c4-4972-b615-9b8b8998ab3f",
    ingredients: [
      {
        amount: 250,
        name: "mozzarella",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 4,
        name: "tomatoes",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "basil",
        preparation: "whole",
        unit: "bunch",
      },
      { amount: 1, name: "bread", unit: "loaf" },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Slice the bread. Mix the garlic with 1 tbsp olive oil, spread on the bread, and toast under the grill or in a hot pan until golden.",
        title: "Make the garlic bread",
      },
      {
        description:
          "Arrange the tomato and mozzarella slices on a platter, alternating and overlapping. Tear over the basil leaves and drizzle with the remaining olive oil. Season with salt and pepper.",
        title: "Assemble the salad",
      },
      {
        description:
          "Serve the Caprese with the warm garlic bread on the side.",
        title: "Serve",
      },
    ],
    nutrition: {
      calories: 400,
      carbohydrates: 40,
      fat: 20,
      protein: 15,
    },
    prepTime: 15,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Caprese Salad with Garlic Bread",
    totalTimeMinutes: 25,
    updatedAt: 1771364351314,
  },
  {
    _creationTime: 1771344763633.5398,
    _id: "j97em146ath0vwp3rkwevsx39d81bwch",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 25,
    cuisine: ["mediterranean"],
    description:
      "Fluffy quinoa with roasted courgette, pepper, and onion, topped with feta and lemon.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/d6a3f034-a56d-4402-8012-445a5e6849c8",
    ingredients: [
      {
        amount: 200,
        name: "quinoa",
        preparation: "rinsed",
        unit: "g",
      },
      {
        amount: 1,
        name: "courgette",
        preparation: "cubed",
        unit: "whole",
      },
      {
        amount: 1,
        name: "red onion",
        preparation: "quartered",
        unit: "whole",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "cubed",
        unit: "whole",
      },
      {
        amount: 100,
        name: "feta cheese",
        preparation: "cubed",
        unit: "g",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      {
        amount: 1,
        name: "lemon",
        preparation: "whole",
        unit: "whole",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Rinse the quinoa under cold water, then cook according to package instructions (usually 1 part quinoa to 2 parts water, simmer covered for 15 minutes). Fluff with a fork and set aside.",
        title: "Cook the quinoa",
      },
      {
        description:
          "Preheat the oven to 200°C (180°C fan). Toss the courgette, red onion, and bell pepper with 1 tbsp olive oil, salt, and pepper. Spread on a baking tray and roast for 20 minutes until tender and slightly charred.",
        title: "Roast the vegetables",
      },
      {
        description:
          "Divide the quinoa among bowls. Top with the roasted vegetables, crumbled feta, a drizzle of olive oil, and a squeeze of lemon. Serve warm or at room temperature.",
        title: "Assemble and serve",
      },
    ],
    nutrition: {
      calories: 500,
      carbohydrates: 70,
      fat: 18,
      protein: 15,
    },
    prepTime: 15,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Mediterranean Quinoa Bowl",
    totalTimeMinutes: 40,
    updatedAt: 1771364366704,
  },
  {
    _creationTime: 1771344763633.54,
    _id: "j978ysme8mjxt4crsady3cnc2x81awyn",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 30,
    cuisine: ["mexican"],
    description:
      "Bell peppers stuffed with spiced rice, black beans, and corn, topped with melted cheese.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/6157f864-2770-4e9b-a952-a1c9b48764ec",
    ingredients: [
      { amount: 4, name: "bell peppers", unit: "whole" },
      { amount: 200, name: "rice", unit: "g" },
      {
        amount: 400,
        name: "black beans",
        preparation: "drained",
        unit: "g",
      },
      {
        amount: 150,
        name: "corn",
        preparation: "drained",
        unit: "g",
      },
      { amount: 1, name: "cumin", unit: "tbsp" },
      {
        amount: 100,
        name: "cheddar cheese",
        preparation: "grated",
        unit: "g",
      },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the rice according to package instructions. Keep warm. Cut the tops off the peppers and remove the seeds and membranes. Place in a baking dish that holds them upright.",
        title: "Cook the rice and prepare the peppers",
      },
      {
        description:
          "In a bowl, mix the cooked rice, black beans, corn, cumin, and a pinch of salt. Spoon the mixture into the peppers, packing gently. Drizzle the peppers with a little olive oil.",
        title: "Make the stuffing and fill the peppers",
      },
      {
        description:
          "Top each pepper with the cheddar. Bake at 180°C (160°C fan) for 25–30 minutes until the peppers are tender and the cheese is melted and golden. Rest for 5 minutes before serving.",
        title: "Bake and serve",
      },
    ],
    nutrition: {
      calories: 600,
      carbohydrates: 80,
      fat: 18,
      protein: 20,
    },
    prepTime: 15,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Stuffed Peppers",
    totalTimeMinutes: 45,
    updatedAt: 1771364384401,
  },
  {
    _creationTime: 1771344763633.5403,
    _id: "j978qxf5pdqf8sn7tpd19wvem981amg1",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 45,
    cuisine: ["italian"],
    description:
      "Layers of pasta, ricotta, roasted veg, and spinach in a rich marinara—comforting and satisfying.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/73718ddd-c2a6-494c-a2b4-2ade25265366",
    ingredients: [
      { amount: 12, name: "lasagna sheets", unit: "sheet" },
      {
        amount: 1,
        name: "courgette",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "red bell pepper",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 200,
        name: "spinach",
        preparation: "chopped",
        unit: "g",
      },
      { amount: 250, name: "ricotta cheese", unit: "g" },
      { amount: 200, name: "grated mozzarella", unit: "g" },
      { amount: 500, name: "marinara sauce", unit: "ml" },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 1, name: "dried oregano", unit: "tsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 180°C (160°C fan). Heat the olive oil in a large frying pan and sauté the courgette and red bell pepper until softened. Add the spinach and cook until wilted. Season with salt and pepper and set aside.",
        title: "Sauté the vegetables",
      },
      {
        description:
          "Spread a thin layer of marinara in the base of a baking dish. Layer with lasagna sheets (no need to pre-cook if using fresh or oven-ready), then half the vegetable mix, dollops of ricotta, a little mozzarella, and oregano. Repeat, finishing with marinara and a good layer of mozzarella on top.",
        title: "Assemble the lasagna",
      },
      {
        description:
          "Cover with foil and bake for 30 minutes. Remove the foil and bake for another 15 minutes until the top is golden and bubbling. Rest for 10 minutes before cutting—this helps the layers set.",
        title: "Bake and rest",
      },
    ],
    nutrition: {
      calories: 550,
      carbohydrates: 60,
      fat: 25,
      protein: 25,
    },
    prepTime: 20,
    primaryProtein: "vegetarian",
    serves: 6,
    source: "system",
    title: "Vegetable Lasagna",
    totalTimeMinutes: 65,
    updatedAt: 1771364401448,
  },
  {
    _creationTime: 1771344763633.5405,
    _id: "j97c1z5vdwgzfkzff4b77sqncn81agr3",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 35,
    cuisine: ["mediterranean"],
    description:
      "Baked sweet potatoes filled with spiced chickpeas and wilted spinach—hearty and satisfying.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/35880799-01a5-427b-a83c-896ec75a994d",
    ingredients: [
      { amount: 4, name: "sweet potatoes", unit: "whole" },
      {
        amount: 400,
        name: "canned chickpeas",
        preparation: "drained",
        unit: "g",
      },
      {
        amount: 200,
        name: "spinach",
        preparation: "chopped",
        unit: "g",
      },
      {
        amount: 1,
        name: "red onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 1, name: "cumin", unit: "tsp" },
      { amount: 1, name: "coriander", unit: "tsp" },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 200°C (180°C fan). Pierce the sweet potatoes with a fork and bake for 30–35 minutes until tender when squeezed.",
        title: "Bake the sweet potatoes",
      },
      {
        description:
          "Meanwhile, heat the olive oil in a frying pan and sauté the red onion until soft. Add the garlic, cumin, and coriander and cook for 1 minute. Add the chickpeas and roughly mash about half with the back of a spoon so the mix holds together. Stir in the spinach until wilted. Season with salt and pepper.",
        title: "Make the filling",
      },
      {
        description:
          "Slice the baked sweet potatoes open and fluff the flesh with a fork. Fill with the chickpea and spinach mixture and serve warm.",
        title: "Stuff and serve",
      },
    ],
    nutrition: {
      calories: 450,
      carbohydrates: 75,
      fat: 10,
      protein: 15,
    },
    prepTime: 10,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Chickpea and Spinach Stuffed Sweet Potatoes",
    totalTimeMinutes: 45,
    updatedAt: 1771364428792,
  },
  {
    _creationTime: 1771344763633.5408,
    _id: "j973pra0yq58de7q6x01xhyfgd81bgv4",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 30,
    cuisine: ["thai"],
    description:
      "Creamy Thai red curry with golden tofu, pepper, broccoli, and carrot over jasmine rice.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/eab45115-6b1f-447f-9f0a-c419941528be",
    ingredients: [
      { amount: 400, name: "tofu", unit: "g" },
      { amount: 400, name: "coconut milk", unit: "ml" },
      { amount: 3, name: "red curry paste", unit: "tbsp" },
      {
        amount: 1,
        name: "red bell pepper",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 200,
        name: "broccoli",
        preparation: "chopped",
        unit: "g",
      },
      {
        amount: 1,
        name: "carrot",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 2, name: "soy sauce", unit: "tbsp" },
      {
        amount: 1,
        name: "fresh coriander",
        preparation: "chopped",
        unit: "bunch",
      },
      { amount: 300, name: "jasmine rice", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Cook the jasmine rice according to package instructions. Keep warm. Press the tofu between kitchen paper to remove excess moisture, then cut into cubes. Heat the vegetable oil in a large pan and fry the tofu until golden on all sides. Remove and set aside.",
        title: "Cook the rice and fry the tofu",
      },
      {
        description:
          "In the same pan, fry the red curry paste for 1–2 minutes until fragrant. Add the thick part of the coconut milk first and stir to form a paste, then add the rest of the milk. Bring to a gentle simmer.",
        title: "Fry the paste and add coconut milk",
      },
      {
        description:
          "Add the red bell pepper, broccoli, and carrot. Simmer for 8–10 minutes until the vegetables are tender. Return the tofu, add the soy sauce and simmer for 2–3 minutes. Stir in most of the coriander. Serve over the rice with the remaining coriander on top.",
        title: "Add vegetables and finish",
      },
    ],
    nutrition: {
      calories: 650,
      carbohydrates: 65,
      fat: 35,
      protein: 20,
    },
    prepTime: 15,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Thai Red Curry with Tofu",
    totalTimeMinutes: 45,
    updatedAt: 1771364553261,
  },
  {
    _creationTime: 1771344763633.541,
    _id: "j970z3y7gtg0chxgf4mmgddhpn81amk3",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 30,
    cuisine: ["mexican"],
    description:
      "Hearty two-bean chilli with peppers and tomatoes—great with bread, rice, or tortilla chips.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/35283d88-06c4-403d-bd9c-747575e63a38",
    ingredients: [
      {
        amount: 400,
        name: "canned kidney beans",
        preparation: "drained",
        unit: "g",
      },
      {
        amount: 400,
        name: "canned black beans",
        preparation: "drained",
        unit: "g",
      },
      {
        amount: 1,
        name: "red onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 1,
        name: "bell pepper",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      {
        amount: 400,
        name: "canned chopped tomatoes",
        unit: "g",
      },
      { amount: 2, name: "chili powder", unit: "tbsp" },
      { amount: 1, name: "cumin", unit: "tsp" },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Heat the olive oil in a large pot over medium heat. Sauté the red onion and bell pepper until softening, then add the garlic and cook for 1 minute. Stir in the chili powder and cumin and cook for 30 seconds to toast the spices.",
        title: "Sauté vegetables and spices",
      },
      {
        description:
          "Add the kidney beans, black beans, and chopped tomatoes. Bring to a simmer, then reduce the heat and cook uncovered for 15–20 minutes until the chilli has thickened. Season with salt and pepper.",
        title: "Add beans and simmer",
      },
      {
        description:
          "Serve the chilli hot with bread, rice, or tortilla chips. A dollop of yogurt or sour cream and a squeeze of lime work well on top.",
        title: "Serve",
      },
    ],
    nutrition: {
      calories: 500,
      carbohydrates: 80,
      fat: 10,
      protein: 25,
    },
    prepTime: 15,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Vegetarian Chili",
    totalTimeMinutes: 45,
    updatedAt: 1771364572902,
  },
  {
    _creationTime: 1771344763633.5413,
    _id: "j97c1wmtqn5sc2tzjveenx1p3h81aesn",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["mexican"],
    description:
      "Crisp quesadillas stuffed with garlicky mushrooms, spinach, and melted cheese—serve with salsa.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/c4992592-7027-4334-8c98-0249af3d6fa5",
    ingredients: [
      { amount: 4, name: "tortillas", unit: "whole" },
      {
        amount: 250,
        name: "mushrooms",
        preparation: "sliced",
        unit: "g",
      },
      {
        amount: 150,
        name: "spinach",
        preparation: "chopped",
        unit: "g",
      },
      { amount: 200, name: "grated cheese", unit: "g" },
      { amount: 1, name: "olive oil", unit: "tbsp" },
      {
        amount: 1,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 200, name: "salsa", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Heat the olive oil in a frying pan and sauté the mushrooms over medium-high heat until golden and any liquid has evaporated. Add the garlic and cook for 1 minute, then add the spinach and stir until wilted. Season with salt and pepper and set aside.",
        title: "Sauté the filling",
      },
      {
        description:
          "Lay the tortillas flat. Spread the mushroom and spinach mixture over one half of each, then sprinkle with the cheese. Fold the empty half over to cover.",
        title: "Assemble the quesadillas",
      },
      {
        description:
          "Wipe the pan and return to medium heat. Cook each quesadilla for 2–3 minutes per side until golden and the cheese has melted. Cut into wedges and serve with the salsa on the side.",
        title: "Cook and serve",
      },
    ],
    nutrition: {
      calories: 450,
      carbohydrates: 40,
      fat: 20,
      protein: 20,
    },
    prepTime: 10,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Mushroom and Spinach Quesadillas",
    totalTimeMinutes: 25,
    updatedAt: 1771364590389,
  },
  {
    _creationTime: 1771344763633.5415,
    _id: "j974qgjdrg2bg70fnxsk5vssm181asje",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 25,
    cuisine: ["mediterranean"],
    description:
      "Roasted peppers, aubergine, and courgette in a wrap with creamy hummus—simple and satisfying.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/b2d625c8-1c28-44a8-98ad-1b62479577a8",
    ingredients: [
      { amount: 4, name: "wholemeal wraps", unit: "whole" },
      {
        amount: 2,
        name: "bell peppers",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "aubergine",
        preparation: "sliced",
        unit: "whole",
      },
      {
        amount: 1,
        name: "courgette",
        preparation: "sliced",
        unit: "whole",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 200, name: "hummus", unit: "g" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 200°C (180°C fan). Toss the bell peppers, aubergine, and courgette with the olive oil, salt, and pepper on a baking tray. Spread in a single layer and roast for 25 minutes until tender and slightly charred.",
        title: "Roast the vegetables",
      },
      {
        description:
          "Warm the wraps briefly in a dry pan or the microwave so they roll without cracking. Spread each with hummus and pile with the roasted vegetables. Roll tightly, tucking in the sides.",
        title: "Assemble the wraps",
      },
      {
        description: "Slice each wrap in half and serve straight away.",
        title: "Serve",
      },
    ],
    nutrition: {
      calories: 400,
      carbohydrates: 45,
      fat: 20,
      protein: 10,
    },
    prepTime: 10,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Roasted Vegetable and Hummus Wrap",
    totalTimeMinutes: 35,
    updatedAt: 1771364609007,
  },
  {
    _creationTime: 1771344763633.5417,
    _id: "j972ft3xptrmnz7nznas40re8181ba70",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 20,
    cuisine: ["italian"],
    description:
      "Spaghetti in a punchy tomato sauce with olives, capers, and chilli—bold and simple.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/94e75661-0946-4f58-b1b6-913d773f79ad",
    ingredients: [
      { amount: 300, name: "spaghetti", unit: "g" },
      {
        amount: 400,
        name: "canned chopped tomatoes",
        unit: "g",
      },
      {
        amount: 100,
        name: "black olives",
        preparation: "sliced",
        unit: "g",
      },
      { amount: 50, name: "capers", unit: "g" },
      {
        amount: 3,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 2, name: "olive oil", unit: "tbsp" },
      { amount: 1, name: "red chili flakes", unit: "tsp" },
      {
        amount: 1,
        name: "fresh basil",
        preparation: "chopped",
        unit: "bunch",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Bring a large pot of salted water to the boil and cook the spaghetti according to package instructions. Drain and reserve a little pasta water.",
        title: "Cook the pasta",
      },
      {
        description:
          "In a large frying pan, heat the olive oil and fry the garlic and chilli flakes for 1 minute—don’t let the garlic burn. Add the tomatoes, olives, and capers. Simmer for 10 minutes until the sauce has thickened. Season with salt and pepper.",
        title: "Make the sauce",
      },
      {
        description:
          "Add the spaghetti to the sauce and toss well, adding a splash of pasta water if needed. Tear in most of the basil and serve with the rest on top.",
        title: "Combine and serve",
      },
    ],
    nutrition: {
      calories: 600,
      carbohydrates: 85,
      fat: 20,
      protein: 15,
    },
    prepTime: 10,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Pasta Puttanesca with Olives and Capers",
    totalTimeMinutes: 30,
    updatedAt: 1771364629759,
  },
  {
    _creationTime: 1771344763633.542,
    _id: "j97chdr1fha28ybsd5fptvysf181b84q",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 30,
    cuisine: ["indian"],
    description:
      "Fragrant basmati rice with carrot, peas, and warm spices—a satisfying one-pot centrepiece.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/1eb1926f-1750-4a60-8fe1-490e1cb164c8",
    ingredients: [
      { amount: 300, name: "basmati rice", unit: "g" },
      {
        amount: 1,
        name: "carrot",
        preparation: "diced",
        unit: "whole",
      },
      { amount: 150, name: "green peas", unit: "g" },
      {
        amount: 1,
        name: "onion",
        preparation: "thinly sliced",
        unit: "whole",
      },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      {
        amount: 1,
        name: "ginger",
        preparation: "grated",
        unit: "piece",
      },
      { amount: 1, name: "cumin seeds", unit: "tsp" },
      { amount: 1, name: "coriander powder", unit: "tsp" },
      { amount: 0.5, name: "turmeric powder", unit: "tsp" },
      { amount: 600, name: "vegetable stock", unit: "ml" },
      {
        amount: 1,
        name: "fresh coriander",
        preparation: "chopped",
        unit: "bunch",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Heat oil in a large pan, add cumin seeds, and sauté until aromatic. Add onions, garlic, and ginger, cooking until softened.",
        title: "Prepare the base",
      },
      {
        description:
          "Stir in coriander powder, turmeric, carrot, and peas, cooking for a few minutes.",
        title: "Add spices and vegetables",
      },
      {
        description:
          "Add basmati rice and vegetable stock. Bring to a boil, cover, and simmer for 20 minutes until the rice is cooked and liquid is absorbed.",
        title: "Cook the rice",
      },
      {
        description:
          "Fluff the biryani with a fork, stir in chopped coriander, and serve hot.",
        title: "Finish and serve",
      },
    ],
    nutrition: {
      calories: 480,
      carbohydrates: 92,
      fat: 8,
      protein: 12,
    },
    prepTime: 20,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Vegetable Biryani",
    totalTimeMinutes: 50,
    updatedAt: 1771364647549,
  },
  {
    _creationTime: 1771344763633.5422,
    _id: "j972f3jt37bq7mzzjazkczkt4s81abhh",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 0,
    cuisine: ["mediterranean"],
    description:
      "Chickpeas, cucumber, tomato, and feta with a lemony dressing—fresh, filling, and quick.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/05d2cb58-efdc-4ff7-b569-aca012cf1efd",
    ingredients: [
      {
        amount: 400,
        name: "canned chickpeas",
        preparation: "drained",
        unit: "g",
      },
      {
        amount: 1,
        name: "cucumber",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 2,
        name: "tomato",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 0.5,
        name: "red onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      {
        amount: 100,
        name: "feta cheese",
        preparation: "crumbled",
        unit: "g",
      },
      {
        amount: 1,
        name: "fresh parsley",
        preparation: "chopped",
        unit: "bunch",
      },
      { amount: 3, name: "olive oil", unit: "tbsp" },
      {
        amount: 1,
        name: "lemon",
        preparation: "whole",
        unit: "whole",
      },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "In a large bowl, combine the chickpeas, cucumber, tomato, red onion, feta, and parsley.",
        title: "Combine the salad ingredients",
      },
      {
        description:
          "In a small bowl, whisk together the olive oil, lemon juice, salt, and pepper. Taste and adjust—the dressing should balance the richness of the feta.",
        title: "Make the dressing",
      },
      {
        description:
          "Pour the dressing over the salad and toss gently. Serve straight away, or leave for 10 minutes so the flavours meld.",
        title: "Dress and serve",
      },
    ],
    nutrition: {
      calories: 350,
      carbohydrates: 30,
      fat: 20,
      protein: 15,
    },
    prepTime: 15,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Mediterranean Chickpea Salad",
    totalTimeMinutes: 15,
    updatedAt: 1771364665560,
  },
  {
    _creationTime: 1771344763633.5425,
    _id: "j970pvay9m2q1rmr59bjc59nh181bm79",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 30,
    cuisine: ["mexican"],
    description:
      "Roasted sweet potato halves filled with spiced black beans, corn, and pepper—hearty and colourful.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/d3c35bcd-c218-4d30-a772-6492384e2dfb",
    ingredients: [
      { amount: 4, name: "sweet potatoes", unit: "whole" },
      {
        amount: 400,
        name: "black beans",
        preparation: "drained",
        unit: "g",
      },
      { amount: 150, name: "corn", unit: "g" },
      {
        amount: 1,
        name: "red bell pepper",
        preparation: "diced",
        unit: "whole",
      },
      {
        amount: 0.5,
        name: "red onion",
        preparation: "finely chopped",
        unit: "whole",
      },
      { amount: 1, name: "cumin powder", unit: "tsp" },
      { amount: 0.5, name: "smoked paprika", unit: "tsp" },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Preheat the oven to 200°C (180°C fan). Halve the sweet potatoes lengthways, drizzle with olive oil and a pinch of salt, and place cut-side down on a baking tray. Roast for 30–35 minutes until tender.",
        title: "Roast the sweet potatoes",
      },
      {
        description:
          "In a bowl, mix the black beans, corn, red bell pepper, red onion, cumin, smoked paprika, salt, and pepper. You can warm this in a pan for 2–3 minutes if you prefer the filling hot.",
        title: "Prepare the filling",
      },
      {
        description:
          "Turn the sweet potato halves cut-side up and fluff the flesh with a fork. Fill each half with the bean mixture and serve warm.",
        title: "Stuff and serve",
      },
    ],
    nutrition: {
      calories: 420,
      carbohydrates: 80,
      fat: 8,
      protein: 12,
    },
    prepTime: 15,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Veggie Stuffed Sweet Potatoes",
    totalTimeMinutes: 45,
    updatedAt: 1771364682149,
  },
  {
    _creationTime: 1771344763633.5427,
    _id: "j97e9q4qdjpaap5s13wjhvdc5h81ap7n",
    category: "dinner",
    complexityTier: "moderate",
    cookTime: 20,
    cuisine: ["mediterranean"],
    description:
      "Large mushroom caps stuffed with spinach, feta, and cream cheese—golden and savoury.",
    image:
      "https://different-cow-771.convex.cloud/api/storage/82299ff8-6c52-446e-b71e-974e37669399",
    ingredients: [
      { amount: 12, name: "large mushrooms", unit: "whole" },
      {
        amount: 200,
        name: "spinach",
        preparation: "chopped",
        unit: "g",
      },
      {
        amount: 100,
        name: "feta cheese",
        preparation: "crumbled",
        unit: "g",
      },
      { amount: 100, name: "cream cheese", unit: "g" },
      {
        amount: 2,
        name: "garlic",
        preparation: "minced",
        unit: "clove",
      },
      { amount: 1, name: "olive oil", unit: "tbsp" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Remove the stalks from the mushrooms and chop them finely. Heat the olive oil in a frying pan and sauté the garlic and chopped stalks for 2 minutes. Add the spinach and cook until wilted. Squeeze out any excess liquid. Off the heat, mix in the feta and cream cheese and season with salt and pepper.",
        title: "Make the filling",
      },
      {
        description:
          "Arrange the mushroom caps in a baking dish. Spoon the filling into each cap, mounding it slightly.",
        title: "Stuff the mushrooms",
      },
      {
        description:
          "Bake at 180°C (160°C fan) for 20 minutes until the mushrooms are tender and the filling is golden. Rest for 2–3 minutes before serving.",
        title: "Bake and serve",
      },
    ],
    nutrition: {
      calories: 300,
      carbohydrates: 18,
      fat: 20,
      protein: 12,
    },
    prepTime: 15,
    primaryProtein: "vegetarian",
    serves: 4,
    source: "system",
    title: "Spinach and Feta Stuffed Mushrooms",
    totalTimeMinutes: 35,
    updatedAt: 1771364698940,
  },
  {
    _creationTime: 1772000000000,
    _id: "j97m9n2k8crispyporkwraps83ho7qxa",
    category: "dinner",
    complexityTier: "simple",
    cookTime: 15,
    cuisine: ["chinese", "vietnamese"],
    description:
      "Shallow-fried pork with a light crisp crust, cool cucumber, quick carrot and daikon pickle, plenty of cabbage, fresh herbs, and a hoisin–sesame mayo in soft tortillas. Cold crispy pork strips from another meal work brilliantly if you have them.",
    ingredients: [
      { amount: 500, name: "pork loin", unit: "g" },
      { amount: 45, name: "soy sauce", unit: "ml" },
      { amount: 2, name: "sherry", unit: "tbsp" },
      { amount: 1, name: "sugar", unit: "tbsp" },
      { amount: 5, name: "cornflour", unit: "tbsp" },
      { amount: 100, name: "vegetable or sunflower oil", unit: "ml" },
      {
        amount: 1,
        name: "carrot",
        preparation: "julienned",
        unit: "whole",
      },
      {
        amount: 150,
        name: "daikon radish",
        preparation: "julienned",
        unit: "g",
      },
      { amount: 80, name: "rice wine vinegar", unit: "ml" },
      {
        amount: 220,
        name: "cabbage",
        preparation: "shredded",
        unit: "g",
      },
      {
        amount: 1,
        name: "cucumber",
        preparation: "julienned",
        unit: "whole",
      },
      { amount: 4, name: "hoisin sauce", unit: "tbsp" },
      { amount: 4, name: "mayonnaise", unit: "tbsp" },
      { amount: 1, name: "sesame oil", unit: "tbsp" },
      {
        amount: 1,
        name: "fresh coriander",
        preparation: "roughly chopped",
        unit: "bunch",
      },
      {
        amount: 15,
        name: "mint",
        preparation: "roughly chopped",
        unit: "g",
      },
      {
        amount: 50,
        name: "peanuts",
        preparation: "crushed",
        unit: "g",
      },
      { amount: 4, name: "tortillas", unit: "piece" },
    ],
    isGeneratorEligible: true,
    method: [
      {
        description:
          "Slice the pork loin into finger-length strips about 1 cm thick—more edges mean more crunch. Toss with 30 ml soy sauce, the sherry, 1 tsp sugar, and 1 tbsp cornflour until evenly coated. Rest 15 minutes at room temperature (or up to 30 minutes in the fridge).",
        title: "Marinate the pork",
      },
      {
        description:
          "Toss the julienned carrot and daikon with 60 ml rice wine vinegar, 2 tsp sugar (from your measured tbsp), and a pinch of salt. Massage lightly and set aside—by the time you fry, it will be a quick pickle.",
        title: "Quick-pickle the vegetables",
      },
      {
        description:
          "In a small bowl, whisk the hoisin sauce, mayonnaise, the remaining 15 ml soy sauce, the remaining 20 ml rice wine vinegar, and about 1 tsp sesame oil until smooth and pourable—tangy enough to balance the hoisin.",
        title: "Make the hoisin sesame mayo",
      },
      {
        description:
          "Pat the pork dry on kitchen paper. Toss with the remaining cornflour so each strip has a light, even dusting—tap off excess. Heat the vegetable oil in a large frying pan over medium-high until shimmering. Fry the pork in batches without crowding, 2–3 minutes per side, until golden and crisp and cooked through. Drain on kitchen paper and season with a little salt.",
        title: "Shallow-fry the pork",
      },
      {
        description:
          "Warm the tortillas in a dry pan or microwave until pliable. Spread a spoonful of hoisin mayo on each, then layer cabbage, cucumber, pickled carrot and daikon, crispy pork, coriander, mint, and crushed peanuts. Roll tightly, slice in half if you like, and serve straight away.",
        title: "Assemble the wraps",
      },
    ],
    nutrition: {
      calories: 560,
      carbohydrates: 38,
      fat: 28,
      protein: 42,
    },
    prepTime: 20,
    primaryProtein: "pork",
    publicSlug: "crispy-pork-hoisin-sesame-wraps",
    serves: 4,
    source: "system",
    title: "Crispy pork wraps with hoisin sesame sauce",
    totalTimeMinutes: 35,
    updatedAt: 1772000000001,
  },
];
