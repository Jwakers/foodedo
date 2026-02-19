# Intelligent Weekly Meal Plan Generator — Specification

**Version:** 1.0  
**Status:** Schema & Data Foundation (Implementation Ready)  
**Scope:** Database schema, behavioural model, generation model. UI and generator algorithm not in scope.

---

## 1. Feature Purpose

### 1.1 Problem Statement

The product is transforming from a manual meal planner into a weekly system generator. Current pain points:

- Users must manually choose meals for each slot.
- Planning requires significant decision-making effort.
- The system does not adapt to user preferences.
- Recipe collections are passive; recipes are not intelligently used.

### 1.2 Solution

Instead of users manually selecting recipes and building a plan, the system will:

1. Automatically generate a complete weekly meal plan in one action.
2. Use structured constraints and lightweight behavioural learning.
3. Produce an automatically generated shopping list.
4. Allow users to swap or remove meals.
5. Learn from user behaviour over time.

Manual editing exists as **correction**, not creation.

---

## 2. User Experience Goal

- Users generate a full week in one action.
- The system improves over time without explicit configuration.
- The database structure supports adaptive weighting.
- The design is scalable and maintainable.

---

## 3. Algorithm Overview

The algorithm is constraint-based with behavioural weighting (not ML-based).

### Step 1: Build Recipe Pool

The pool may include:

- System-authored recipes (Foodedo)
- User private recipes
- Shared household recipes
- Public community recipes (future)

The schema supports differentiating these types via `source` and access rules.

### Step 2: Apply Structural Constraints

The weekly selection enforces rules such as:

- A mix of simple, moderate, and complex meals (complexity tier).
- No excessive repetition of the same primary protein.
- Cuisine diversification (e.g. avoid clustering Thai curry and korma in the same week).
- Avoid meals used in the immediate prior week (recently suggested).
- Prefer ingredient reuse across meals when possible (algorithm-level).

### Step 3: Behavioural Scoring

The system tracks:

- `suggestedCount`: times a recipe was suggested
- `swappedCount`: times it was swapped out
- `removedCount`: times it was removed
- `kept`: derived as `suggestedCount - swappedCount - removedCount`

Acceptance score: `(kept + smoothing) / (suggested + smoothingFactor)` (e.g. smoothing=1, smoothingFactor=2).

### Step 4: Weighted Selection

Final selection weight considers:

- Base weighting
- Recipe type bias (future)
- Behavioural acceptance score
- Optional editorial bias
- Constraint compliance

### Step 5: Plan Persistence

When a plan is generated:

- It is identifiable as system-generated (`isGenerated: true`).
- The generation seed and version are stored for reproducibility.
- Plan entries are editable.
- Individual entries may be locked by users.
- Shopping list is automatically generated and linked.

---

## 4. Behavioural Learning Model

### 4.1 Exposure

- **When:** Each time a recipe is included in a generated plan.
- **Where:** `recipeBehaviourStats.suggestedCount` incremented; `lastSuggestedAt` set.
- **Scope:** Per (recipe, actor). Actor = user for personal plans; household for shared plans.
- **Rule:** `suggestedCount` represents total exposure. **It must never be decremented.**

### 4.2 Acceptance (Derived)

- **Kept:** `kept = suggestedCount - swappedCount - removedCount`.
- Not stored; computed at query time.

### 4.3 Rejection (Outcomes)

- **Swapped:** Increment `swappedCount` for the old recipe. Increment `suggestedCount` and `lastSuggestedAt` for the new recipe. Never decrement `suggestedCount` for the old recipe.
- **Removed:** Increment `removedCount` for the recipe.
- Stats updated immediately in swap/remove mutations. No interaction state persisted on entries.

### 4.4 Smoothing

- Formula: `acceptanceScore = (kept + smoothing) / (suggested + smoothingFactor)`.
- Use `smoothing = 1`, `smoothingFactor = 2` or similar.
- Purpose: Avoid 0/0 and extreme ratios for new recipes; neutral score ~0.5 for new recipes.

### 4.5 Household vs User Stat Updates

- **Individual plans** (no `householdId`): user-level stats only. Actor = `{ actorType: "user", actorId: plan.userId }`.
- **Household plans** (with `householdId`): household-level stats only. Actor = `{ actorType: "household", actorId: plan.householdId }`.
- Stats are never double-counted.

---

## 5. Schema Design Summary

### 5.1 Constants (convex/lib/constants.ts)

- `RECIPE_SOURCES`: user, system, community
- `PRIMARY_PROTEINS`: chicken, beef, pork, fish, seafood, vegetarian, vegan, lamb, turkey, other, none
- `COMPLEXITY_TIERS`: simple, moderate, complex
- `CUISINES`: italian, indian, mexican, thai, chinese, japanese, korean, french, mediterranean, middle_eastern, british, american, caribbean, african, vietnamese, greek, spanish, other
- `CUISINE_MAX_SELECTIONS`: 2

### 5.2 Recipes Table — New Fields

| Field               | Type                    | Purpose                                              |
| ------------------- | ----------------------- | ---------------------------------------------------- |
| source              | optional union          | user / system / community                            |
| userId              | optional id(users)      | Optional for system recipes                          |
| primaryProtein      | optional union          | Variety constraint                                   |
| complexityTier      | optional union          | simple / moderate / complex                          |
| cuisine             | optional array(union)   | Max 2; fusion support                                |
| totalTimeMinutes    | optional number         | prepTime + cookTime                                  |
| editorialBias       | optional number         | (0, 2]; neutral = 1                                  |
| isGeneratorEligible | optional boolean        | Explicit generator pool eligibility                  |

### 5.3 New Table: recipeBehaviourStats

| Field            | Type              | Purpose                               |
| ---------------- | ----------------- | ------------------------------------- |
| recipeId         | id(recipes)       | Recipe being tracked                  |
| actorType        | "user" \| "household" | Scope of stats                    |
| actorId          | id(users) \| id(households) | User or household           |
| suggestedCount   | number            | Total exposure; never decremented     |
| swappedCount     | number            | Times swapped out                     |
| removedCount     | number            | Times removed                         |
| lastSuggestedAt  | number            | Last suggestion timestamp             |
| updatedAt        | number            | Cache invalidation                    |

Indexes: `by_recipe_and_actor`, `by_actor`, `by_actor_lastSuggestedAt`.

### 5.4 MealPlans Table — New Fields

| Field              | Type                    | Purpose                         |
| ------------------ | ----------------------- | ------------------------------- |
| isGenerated        | boolean (required)      | System-generated vs manual      |
| generationSeed     | optional string         | Deterministic regeneration      |
| generationVersion  | optional number         | Algorithm version               |
| generatedAt        | optional number         | Generation timestamp            |
| replacedByPlanId   | optional id(mealPlans)  | Superseded plan reference       |

### 5.5 MealPlanEntries Table — New Fields

| Field   | Type               | Purpose                 |
| ------- | ------------------ | ----------------------- |
| isLocked | optional boolean  | Preserved on regeneration |

### 5.6 Index Summary

| Table                | Index                    | Purpose                         |
| -------------------- | ------------------------ | ------------------------------- |
| recipes              | by_source                | Filter system/community         |
| recipes              | by_cuisine               | Cuisine diversification         |
| recipes              | by_primaryProtein        | Protein variety                 |
| recipes              | by_complexityTier        | Complexity mix                  |
| recipes              | by_isGeneratorEligible   | Pool filtering                  |
| recipeBehaviourStats | by_recipe_and_actor      | Upsert lookup                   |
| recipeBehaviourStats | by_actor                 | Fetch stats for generation      |
| recipeBehaviourStats | by_actor_lastSuggestedAt | Avoid recently used             |
| mealPlans            | by_replacedByPlanId      | Find superseded plans           |

---

## 6. Generation Data Model

### 6.1 Identifying Generated Plans

- `mealPlans.isGenerated === true`
- `generatedAt` and `generationVersion` for analytics

### 6.2 Regeneration Strategy (Option B)

Regeneration creates a **new** plan and migrates locked entries. The existing plan is **not deleted**.

1. Create new mealPlan with `isGenerated: true`.
2. Copy entries where `isLocked === true` to the new plan.
3. Generate meals for unlocked slots only.
4. Set old plan's `replacedByPlanId` to new plan's id.
5. Update shopping lists referencing old plan to reference new plan (or recreate).
6. Queries use the plan where `replacedByPlanId` is undefined as the active plan.

**Behavioural stats:** Do **not** increment `suggestedCount` for migrated locked entries. Only increment for newly generated slots.

### 6.3 Deterministic Generation

1. Sort recipe pool deterministically (e.g. by recipeId).
2. Use seeded randomness (e.g. seedrandom with generationSeed).
3. Ensure weighting uses stable inputs only.
4. Document ordering and RNG in implementation.

### 6.4 Recently Used Mechanism

- **Definition:** "Recently used" = "recently suggested", **not** "recently kept". A recipe suggested and immediately swapped out still counts as recently used.
- **Source:** `recipeBehaviourStats.lastSuggestedAt`
- **Query:** Filter recipes where `lastSuggestedAt` is null or older than (now - N days).
- **Future:** `lastKeptAt` for "recently kept" intelligence.

### 6.5 Shopping List Link

- `shoppingLists.mealPlanId` links to plan.
- Generator creates plan → creates entries → creates shopping list from plan.

---

## 7. System Recipe Inclusion

- **System recipes:** `source === "system"`, `userId` undefined.
- **Pool building:** Include recipes where `source === "system"` OR `(source === "user"` and user has access) OR household-shared.
- **User-only queries:** Continue to filter by `userId`; system recipes excluded from those. Use optional chaining for `recipe.userId`.
- **Access control:** System recipes readable by all authenticated users for generation.

---

## 8. Generator Eligibility

- Recipes missing required metadata excluded unless `isGeneratorEligible === true`.
- **Required metadata (MVP):** `primaryProtein`, `complexityTier` (or equivalent).
- **Recommendation:** Use `isGeneratorEligible` as explicit opt-in. User recipes default `false`; system recipes explicitly set.

---

## 9. Constraints

- Do not break existing functionality.
- Minimise destructive schema changes.
- Prefer additive changes.
- Ensure backward compatibility where possible.
- Plan for migration where needed.

---

## 10. Non-Goals (This Feature Does NOT)

- Implement the generator algorithm (separate work).
- Implement UI for the generator (separate work).
- ML-based recommendation.
- Recipe parsing or import changes.
- Community recipes or user collections (future).

---

## 11. Future Extensibility

- **Community recipes:** `source: "community"`; `userRecipeCollections` / `likedRecipes` tables.
- **recipeTypeBias:** Derived from `source` or curated metadata; use 1 as neutral until defined.
- **lastKeptAt:** For "recently kept" filtering.
- **Cuisine in algorithm:** Limit N per cuisine per week; spread cuisines across days.
- **Event log:** Separate table for swap/remove auditing if needed.

---

## 12. Critical Rules (Reference)

| Rule                      | Resolution                                                                 |
| ------------------------- | -------------------------------------------------------------------------- |
| suggestedCount            | Total exposure; never decremented                                          |
| kept                      | suggestedCount - swappedCount - removedCount                               |
| No interactionType on entries | Stats updated immediately in mutations                                 |
| isGenerated               | Required on mealPlans                                                      |
| Regeneration              | Option B: new plan, migrate locked, mark old with replacedByPlanId         |
| Locked entries on regen   | Do not increment suggestedCount                                            |
| Recently used             | = recently suggested (not recently kept)                                   |
| editorialBias             | Range (0, 2]; neutral = 1                                                  |
| Complexity vs time        | Avoid double-penalising when using both                                    |
