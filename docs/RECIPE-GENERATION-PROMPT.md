GOAL:
Generate {{BATCH_SIZE}} popular, mainstream dinner recipes using {{PRIMARY_PROTEIN}} as the primary protein.

These recipes will seed a system-level recipe database for an intelligent weekly meal planning engine.

CRITICAL CONSTRAINTS:

1. Audience:
   - UK market
   - Ingredients must be easily available in UK supermarkets (Tesco, Sainsbury's, Asda, Aldi, Waitrose, etc.)
   - Avoid obscure or hard-to-source ingredients
   - Avoid American-only branded ingredients
   - Use metric units where appropriate (g, kg, ml, l)
   - Use UK-friendly terminology (e.g., courgette not zucchini, aubergine not eggplant)

2. Recipe Style:
   - Popular, recognisable meals
   - Family-friendly
   - Not avant-garde
   - Not overly complicated
   - Weeknight appropriate
   - No experimental gastronomy
   - Avoid niche diet trends

3. Cuisine:
   Must ONLY use values from this list:
   [
   "italian",
   "indian",
   "mexican",
   "thai",
   "chinese",
   "japanese",
   "korean",
   "french",
   "mediterranean",
   "middle_eastern",
   "british",
   "american",
   "caribbean",
   "african",
   "vietnamese",
   "greek",
   "spanish",
   "other"
   ]

4. Distribution Rules (VERY IMPORTANT):
   - At least 40% must be 45 minutes or under total time
   - At least 30% must be simple traybake / one-pan / low complexity meals
   - Meals must feel meaningfully different from each other
   - Vary cooking methods (roasted, grilled, pan-fried, baked, etc.)
   - Vary carb bases (rice, pasta, potatoes, bread, none)
   - Avoid repeating similar sauces or spice profiles
   - Avoid near-duplicate meals

5. Ingredients:
   - Do NOT list salt, pepper, black pepper, or generic "oil" as ingredients—treat as pantry staples. Refer to them only in the method. Only list named oils (e.g. olive oil, sesame oil).
   - MUST only use preparation values from:
     [
     "chopped","finely chopped","roughly chopped","diced","finely diced","rough chop",
     "sliced","thinly sliced","thickly sliced","chiffonade","julienned","brunoise",
     "minced","grated","finely grated","shredded","cubed","quartered","halved","whole",
     "crushed","mashed","pureed",
     "room temperature","chilled","warmed","softened","melted","frozen","defrosted",
     "beaten","whipped","folded","kneaded","rolled","pressed","strained","drained",
     "rinsed","peeled","trimmed","seeded","cored","stemmed","zested","de-boned",
     "deveined","filleted","butterflied",
     "blanched","toasted","roasted","caramelized","sautéed","fried","poached",
     "grilled","boiled","steamed","smoked",
     "fresh","dried"
     ]
   - For prawns/shrimp use preparation "deveined" (not "de-boned"). Use preparation only for standard prep; use null when no clear prep. For flattening/tenderising meat, describe in the method, not in preparation.

   - MUST only use units from:
     Volume: ["cups","tsp","tbsp","fl oz","gal","ml","l","pt","qt"]
     Weight: ["lbs","oz","g","kg","mg"]
     Count: ["pinch","dash","handful","drop"]
     Items: [
     "piece","whole","clove","slice","sheet","sprig","stalk","stem",
     "head","bunch","bulb","wedge","cube","strip","fillet","leaf",
     "can","jar","packet","package","container","bottle","bag",
     "box","loaf","stick","square","round","breast","thigh","leg","rack"
     ]

   - Do NOT invent units
   - Do NOT invent preparation types
   - Keep ingredient naming consistent and normalised
   - No duplicate ingredient entries

6. Recipe quality (revision-ready):
   - Method: At least 2–4 clear steps; never one monolithic step. Split long steps. Include rice/pasta cooking steps when served. Complete and cookable.
   - Descriptions: Appealing, natural tone; no hype or flowery language.
   - Technique: Home-cook friendly—season before frying, resting meat, when to add salt; tofu squeeze moisture first. Brief pro tips (deglazing, not crowding, resting proteins, fat/acid balance) where helpful.

7. Schema Alignment:
   Output must strictly follow this shape:
   - prepTime (number) and cookTime (number, optional) - total time = prepTime + cookTime
   - complexityTier must be one of: "simple" | "moderate" | "complex"
   - ingredients[].preparation may be null (no prep needed) or a value from the allowed list
   - updatedAt must be present on every recipe as a Unix epoch timestamp in milliseconds

{
recipes: [
{
title: string,
description: string,
prepTime: number,
cookTime: number | null,
serves: number,
category: "dinner",
updatedAt: number,
ingredients: [
{
name: string,
amount: number,
unit: string,
preparation: string | null
}
],
method: [
{
title: string,
description: string
}
],
nutrition: {
calories: number,
protein: number,
fat: number,
carbohydrates: number
},
primaryProtein: "{{PRIMARY_PROTEIN}}",
complexityTier: "simple" | "moderate" | "complex",
cuisine: ["one_value_from_allowed_list"]
}
]
}

8. Intelligent Planner Awareness:
   These recipes are foundational data for a scoring-based meal planning algorithm.

   They must:
   - Represent a balanced distribution of flavour profiles
   - Represent a balanced distribution of effort levels
   - Provide enough structural variety to avoid repetition fatigue
   - Be appropriate for recurring weekly rotation

9. Nutrition:
   - Provide realistic approximate values per serving
   - Keep within reasonable dinner ranges (400–900 kcal typical)
   - Avoid extreme macro distortions

FINAL INSTRUCTION:
Return ONLY valid JSON.
No markdown.
No explanation.
No commentary.
No extra text.
