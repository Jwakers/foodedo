#!/usr/bin/env npx tsx
/**
 * Populate aliases in convex/ingredients-seed.json.
 * Run: npx tsx scripts/populate-ingredient-aliases.ts
 *
 * Uses explicit mappings and heuristics. Edit ALIAS_MAP to add/change aliases.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type SeedItem = {
  name: string;
  externalId?: string;
  foodGroup?: string;
  foodSubGroup?: string;
  displayName?: string;
  aliases: string[];
};

/** Explicit aliases for ingredient names. Use [] for "no aliases". Add entries as needed. */
const ALIAS_MAP: Record<string, string[]> = {
  Angelica: [],
  "Savoy cabbage": ["savoy", "savoy cabbages"],
  "Silver linden": [],
  Kiwi: ["kiwis", "kiwi fruit"],
  Allium: [],
  "Garden onion": ["onion", "onions"],
  Leek: ["leeks"],
  Garlic: ["garlic clove", "garlic cloves"],
  Chives: ["chive", "fresh chives"],
  "Lemon verbena": ["verbena", "fresh lemon verbena"],
  "Cashew nut": ["cashew", "cashews", "cashew nuts"],
  Pineapple: ["pineapples"],
  Dill: ["dill weed", "fresh dill", "dill leaves"],
  "Custard apple": ["custard apples", "sugar apple"],
  "Wild celery": [],
  Peanut: ["peanuts", "groundnut", "groundnuts"],
  Burdock: ["burdock root", "gobo"],
  Horseradish: ["horseradish root", "fresh horseradish"],
  Tarragon: ["fresh tarragon", "tarragon leaves"],
  Mugwort: [],
  Asparagus: ["asparagus spears", "asparagus stalks"],
  Oat: ["oats"],
  "Star fruit": ["starfruit", "carambola", "carambolas"],
  "Brazil nut": ["brazil nuts"],
  "Common beet": ["beet", "beets", "beetroot", "beetroots"],
  Borage: [],
  "Chinese mustard": ["chinese mustard greens", "mustard greens"],
  Swede: ["swedes", "rutabaga", "rutabagas", "neep", "neeps"],
  Rape: ["rapeseed"],
  "Common cabbage": ["cabbage", "cabbages", "white cabbage", "green cabbage"],
  Cauliflower: ["cauliflowers", "cauli"],
  "Brussel sprouts": ["brussels sprouts", "brussel sprout", "brussels"],
  Kohlrabi: ["kohlrabis"],
  Broccoli: ["broccolis", "broccoli florets"],
  "Chinese cabbage": ["cabbage", "napa cabbage", "chinese cabbages"],
  Turnip: ["turnips"],
  "Pigeon pea": ["pigeon peas", "toor dal", "arhar dal"],
  Tea: ["tea leaves"],
  Capers: ["caper", "caper berries"],
  Pepper: ["peppers", "bell pepper", "bell peppers", "sweet pepper"],
  Papaya: ["papayas", "pawpaw", "pawpaws"],
  Safflower: ["safflower oil"],
  Caraway: ["caraway seed", "caraway seeds"],
  "Pecan nut": ["pecan", "pecans", "pecan nuts"],
  Chestnut: ["chestnuts"],
  "Roman camomile": ["roman chamomile", "chamomile"],
  Chickpea: ["chickpeas", "garbanzo", "garbanzo beans", "ceci"],
  Endive: ["endives"],
  Chicory: ["chicory root", "chicories"],
  "Chinese cinnamon": ["cassia", "cassia bark", "cassia cinnamon"],
  "Ceylon cinnamon": ["cinnamon", "true cinnamon"],
  Watermelon: ["watermelons"],
  Lime: ["limes", "lime juice", "key lime", "key limes"],
  Lemon: ["lemons", "lemon juice", "lemon zest"],
  Pummelo: ["pomelo", "pomelos", "pummelo", "pummelos"],
  "Mandarin orange (Clementine, Tangerine)": [
    "mandarin",
    "mandarins",
    "clementine",
    "clementines",
    "tangerine",
    "tangerines",
  ],
  "Sweet orange": ["orange", "oranges", "sweet oranges"],
  Coffee: ["coffee beans", "coffee grounds"],
  "Arabica coffee": ["arabica", "coffee"],
  "Robusta coffee": ["robusta", "coffee"],
  Coriander: [
    "cilantro",
    "fresh coriander",
    "coriander leaves",
    "coriander leaf",
  ],
  "Common hazelnut": ["hazelnut", "hazelnuts", "filbert", "filberts"],
  Saffron: ["saffron threads", "saffron strands"],
  Muskmelon: ["cantaloupe", "cantaloupes", "muskmelons"],
  Cucumber: ["cucumbers", "cuke", "cukes"],
  Cucurbita: ["squash", "pumpkin"],
  Cumin: ["cumin seed", "cumin seeds"],
  Turmeric: ["turmeric root", "fresh turmeric"],
  Quince: ["quinces"],
  "Lemon grass": ["lemongrass", "lemon grass", "citronella"],
  "Globe artichoke": ["artichoke", "artichokes", "globe artichokes"],
  "Wild carrot": ["wild carrots"],
  "Japanese persimmon": ["persimmon", "persimmons", "kaki", "sharon fruit"],
  Cardamom: ["cardamom pod", "cardamom pods", "cardamon", "green cardamom"],
  "Black crowberry": ["crowberry", "crowberries"],
  Loquat: ["loquats", "japanese plum"],
  "Rocket salad (ssp.)": ["rocket", "arugula", "rucola"],
  "Wax apple": ["wax apples", "java apple", "water apple"],
  "Common buckwheat": ["buckwheat", "buckwheat groats"],
  "Tartary buckwheat": ["buckwheat", "tartary buckwheat"],
  Fig: ["figs"],
  Fennel: ["fennel bulb", "fennel bulbs", "fennel seed", "fresh fennel"],
  Strawberry: ["strawberries"],
  "Black huckleberry": ["huckleberry", "huckleberries"],
  "Soy bean": ["soybean", "soybeans", "soya bean", "soya beans"],
  Sunflower: ["sunflower seeds", "sunflower seed"],
  "Sea-buckthornberry": [
    "sea buckthorn",
    "sea buckthorn berry",
    "seabuckthorn",
  ],
  Barley: ["pearl barley", "barley grain", "barley grains"],
  Hyssop: ["hyssop herb"],
  "Star anise": ["star anise seed", "star aniseeds", "badian"],
  "Swamp cabbage": ["water spinach", "kangkong", "ong choy"],
  "Sweet potato": ["sweet potatoes", "kumara", "yam", "yams"],
  "Black walnut": ["black walnuts", "walnut", "walnuts"],
  "Common walnut": ["walnut", "walnuts", "english walnut", "english walnuts"],
  Lettuce: ["lettuces", "leaf lettuce", "lettuce leaves"],
  "Grass pea": ["grass peas", "lathyrus"],
  "Sweet bay": ["bay leaf", "bay leaves", "laurel", "bay"],
  Lentils: ["lentil", "lentils"],
  "Garden cress": ["cress", "garden cress", "cresses"],
  Lovage: ["lovage leaves", "fresh lovage"],
  Flaxseed: ["flax seed", "flax seeds", "linseed", "linseeds"],
  "Mexican oregano": ["mexican oregano"],
  Lichee: ["lychee", "lychees", "litchi", "litchis"],
  Lupine: ["lupin", "lupins", "lupini"],
  Apple: ["apples"],
  Mango: ["mangoes", "mangos"],
  "German camomile": ["chamomile", "german chamomile", "camomile"],
  "Lemon balm": ["melissa", "lemon balm leaves", "fresh lemon balm"],
  Mentha: ["mint", "mints"],
  "Orange mint": ["mint", "orange mint", "fresh mint"],
  Cornmint: ["corn mint", "field mint", "mint"],
  Spearmint: [
    "spear mint",
    "mint",
    "fresh spearmint",
    "fresh mint",
    "mint leaves",
  ],
  Peppermint: ["peppermint leaves"],
  Medlar: ["medlars"],
  "Bitter gourd": ["bitter melon", "bitter melons", "bitter gourds", "karela"],
  Mulberry: ["mulberries"],
  "Black mulberry": ["mulberries", "black mulberries"],
  Nutmeg: ["nutmeg seed", "whole nutmeg"],
  "Sweet basil": ["basil", "fresh basil", "basil leaves"],
  "Evening primrose": [],
  Olive: ["olives", "green olive", "black olive", "olive fruit"],
  "Sweet marjoram": ["marjoram", "sweet marjoram", "fresh marjoram"],
  "Pot marjoram": ["marjoram", "pot marjoram"],
  "Common oregano": [
    "oregano",
    "oregano leaves",
    "fresh oregano",
    "dried oregano",
  ],
  Rice: ["rice grain", "rice grains"],
  Millet: ["millets", "millet grain"],
  Poppy: ["poppy seed", "poppy seeds"],
  "Passion fruit": ["passion fruits", "passionfruit", "granadilla"],
  Parsnip: ["parsnips"],
  Avocado: ["avocados", "avocado pear", "alligator pear"],
  Parsley: [
    "fresh parsley",
    "parsley leaves",
    "flat-leaf parsley",
    "curly parsley",
  ],
  "Scarlet bean": ["scarlet runner bean", "runner bean", "runner beans"],
  "Lima bean": ["lima beans", "butter bean", "butter beans"],
  "Common bean": [
    "beans",
    "green bean",
    "green beans",
    "string bean",
    "snap bean",
  ],
  Date: ["dates", "date palm", "medjool date", "medjool dates"],
  "Black chokeberry": ["chokeberry", "chokeberries", "aronia", "aronias"],
  Anise: ["aniseed", "anise seed", "anise seeds"],
  "Pine nut": ["pine nuts", "pignoli", "pinoli"],
  "Pepper (Spice)": ["black pepper", "peppercorn", "peppercorns"],
  Pistachio: ["pistachios", "pistachio nut", "pistachio nuts"],
  "Common pea": [
    "pea",
    "peas",
    "garden pea",
    "garden peas",
    "green pea",
    "green peas",
  ],
  Purslane: ["purslane leaves", "common purslane"],
  "Prunus (Cherry, Plum)": ["stone fruit", "cherry", "plum"],
  Apricot: ["apricots"],
  "Sweet cherry": ["cherry", "cherries", "sweet cherries", "bing cherry"],
  "Sour cherry": ["cherry", "sour cherries", "tart cherry", "morello cherry"],
  "European plum": ["plum", "plums", "european plums"],
  Almond: ["almonds", "almond nut", "almond nuts"],
  Peach: ["peaches"],
  Guava: ["guavas", "guava fruit"],
  Pomegranate: ["pomegranates", "pomegranate seeds", "pomegranate juice"],
  Pear: ["pears"],
  Radish: ["radishes", "red radish", "red radishes"],
  "Garden rhubarb": ["rhubarb", "rhubarb stalk", "rhubarb stalks", "rhubarbs"],
  Blackcurrant: ["black currant", "black currants", "blackcurrants"],
  Redcurrant: ["red currant", "red currants", "redcurrants"],
  Gooseberry: ["gooseberries"],
  Watercress: ["water cress", "water cresses"],
  Rosemary: [
    "rosemary leaves",
    "fresh rosemary",
    "rosemary sprig",
    "rosemary sprigs",
  ],
  "Rubus (Blackberry, Raspberry)": ["blackberry", "raspberry", "bramble"],
  Cloudberry: ["cloudberries", "bakeapple"],
  "Red raspberry": ["raspberry", "raspberries", "red raspberries"],
  "Black raspberry": ["black raspberries", "raspberry"],
  Sorrel: ["sorrel leaves", "garden sorrel"],
  "Common sage": ["sage", "sage leaves", "fresh sage", "dried sage"],
  "Black elderberry": ["elderberry", "elderberries", "black elderberries"],
  "Summer savory": ["savory", "summer savory", "fresh savory"],
  "Winter savory": ["savory", "winter savory"],
  Rye: ["rye grain", "rye bread"],
  Sesame: ["sesame seeds", "sesame seed"],
  "Garden tomato": ["tomato", "tomatoes", "tomatoe", "fresh tomato"],
  "Cherry tomato": [
    "cherry tomatoes",
    "tomato",
    "grape tomato",
    "grape tomatoes",
  ],
  "Garden tomato (var.)": ["tomato", "tomatoes"],
  Eggplant: ["eggplants", "aubergine", "aubergines", "brinjal", "brinjals"],
  Potato: ["potatoes", "spud", "spuds"],
  Rowanberry: ["rowan berry", "rowan berries", "mountain ash"],
  Sorghum: ["sorghum grain", "sorghum flour"],
  Spinach: ["spinach leaves", "fresh spinach", "baby spinach", "spinaches"],
  Cloves: ["clove", "whole cloves", "clove spice"],
  Tamarind: ["tamarind pulp", "tamarind paste", "tamarinds"],
  Dandelion: ["dandelion greens", "dandelion leaves", "dandelions"],
  "Cocoa bean": ["cocoa", "cacao", "cacao bean", "cacao beans"],
  "Common thyme": ["thyme", "thyme leaves", "fresh thyme", "dried thyme"],
  Linden: ["lime blossom", "linden flower", "lime flower"],
  "Small-leaf linden": ["linden", "lime blossom"],
  Fenugreek: ["fenugreek seed", "fenugreek seeds", "methi", "kasuri methi"],
  "Common wheat": ["wheat", "wheat grain", "wheat flour", "wheat berries"],
  "Vaccinium (Blueberry, Cranberry, Huckleberry)": [],
  "Lowbush blueberry": [
    "blueberry",
    "blueberries",
    "wild blueberry",
    "wild blueberries",
  ],
  Sparkleberry: ["farkleberry"],
  "Highbush blueberry": ["blueberry", "blueberries"],
  "American cranberry": ["cranberry", "cranberries", "american cranberries"],
  Bilberry: ["bilberries", "european blueberry", "whortleberry"],
  Lingonberry: ["lingonberries", "cowberry", "cowberries"],
  Vanilla: [
    "vanilla bean",
    "vanilla beans",
    "vanilla extract",
    "vanilla pod",
    "vanilla pods",
  ],
  "Common verbena": ["verbena"],
  "Broad bean": [
    "broad beans",
    "fava bean",
    "fava beans",
    "faba bean",
    "faba beans",
  ],
  "Adzuki bean": [
    "adzuki",
    "aduki bean",
    "aduki beans",
    "red bean",
    "red beans",
  ],
  "Gram bean": [
    "chickpea",
    "chickpeas",
    "gram",
    "grams",
    "chana",
    "bengal gram",
  ],
  "Mung bean": ["mung beans", "moong bean", "moong beans", "green gram"],
  "Climbing bean": ["climbing beans", "pole bean", "pole beans"],
  Cowpea: ["cowpeas", "black-eyed pea", "black-eyed peas", "blackeye pea"],
  "Muscadine grape": ["muscadine", "muscadines", "grape", "grapes"],
  "Common grape": ["grape", "grapes", "table grape", "table grapes"],
  Grape: ["grapes"],
  Corn: ["sweetcorn", "sweet corn", "maize", "corn on the cob", "corn kernels"],
  "Arctic blackberry": ["blackberry", "blackberries"],
  Banana: ["bananas"],
  Bayberry: ["bayberries", "wax myrtle"],
  Celeriac: ["celery root", "celeriacs"],
  "Celery stalks": ["celery", "celery stalk", "celery sticks", "celery ribs"],
  "Chinese chives": ["garlic chives", "chinese chive", "gau choy"],
  Ginseng: ["ginseng root", "panax ginseng"],
  Longan: ["longans", "dragon eye", "dragon eyes"],
  "Macadamia nut (M. tetraphylla)": [
    "macadamia",
    "macadamia nuts",
    "macadamia nut",
  ],
  "Garden onion (var.)": ["onion", "onions"],
  Nectarine: ["nectarines"],
  "Pepper (C. baccatum)": ["pepper", "peppers", "ají", "south american pepper"],
  "Pepper (C. chinense)": ["pepper", "peppers", "habanero", "scotch bonnet"],
  "Pepper (Capsicum)": [
    "pepper",
    "peppers",
    "capsicum",
    "capsicums",
    "bell pepper",
    "chili pepper",
  ],
  Rambutan: ["rambutans", "rambutan fruit"],
  "Red rice": ["red rice grain", "red rice grains"],
  "Annual wild rice": ["wild rice", "black rice"],
  "Swiss chard": [
    "chard",
    "silverbeet",
    "swiss chard",
    "chard leaves",
    "rainbow chard",
  ],
  "Lemon thyme": ["thyme", "lemon thyme", "fresh lemon thyme"],
  "Tronchuda cabbage": ["cabbage", "portuguese cabbage", "tronchuda"],
  "Japanese walnut": ["walnut", "walnuts", "japanese walnuts"],
  "Welsh onion": [
    "welsh onion",
    "welsh onions",
    "bunching onion",
    "bunching onions",
    "green onion",
    "scallion",
    "scallions",
  ],
  "Hard wheat": ["wheat", "bread wheat", "durum wheat"],
  Shallot: ["shallots", "eschalot", "eschalots"],
  "Rocket salad": ["rocket", "arugula", "rucola", "rocket leaves"],
  Carrot: ["carrots", "carrot stick", "carrot sticks"],
  Triticale: ["triticale grain"],
  "Black cabbage": ["cabbage", "black cabbages", "cavolo nero", "tuscan kale"],
  "Celery leaves": ["celery leaf", "celery leaves", "celery tops"],
  "Chicory leaves": ["chicory", "chicory leaves", "radicchio"],
  Komatsuna: ["komatsuna", "japanese mustard spinach", "tendergreen"],
  "Pak choy": ["bok choy", "pak choi", "chinese cabbage", "pak choy"],
  "Napa cabbage": [
    "napa cabbage",
    "chinese cabbage",
    "wombok",
    "napa cabbages",
  ],
  "Chicory roots": ["chicory root", "chicory roots"],
  "Grapefruit/Pummelo hybrid": ["grapefruit", "grapefruits"],
  Grapefruit: ["grapefruits", "grape fruit"],
  Jostaberry: ["jostaberries", "josta berry"],
  "Kai-lan": ["chinese broccoli", "gai lan", "kai lan", "chinese kale"],
  "Italian oregano": ["oregano", "italian oregano"],
  "Oxheart cabbage": ["cabbage", "oxheart cabbage", "cabbages"],
  "Daikon radish": [
    "daikon",
    "daikons",
    "japanese radish",
    "mooli",
    "white radish",
  ],
  "Black radish": ["radish", "radishes", "black radishes"],
  "Radish (var.)": ["radish", "radishes"],
  "Red beetroot": [
    "beetroot",
    "beetroots",
    "beet",
    "beets",
    "red beet",
    "red beets",
  ],
  "Sweet rowanberry": ["rowanberry", "rowan berries"],
  "Pineappple sage": ["pineapple sage", "sage", "fresh pineapple sage"],
  Beer: ["beers", "lager", "ale"],
  Pasta: ["pasta noodles", "noodles", "spaghetti", "penne", "macaroni"],
  Abalone: ["abalones"],
  Coconut: ["coconuts", "coconut meat", "fresh coconut", "desiccated coconut"],
  Chicken: ["chicken meat", "whole chicken", "chickens"],
  "Chinese broccoli": ["gai lan", "kai-lan", "chinese broccoli"],
  "Chinese water chestnut": [
    "water chestnut",
    "water chestnuts",
    "chinese water chestnuts",
  ],
  Chervil: ["fresh chervil", "chervil leaves", "french parsley"],
  Chia: ["chia seeds", "chia seed"],
  Breadfruit: ["breadfruits"],
  Kale: ["kales", "curly kale", "kale leaves", "tuscan kale"],
  Kelp: ["kelp seaweed", "kombu"],
  Kumquat: ["kumquats", "cumquat", "cumquats"],
  Okra: ["okras", "ladies fingers", "bamya", "bamia"],
  Quinoa: ["quinoa grain", "quinoa seeds", "quinua"],
  Yam: ["yams"],
  Jicama: ["jicamas", "mexican turnip", "mexican yam bean"],
  Ginger: ["ginger root", "fresh ginger", "root ginger"],
  Cinnamon: ["cinnamon stick", "cinnamon sticks"],
  Crab: ["crabs", "crab meat", "crabmeat"],
  Anchovy: ["anchovies", "anchovy fillet", "anchovy fillets"],
  Cheese: ["cheeses", "cheese slice", "cheese slices"],
  "Milk (Cow)": ["milk", "cow milk", "dairy milk"],
  Eggs: [
    "egg",
    "eggs",
    "whole egg",
    "whole eggs",
    "chicken egg",
    "chicken eggs",
  ],
  Yogurt: ["yoghurt", "yoghurts", "yogurt", "yogurts"],
  Honey: ["honey"],
  Vinegar: ["vinegars"],
  Salt: ["table salt", "sea salt", "kosher salt", "salt"],
  Butter: ["butters"],
  Cream: [
    "creams",
    "heavy cream",
    "double cream",
    "whipping cream",
    "single cream",
  ],
  Sugar: ["sugars", "white sugar", "granulated sugar", "caster sugar"],
  Mustard: [
    "mustard seed",
    "mustard seeds",
    "dijon mustard",
    "wholegrain mustard",
  ],
  Water: ["drinking water", "filtered water", "tap water"],
  Flour: [
    "flours",
    "plain flour",
    "all-purpose flour",
    "all purpose flour",
  ],
  "Olive oil": [
    "extra virgin olive oil",
    "extra-virgin olive oil",
    "virgin olive oil",
    "olive oil",
  ],
  "Soy sauce": ["soy sauces", "tamari"],
  Tofu: ["tofu block", "tofu blocks", "bean curd"],
  Chocolate: ["chocolate bar", "chocolate bars"],
  Bread: ["bread loaf", "bread loaves", "sliced bread"],
  "Egg yolk": ["egg yolks", "yolk", "yolks"],
  "Almond milk": ["almond milks", "almond beverage"],
  "Coconut milk": ["canned coconut milk", "tinned coconut milk"],
  "Salted butter": ["butter", "salted butters"],
  "Sunflower oil": ["sunflower oils", "sunflower cooking oil"],
  "Coconut oil": ["coconut oils", "virgin coconut oil"],
  "Peanut oil": ["groundnut oil", "peanut oils"],
  "Corn oil": ["maize oil", "corn oils"],
  "Avocado oil": ["avocado oils"],
  "Grapeseed oil": ["grape seed oil", "grapeseed oils"],
  "Sesame oil": ["sesame oils", "toasted sesame oil"],
  "Rapeseed oil": ["rapeseed oils", "canola oil", "canola oils"],
  "Soybean oil": ["soy oil", "soybean oils"],
  "Canola oil": ["canola oils", "rapeseed oil"],
  "Mozzarella cheese": [
    "mozzarella",
    "mozzarella ball",
    "mozzarella balls",
    "buffalo mozzarella",
  ],
  "Plain cream cheese": ["cream cheese", "cream cheeses", "philadelphia"],
  "Cheddar Cheese": ["cheddar", "cheddars", "cheddar cheese"],
  "Parmesan cheese": [
    "parmesan",
    "parmigiano reggiano",
    "parmesan cheese",
    "grated parmesan",
  ],
  "Greek feta cheese": ["feta", "feta cheese", "feta cheeses"],
  "White onion": ["onion", "onions", "white onions"],
  "Red onion": ["onion", "onions", "red onions"],
  "Green onion": [
    "scallion",
    "scallions",
    "spring onion",
    "spring onions",
    "green onions",
  ],
  "Green cabbage": ["cabbage", "cabbages", "green cabbages"],
  "Green bean": ["green beans", "string beans", "snap beans", "french beans"],
  "Green bell pepper": [
    "green pepper",
    "green peppers",
    "bell pepper",
    "bell peppers",
  ],
  "Red bell pepper": [
    "red pepper",
    "red peppers",
    "bell pepper",
    "bell peppers",
  ],
  "Yellow bell pepper": [
    "yellow pepper",
    "yellow peppers",
    "bell pepper",
    "bell peppers",
  ],
  "Orange bell pepper": [
    "orange pepper",
    "orange peppers",
    "bell pepper",
    "bell peppers",
  ],
  "Jalapeno pepper": ["jalapeño", "jalapeños", "jalapeno", "jalapenos"],
  "Red grape": ["red grapes", "grape", "grapes"],
  "Green grape": [
    "green grapes",
    "grape",
    "grapes",
    "white grape",
    "white grapes",
  ],
  "Iceberg lettuce": ["iceberg", "iceberg lettuces", "crisphead lettuce"],
  "Romaine lettuce": ["romaine", "romaine lettuces"],
  "Acorn squash": ["acorn squashes", "squash", "squashes"],
  Plantain: ["plantains", "cooking banana", "cooking bananas"],
  Clementine: ["clementines", "mandarin", "mandarins"],
  "Green apple": [
    "green apples",
    "apple",
    "apples",
    "granny smith",
    "granny smith apple",
  ],
  "Black plum": ["plum", "plums", "black plums", "dark plum"],
  "Black raisin": [
    "raisin",
    "raisins",
    "black raisins",
    "dried grape",
    "dried grapes",
  ],
  "Cannellini bean": [
    "cannellini beans",
    "white kidney bean",
    "white kidney beans",
    "fazolia",
  ],
  "Green lentil": [
    "lentil",
    "lentils",
    "green lentils",
    "french lentil",
    "french lentils",
  ],
  "Cubanelle pepper": [
    "cubanelle",
    "cubanelle peppers",
    "italian frying pepper",
  ],
  "Pea shoots": ["pea shoot", "pea tendrils", "pea greens"],
  "Water spinach": ["water spinach", "kangkong", "ong choy", "morning glory"],
  Pitaya: ["dragon fruit", "dragon fruits", "pitaya", "pitayas"],
  Goji: ["goji berry", "goji berries", "wolfberry", "wolfberries"],
  "Monk fruit": ["monkfruit", "luo han guo", "siraitia"],
  "Cantaloupe melon": [
    "cantaloupe",
    "cantaloupes",
    "cantalope",
    "rock melon",
    "rock melons",
  ],
  "Cape gooseberry": ["physalis", "golden berry", "golden berries"],
  "Herbal tea": ["herb tea", "herb teas", "tisane", "tisanes", "infusion"],
  "White bread": [
    "white bread loaf",
    "white bread loaves",
    "sliced white bread",
  ],
  "Whole wheat bread": [
    "wholemeal bread",
    "whole wheat bread loaf",
    "brown bread",
  ],
  "Chicken breast": ["chicken breast", "chicken breasts", "breast of chicken"],
  "Chicken thigh": ["chicken thigh", "chicken thighs"],
  "Chicken leg": [
    "chicken leg",
    "chicken legs",
    "chicken drumstick",
    "chicken drumsticks",
  ],
  "Pork loin": ["pork loin", "loin of pork", "pork loin joint"],
  "Beef steak": ["beef steak", "steak", "steaks"],
  "Sirloin steak": ["sirloin steak", "beef sirloin", "sirloin"],
  "Ribeye steak": ["ribeye steak", "rib eye steak", "beef ribeye", "ribeye"],
  "Lamb leg": ["lamb leg", "leg of lamb"],
  "Lamb shoulder": ["lamb shoulder", "shoulder of lamb"],
  "Minced beef": ["minced beef", "ground beef", "beef mince"],
  "Ground pork": ["ground pork", "minced pork", "pork mince"],
  Allspice: ["allspice berries", "jamaican pepper"],
  "Winter squash": ["squash", "squashes", "winter squashes", "pumpkin"],
  "Bamboo shoots": ["bamboo shoot", "bamboo shoots", "canned bamboo shoots"],
  "Atlantic cod": ["cod", "cod fillet", "cod fillets", "fresh cod"],
  "Pacific cod": ["cod", "cod fillet", "cod fillets", "alaska cod"],
  "Atlantic salmon": [
    "salmon",
    "salmon fillet",
    "salmon fillets",
    "scottish salmon",
  ],
  "Pink salmon": ["salmon", "pink salmon fillet", "canned salmon"],
  "Sockeye salmon": ["salmon", "red salmon", "sockeye salmon fillet"],
  "Chinook salmon": ["salmon", "king salmon", "chinook salmon fillet"],
  "Coho salmon": ["salmon", "silver salmon", "coho salmon fillet"],
  "Chum salmon": ["salmon", "keta salmon", "chum salmon fillet"],
  "Rainbow trout": ["trout", "rainbow trout fillet", "trout fillet"],
  "Atlantic herring": ["herring", "herrings", "herring fillet"],
  "Pacific sardine": ["sardine", "sardines", "sardine fillets"],
  "Yellowfin tuna": ["tuna", "tuna steak", "ahi tuna", "tuna steaks"],
  "Northern bluefin tuna": ["tuna", "bluefin tuna", "tuna steak"],
  "Albacore tuna": ["tuna", "white tuna", "canned tuna", "tuna in water"],
  "Skipjack tuna": ["tuna", "skipjack", "light tuna", "canned tuna"],
  Shrimp: ["shrimps", "prawn", "prawns", "jumbo shrimp"],
  "Blue crab": ["crab", "crabs", "crab meat", "blue crabs"],
  "Atlantic mackerel": ["mackerel", "mackerel fillet", "mackerels"],
  "Pacific oyster": ["oyster", "oysters", "pacific oysters", "fresh oysters"],
  "Eastern oyster": ["oyster", "oysters", "eastern oysters"],
  Scallop: ["scallops", "sea scallop", "sea scallops", "scallop meat"],
  Squid: ["squids", "calamari", "squid rings"],
  "American lobster": ["lobster", "lobsters", "maine lobster", "lobster tail"],
  Cassava: ["cassava root", "yuca", "manioc"],
  Chayote: ["chayotes", "choko", "chokos", "mirliton", "christophene"],
  Jackfruit: ["jackfruits", "jack fruit", "young jackfruit", "green jackfruit"],
  Durian: ["durians", "durian fruit"],
  Persimmon: ["persimmons", "persimmon fruit", "sharon fruit"],
  "Asian pear": [
    "asian pears",
    "apple pear",
    "apple pears",
    "nashi",
    "nashi pear",
  ],
  Jujube: ["jujubes", "chinese date", "chinese dates", "jujube fruit"],
  Lychee: ["lychees", "litchi", "litchis", "lychee fruit"],
  "Macadamia nut": ["macadamia", "macadamia nuts", "macadamia nut", "mac nuts"],
  "Black-eyed pea": ["black eyed pea", "black eyed peas", "cowpea", "cowpeas"],
  "Common mushroom": [
    "mushroom",
    "mushrooms",
    "button mushroom",
    "button mushrooms",
    "white mushroom",
  ],
  Shiitake: [
    "shiitake mushroom",
    "shiitake mushrooms",
    "shiitakes",
    "dried shiitake",
  ],
  "Oyster mushroom": ["oyster mushrooms", "oyster mushrooms", "pleurotus"],
  Turkey: ["turkey meat", "whole turkey", "turkey breast", "turkey thigh"],
  "Cattle (Beef, Veal)": ["beef", "veal", "cattle"],
  "Domestic pig": ["pork", "pig", "pork meat"],
  "Sheep (Mutton, Lamb)": [
    "lamb",
    "mutton",
    "sheep",
    "lamb meat",
    "mutton meat",
  ],
  Clam: ["clams", "clam meat", "clamshell", "fresh clams"],
  "Blue cheese": ["blue cheeses", "bleu cheese"],
  "Sour cream": ["sour creams", "soured cream"],
  "Cottage cheese": ["cottage cheeses", "curd cheese", "farmer cheese"],
  "Swiss cheese": ["swiss cheeses", "emmental", "emmentaler"],
  "Monterey Jack cheese": ["monterey jack", "jack cheese", "pepper jack"],
  "Milk (Human)": [],
  Wheat: ["wheat grain", "wheat berries", "wheat flour", "whole wheat"],
  "Red wine": ["red wines", "cabernet", "merlot", "pinot noir"],
  "White wine": ["white wines", "chardonnay", "sauvignon blanc"],
  "Black tea": ["black teas", "english breakfast", "tea", "tea leaves"],
  "Green tea": ["green teas", "green tea leaves"],
  "linseed oil": ["linseed oil", "flaxseed oil", "flax oil"],
  Cabbage: ["cabbages", "green cabbage", "white cabbage", "head of cabbage"],
  Mushrooms: [
    "mushroom",
    "mushrooms",
    "button mushrooms",
    "cremini",
    "portobello",
  ],
  Eddoe: ["eddo", "eddos", "taro root", "cocoyam", "cocoyams"],
  Blackberry: ["blackberries", "bramble", "brambleberry"],
  "Cow milk, pasteurized, vitamin A + D added, 0% fat": [
    "skim milk",
    "fat-free milk",
    "zero fat milk",
  ],
  "Cow milk, pasteurized, vitamin A + D added, 1% fat": [
    "1% milk",
    "low fat milk",
    "semi-skimmed milk",
  ],
  "Cow milk, pasteurized, vitamin A + D added, 2% fat": [
    "2% milk",
    "reduced fat milk",
    "semi-skimmed milk",
  ],
  "Cow milk, pasteurized, vitamin D added, 3.25% fat": [
    "whole milk",
    "full fat milk",
    "full-cream milk",
  ],

  // Ingredients that had no aliases – add only where a shorter or common name is useful
  "Mallard duck": ["duck", "mallard", "duck meat"],
  "Velvet duck": ["duck", "duck meat"],
  "European anchovy": ["anchovy", "anchovies"],
  "European rabbit": ["rabbit", "rabbit meat"],
  Deer: ["venison", "deer meat"],
  "Mule deer": ["deer", "venison", "deer meat"],
  Rabbit: ["rabbit meat"],
  "Guinea hen": ["guinea fowl", "guinea"],
  Squab: ["pigeon", "young pigeon"],
  Quail: ["quail bird", "quails"],
  Pheasant: ["pheasant meat", "pheasants"],
  Elk: ["elk meat", "wapiti"],
  Bison: ["bison meat", "buffalo"],
  Buffalo: ["buffalo meat", "bison"],
  "Wild boar": ["boar", "wild pig"],
  Emu: ["emu meat"],
  Ostrich: ["ostrich meat"],
  "Greylag goose": ["goose", "goose meat"],
  Haddock: ["haddock fillet", "haddocks"],
  "Atlantic pollock": ["pollock", "pollock fillet"],
  "Alaska pollock": ["pollock", "pollock fillet"],
  "Striped bass": ["bass", "striped bass fillet"],
  "Channel catfish": ["catfish", "catfish fillet"],
  "Atlantic halibut": ["halibut", "halibut fillet"],
  "Pacific halibut": ["halibut", "halibut fillet"],
  "Greenland halibut/turbot": ["halibut", "turbot"],
  "Red king crab": ["king crab", "crab"],
  "Dungeness crab": ["crab", "dungeness"],
  "Blue mussel": ["mussel", "mussels"],
  "Common octopus": ["octopus", "octopi"],
  Cuttlefish: ["cuttlefish squid"],
  "Jerusalem artichoke": ["sunchoke", "sunchokes", "jerusalem artichokes"],
  "Butternut squash": ["butternut", "butternut squashes"],
  Elderberry: ["elderberries", "elder"],
  Loganberry: ["loganberries"],
  Salmonberry: ["salmonberries"],
  Groundcherry: ["ground cherries", "husk cherry"],
  "Mexican groundcherry": ["tomatillo", "tomatillos", "ground cherry"],
  "Horned melon": ["kiwano", "african cucumber"],
  Cherimoya: ["cherimoyas"],
  "Sugar apple": ["sweet sop", "custard apple"],
  "Breadnut tree seed": ["breadnut", "breadnuts"],
  "Ginkgo nuts": ["ginkgo", "ginkgo nut"],
  Hazelnut: ["hazelnuts", "filbert", "filberts"],
  "Japanese chestnut": ["chestnut", "chestnuts"],
  "European chestnut": ["chestnut", "chestnuts", "sweet chestnut"],
  "Chinese chestnut": ["chestnut", "chestnuts"],
  Carob: ["carob powder", "carob pods"],
  Cardoon: ["cardoons", "artichoke thistle"],
  Acerola: ["acerola cherry", "barbados cherry"],
  "Natal plum": ["natal plums", "num-num"],
  "Java plum": ["java plums", "jambul", "black plum"],
  Pitanga: ["surinam cherry", "brazilian cherry"],
  Lambsquarters: ["lamb's quarters", "goosefoot", "wild spinach"],
  "Irish moss": ["carrageenan moss", "sea moss"],
  Nopal: ["nopales", "prickly pear cactus", "cactus paddle"],
  "Prickly pear": ["prickly pears", "cactus fruit", "tuna fruit"],
  "Plains prickly pear": ["prickly pear", "cactus fruit"],
  Wasabi: ["wasabi root", "japanese horseradish"],
  "Wax gourd": ["winter melon", "white gourd", "chinese winter melon"],
  "Towel gourd": ["loofah", "luffa", "sponge gourd"],
  Calabash: ["calabash gourd", "bottle gourd"],
  Taro: ["taro root", "taro roots", "cocoyam"],
  "Yardlong bean": ["long bean", "long beans", "asparagus bean"],
  "Hyacinth bean": ["lablab", "indian bean"],
  "Winged bean": ["winged beans", "goa bean"],
  "Moth bean": ["moth beans", "matki"],
  "Common salsify": ["salsify", "oyster plant", "vegetable oyster"],
  "Black salsify": ["salsify", "scorzonera"],
  Spelt: ["spelt grain", "spelt flour"],
  "Garland chrysanthemum": ["chrysanthemum greens", "shungiku", "tong ho"],
  "Corn salad": ["lamb's lettuce", "mâche", "field salad"],
  Arrowroot: ["arrowroot starch", "arrowroot powder"],
  Agar: ["agar agar", "kanten"],
  Spirulina: ["spirulina powder", "blue-green algae"],
};

function pluralize(word: string): string {
  if (!word.length) return word;
  const lower = word.toLowerCase();
  if (lower.endsWith("y") && !/[aeiou]y$/.test(lower))
    return word.slice(0, -1) + "ies";
  if (
    lower.endsWith("s") ||
    lower.endsWith("x") ||
    lower.endsWith("ch") ||
    lower.endsWith("sh")
  )
    return word + "es";
  return word + "s";
}

function getAliases(item: SeedItem): string[] {
  const name = item.name.trim();
  const foodGroup = item.foodGroup?.trim().toLowerCase() ?? "";
  const foodSubGroup = item.foodSubGroup?.trim().toLowerCase() ?? "";
  const nameLower = name.toLowerCase();

  const explicit = ALIAS_MAP[name];
  if (explicit !== undefined) {
    const list = [...explicit];
    const normal = nameLower.replace(/\s*\([^)]*\)\s*/g, "").trim();
    if (
      normal &&
      normal !== nameLower &&
      list.length > 0 &&
      !list.some((a) => a.toLowerCase() === normal)
    )
      list.push(normal);
    const plural = pluralize(name);
    if (
      list.length > 0 &&
      plural.toLowerCase() !== nameLower &&
      !list.some((a) => a.toLowerCase() === plural.toLowerCase())
    )
      list.push(plural);
    return list;
  }

  const aliases: string[] = [];

  if (foodSubGroup === "herbs") {
    if (
      !nameLower.includes("seed") &&
      !nameLower.includes("root") &&
      !nameLower.includes("spice")
    ) {
      aliases.push(`fresh ${name}`, `${name} leaves`);
    }
  }
  // Do not add generic "cabbage"/"cabbages" – different cabbage types are distinct ingredients
  if (foodSubGroup === "cabbages" && nameLower.includes("cabbage")) {
    aliases.push(pluralize(name));
  }
  // Do not add generic "onion"/"onions" – different alliums are distinct (e.g. leek, shallot)
  if (
    foodSubGroup === "onion-family vegetables" &&
    nameLower.includes("onion")
  ) {
    aliases.push(pluralize(name));
  }
  if (foodSubGroup === "nuts" && nameLower.endsWith(" nut")) {
    const base = name.slice(0, -4).trim();
    aliases.push(base, pluralize(base));
  }
  if (foodSubGroup === "citrus") {
    aliases.push(pluralize(name));
  }
  if (
    foodSubGroup === "root vegetables" &&
    (nameLower.includes("carrot") ||
      nameLower.includes("potato") ||
      nameLower.includes("beet") ||
      nameLower.includes("radish") ||
      nameLower.includes("parsnip") ||
      nameLower.includes("turnip"))
  ) {
    aliases.push(pluralize(name));
  }
  if (
    foodSubGroup === "leaf vegetables" &&
    (nameLower.includes("lettuce") ||
      nameLower.includes("spinach") ||
      nameLower.includes("kale") ||
      nameLower.includes("chard") ||
      nameLower.includes("collard"))
  ) {
    aliases.push(pluralize(name), `${name} leaves`);
  }
  if (
    foodSubGroup === "tropical fruits" &&
    (nameLower.includes("mango") ||
      nameLower.includes("banana") ||
      nameLower.includes("pineapple") ||
      nameLower.includes("papaya") ||
      nameLower.includes("avocado") ||
      nameLower.includes("coconut") ||
      nameLower.includes("kiwi") ||
      nameLower.includes("guava") ||
      nameLower.includes("passion"))
  ) {
    aliases.push(pluralize(name));
  }
  if (foodSubGroup === "peas" && nameLower.includes("pea") && !aliases.length) {
    aliases.push(pluralize(name));
  }

  const normal = nameLower.replace(/\s*\([^)]*\)\s*/g, "").trim();
  if (
    normal &&
    normal !== nameLower &&
    normal.length > 2 &&
    !aliases.some((a) => a.toLowerCase() === normal)
  ) {
    aliases.push(normal);
  }

  return aliases;
}

function dedupe(aliases: string[], canonicalName: string): string[] {
  const seen = new Set<string>();
  const canon = canonicalName.trim().toLowerCase();
  return aliases
    .map((a) => a.trim())
    .filter((a) => {
      if (!a) return false;
      const low = a.toLowerCase();
      if (low === canon) return false;
      if (seen.has(low)) return false;
      seen.add(low);
      return true;
    });
}

/** Return a stable key for an ingredient (for alias conflict resolution). */
function getItemKey(item: SeedItem): string {
  return (item.externalId ?? item.name ?? "").trim();
}

/**
 * Ensure each alias is assigned to only one ingredient. When multiple ingredients
 * claim the same alias, prefer the "owner" (the one whose name/displayName/plural/singular
 * matches the alias) so e.g. "grapes" goes to "Grape" not "Common grape".
 */
function deduplicateAliasesAcrossIngredients(items: SeedItem[]): void {
  const keyToItem = new Map<string, SeedItem>();
  for (const item of items) keyToItem.set(getItemKey(item), item);

  const aliasToClaimants = new Map<string, string[]>();
  for (const item of items) {
    const key = getItemKey(item);
    for (const a of item.aliases ?? []) {
      const norm = a.trim().toLowerCase();
      if (!norm) continue;
      const list = aliasToClaimants.get(norm) ?? [];
      if (!list.includes(key)) list.push(key);
      aliasToClaimants.set(norm, list);
    }
  }

  /** For an alias norm, which claimant key should keep it (owner wins, else first). */
  const winner = (norm: string, claimantKeys: string[]): string => {
    if (claimantKeys.length <= 1) return claimantKeys[0] ?? "";
    const owners = claimantKeys.filter((k) => {
      const it = keyToItem.get(k);
      return it && getOwnIdentifiers(it).has(norm);
    });
    return owners.length === 1 ? owners[0]! : claimantKeys[0]!;
  };

  let removed = 0;
  for (const item of items) {
    const key = getItemKey(item);
    const kept = (item.aliases ?? []).filter((a) => {
      const norm = a.trim().toLowerCase();
      const claimants = aliasToClaimants.get(norm) ?? [];
      const winnerKey = winner(norm, claimants);
      if (winnerKey !== key) {
        removed++;
        return false;
      }
      return true;
    });
    item.aliases = kept;
  }
  if (removed > 0) {
    console.warn(
      `Removed ${removed} duplicate alias(es) so each alias maps to a single ingredient.`,
    );
  }
}

/** Simple plural form of a single word (e.g. carrot → carrots, potato → potatoes). */
function pluralizeWord(word: string): string {
  if (word.endsWith("s")) return word;
  if (
    word.length >= 2 &&
    word.endsWith("y") &&
    !/[-aeiou]$/i.test(word.slice(-2, -1))
  )
    return word.slice(0, -1) + "ies";
  if (/[osxz]$/.test(word) || word.endsWith("ch") || word.endsWith("sh"))
    return word + "es";
  return word + "s";
}

/** Simple singular form of a single word (e.g. carrots → carrot, potatoes → potato). */
function singularizeWord(word: string): string {
  if (
    word.endsWith("ies") &&
    word.length > 3 &&
    !/[-aeiou]/i.test(word[word.length - 4] ?? "")
  )
    return word.slice(0, -3) + "y";
  if (word.endsWith("es") && word.length > 2 && !word.endsWith("ies"))
    return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 1) return word.slice(0, -1);
  return word;
}

/** Apply plural/singular to the last word of a phrase (e.g. "sweet potato" → "sweet potatoes"). */
function pluralizeLastWord(phrase: string): string {
  const i = phrase.lastIndexOf(" ");
  if (i === -1) return pluralizeWord(phrase);
  return phrase.slice(0, i + 1) + pluralizeWord(phrase.slice(i + 1));
}
function singularizeLastWord(phrase: string): string {
  const i = phrase.lastIndexOf(" ");
  if (i === -1) return singularizeWord(phrase);
  return phrase.slice(0, i + 1) + singularizeWord(phrase.slice(i + 1));
}

/** Build set of normalized identifiers (name, displayName, plural, singular) for one item. */
function getOwnIdentifiers(item: SeedItem): Set<string> {
  const own = new Set<string>();
  for (const raw of [item.name, item.displayName].filter(Boolean)) {
    const n = (raw ?? "").trim().toLowerCase();
    if (!n) continue;
    own.add(n);
    const pl = pluralizeLastWord(n);
    if (pl !== n) own.add(pl);
    const sing = singularizeLastWord(n);
    if (sing !== n) own.add(sing);
  }
  return own;
}

/**
 * Remove any alias that equals (case-insensitive) another ingredient's name or displayName,
 * or the plural/singular form of that name. Prevents e.g. "Wild carrot" from claiming
 * "carrot" or "carrots" when "Carrot" is its own ingredient. An ingredient may keep its
 * own plural/singular as aliases (e.g. Grape keeps "grapes", Hazelnut keeps "hazelnuts").
 */
function removeReservedNameAliases(items: SeedItem[]): void {
  const reserved = new Set<string>();
  for (const item of items) {
    for (const raw of [item.name, item.displayName].filter(Boolean)) {
      const n = (raw ?? "").trim().toLowerCase();
      if (!n) continue;
      reserved.add(n);
      const pl = pluralizeLastWord(n);
      if (pl !== n) reserved.add(pl);
      const sing = singularizeLastWord(n);
      if (sing !== n) reserved.add(sing);
    }
  }
  let removed = 0;
  for (const item of items) {
    const own = getOwnIdentifiers(item);
    item.aliases = (item.aliases ?? []).filter((a) => {
      const norm = a.trim().toLowerCase();
      if (!norm) return false;
      if (reserved.has(norm) && !own.has(norm)) {
        removed++;
        return false;
      }
      return true;
    });
  }
  if (removed > 0) {
    console.warn(
      `Removed ${removed} alias(es) that matched another ingredient's name/displayName or its plural/singular.`,
    );
  }
}

function main() {
  const seedPath = path.resolve(__dirname, "../convex/ingredients-seed.json");
  const raw = JSON.parse(fs.readFileSync(seedPath, "utf-8")) as {
    items: SeedItem[];
  };
  const items = raw.items ?? [];
  for (const item of items) {
    item.aliases = dedupe(getAliases(item), item.name);
  }
  deduplicateAliasesAcrossIngredients(items);
  removeReservedNameAliases(items);
  const withAliases = items.filter((i) => (i.aliases ?? []).length > 0).length;
  fs.writeFileSync(seedPath, JSON.stringify({ items }, null, 2), "utf-8");
  console.log(
    `Items with aliases: ${withAliases}. Total items: ${items.length}.`,
  );
}

main();
