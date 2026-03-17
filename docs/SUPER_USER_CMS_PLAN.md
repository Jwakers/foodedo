# Super-user content management system (plan)

## 1. User table: super-user flag

- **Schema** ([convex/schema.ts](convex/schema.ts)): Add `isSuperUser: v.optional(v.boolean())` to `users`. No default; only set via DB.
- **Backend**: No Convex mutation or HTTP handler updates `isSuperUser`. Expose it via existing `users.current` (or equivalent) so client and Convex can gate on `user?.isSuperUser === true`.

---

## 2. Super-user-only ingredient CMS page

- **Route**: e.g. `(app)/dashboard/admin/ingredients/page.tsx`. Guard: redirect or "Access denied" when `user?.isSuperUser !== true`.
- **Backend** (e.g. [convex/adminIngredients.ts](convex/adminIngredients.ts)): Queries (list ingredients, broken/unlinked refs) and mutations (create, update, delete ingredients). All require super user; delete clears refs then removes ingredient.
- **Frontend**: Table/list of ingredients with Edit, Remove, Add new; section "Broken or unlinked references" from the new query.

---

## 3. Super-user navigation (PWA-friendly)

Because the app is a PWA, super users cannot rely on typing URLs. All super-user entry must be through in-app navigation.

- **Where**: Add a **Super user** section inside the main navigation. The primary nav is the hamburger menu (Sheet) in [header.tsx](src/app/(app)/_components.tsx/header.tsx). Add the section there (navbar is bottom bar and may be space-constrained; header sheet has the full list and is the right place for an extra section).
- **Visibility**: Render the Super user section only when `user?.isSuperUser === true` (use `api.users.current` already loaded in the header).
- **Distinct styling**: Style the Super user block so it is clearly separate from normal links, e.g.:
  - A labelled group: e.g. "Super user" heading with a distinct visual (border-top, different background, or muted/secondary styling) so it reads as a separate area.
  - Optional: icon (e.g. Shield or Settings) to reinforce it’s an admin area.
- **Content**: List of links to super-user pages. For now a single link:
  - **Ingredients** → `/dashboard/admin/ingredients` (or chosen route).
- **Extensible**: Structure the section as a list (array or map) of `{ label, href }` so new links (e.g. future "Sync", "Users", etc.) can be added without changing the layout.
- **ROUTES**: Add `ADMIN_INGREDIENTS: "/dashboard/admin/ingredients"` (and optionally `ADMIN: "/dashboard/admin"` if you add a landing page later) in [src/app/constants.ts](src/app/constants.ts).

---

## 4. Dev ↔ production ingredient sync (deferred)

- Treated as a separate task. Sync that preserves IDs and references needs its own design (e.g. externalId-based sync, mapping). CMS above is still useful per-environment.

---

## 5. Files to add or change (summary)

| Area | Action |
|------|--------|
| [convex/schema.ts](convex/schema.ts) | Add `isSuperUser: v.optional(v.boolean())` to `users` |
| [convex/users.ts](convex/users.ts) | No writes to `isSuperUser`; ensure `current` exposes it |
| New: `convex/adminIngredients.ts` | Super-user-gated queries and mutations for ingredients |
| New: `src/app/(app)/dashboard/admin/ingredients/page.tsx` | Super-user check; ingredients CRUD UI + broken/unlinked refs section |
| [src/app/(app)/_components.tsx/header.tsx](src/app/(app)/_components.tsx/header.tsx) | Add distinctly styled "Super user" section (visible only when `user?.isSuperUser === true`) with link(s); first link: Ingredients; structure for future links |
| [src/app/constants.ts](src/app/constants.ts) | Add `ADMIN_INGREDIENTS` (and optionally `ADMIN`) to ROUTES |

---

## 6. "Ingredients that don’t have associated ingredients"

- **Broken references**: Recipe/shopping list entries whose `ingredientId` points to a non-existent ingredient.
- **Unlinked**: Recipe/shopping list entries with no `ingredientId`.
- Admin query returns both; optional extra: "Unreferenced ingredients" (ingredient rows never referenced).
