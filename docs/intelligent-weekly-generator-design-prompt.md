# Design Brief: Intelligent Weekly Meal Plan Generator

Use this prompt with a design-focused agent to generate UI/UX designs for the Intelligent Weekly Meal Plan Generator feature.

---

## Context

**Product:** Foodedo — a meal planning app that is evolving from manual planning into an **intelligent weekly system generator**.

**Core shift:** Today users manually pick meals for each slot. The new experience is: **generate a full week in one action**, then correct (swap or remove) as needed. The system learns from those corrections over time. Manual editing is **correction**, not creation.

---

## User experience goals

- **One action:** User can generate a complete weekly meal plan with a single action (e.g. “Generate my week”).
- **Transparency:** It’s clear which plans are system-generated vs manually built, and that the plan can be edited.
- **Correction, not creation:** Primary flows are: generate → review → swap or remove individual meals, and optionally lock meals so they persist on “regenerate.”
- **Invisible learning:** The system gets better over time (fewer swaps/removals) without the user having to configure anything. The UI doesn’t need to expose stats—just support the actions that feed learning (swap, remove, lock).
- **Shopping list:** A shopping list is automatically created from the generated plan and linked to it; the design should accommodate this relationship (e.g. entry point from plan to shopping list).

---

## Flows and screens to design

1. **Trigger / entry**
   - Where and how the user starts “Generate my week” (e.g. empty state, dashboard CTA, plan view header).
   - Loading/feedback while the plan is being generated (may take a few seconds).

2. **Generated plan view**
   - Week view of the generated plan (e.g. day columns, meal slots).
   - Clear indication that the plan is **system-generated** (e.g. badge, label, or subtle treatment) vs manually created.
   - Per-slot: recipe name, optional image, and **actions**: swap, remove, lock.
   - Lock: visual state for “locked” (e.g. icon, label) so users understand these meals stay when they hit “Regenerate.”

3. **Swap flow**
   - User chooses “Swap” on a slot → replace with another recipe (picker or search).
   - Consider: inline replacement vs modal/sheet; how the new recipe is dropped into the slot.

4. **Remove flow**
   - User removes a meal from a slot (slot becomes empty or “Add meal”).
   - Empty slots might be refilled on “Regenerate” or left for manual add—design for both possibilities.

5. **Regenerate**
   - Action like “Regenerate week” or “Generate again.”
   - Behaviour: creates a **new** plan; locked meals are copied over; only unlocked slots are re-generated. Old plan is superseded (user sees the new plan).
   - Design: where this control lives, confirmation or undo if needed, and any messaging (e.g. “Locked meals will be kept”).

6. **Empty / first-time state**
   - State when the user has no plan yet: prominent “Generate my week” and short explanation of what happens (one-click week, then edit as you like).

7. **Shopping list connection**
   - From a generated plan, how the user opens or sees the linked shopping list (e.g. button, link, or section).

---

## Data and states to support (for UI logic)

- **Plan origin:** System-generated (`isGenerated: true`) vs manual. Affects labels and possibly layout (e.g. “Generated plan” vs “My plan”).
- **Per-entry:** `isLocked` — show lock state and allow toggling (lock/unlock).
- **Regeneration:** User may have an “active” plan and a superseded one; primary UI should show the active plan; design need not show history unless you want a “previous plans” concept.

---

## Constraints and non-goals

- **In scope for design:** All UI for generating, viewing, editing (swap/remove), locking, and regenerating; empty states; link to shopping list. Assume the backend and algorithm exist as specified.
- **Out of scope:** Designing the generator algorithm itself, ML interfaces, or recipe import/parsing. No need to design community recipes or user collections (future).
- **Technical note:** The app uses React and existing UI primitives (e.g. dialogs, sheets); designs should be implementable with components and patterns that fit a typical React/front-end stack (no backend or schema design required).

---

## Design direction (for the design agent)

- **Purpose:** Reduce decision fatigue and effort: one action gives a full week; the user only tweaks. The interface should feel confident and supportive, not overwhelming.
- **Tone:** Choose a clear direction (e.g. calm and minimal, or warm and encouraging) that fits a food/meal-planning product and the “smart but simple” nature of the feature.
- **Differentiation:** What makes this generator experience feel distinct—e.g. the moment of “Generate my week,” the clarity of locked vs unlocked, or the way swap/remove feel lightweight and reversible.
- **Accessibility and responsiveness:** Consider keyboard use, focus order, and small/large screens for main flows (generate, plan view, swap, remove, regenerate, shopping list link).

Produce a design (wireframes, key screens, and/or component-level specs) that covers the flows and screens above and can be handed to a front-end developer to implement against the existing Intelligent Weekly Generator specification and data model.
