# PWA Assets & Branding Guide

This guide outlines all the images and assets that need to be created/replaced for Foodedo's launch.

## Priority: High - Required for Launch

### 1. OpenGraph Social Sharing Image

**Location:** `/public/og-image.png`

**Dimensions:** 1200 x 630 pixels

**Purpose:** Used when sharing Foodedo on social media (Facebook, Twitter, LinkedIn, etc.)

**Design Guidelines:**

- Include "Foodedo" branding/logo
- Clear, readable text even at smaller sizes
- Consider tagline: "Family Meal Planning Made Simple"
- Use brand colors (based on your theme)
- Simple, clean design that represents the app

**Status:** ✅ Layout configured, awaiting image

---

## Priority: Medium - PWA Installation

### 2. PWA Manifest Icons

**App Icons:**

- `/public/web-app-manifest-192x192.png` (192 x 192 pixels)
- `/public/web-app-manifest-512x512.png` (512 x 512 pixels)

**Purpose:** Displayed when app is installed on home screen

**Design Guidelines:**

- Simple, recognizable icon
- Works well at small sizes
- Avoid text (except possibly "KS" monogram)
- Solid background color or transparent
- Consider a cooking/meal planning related icon (chef hat, utensils, plate, etc.)

**Current Status:** ⚠️ Using placeholder images

---

### 3. Apple Touch Icon

**Location:** `/public/apple-touch-icon.png`

**Dimensions:** 180 x 180 pixels

**Purpose:** iOS home screen icon

**Design Guidelines:**

- Same design as PWA icons
- iOS will automatically round corners and add shadow
- Don't add rounded corners yourself

**Current Status:** ⚠️ Using placeholder

---

### 4. Favicons

**Files:**

- `/public/favicon.ico` (32 x 32 pixels, multi-size .ico file)
- `/public/favicon.svg` (vector, any size)
- `/public/favicon-96x96.png` (96 x 96 pixels)

**Purpose:** Browser tab icon

**Design Guidelines:**

- Simple, recognizable at tiny sizes
- Can be simplified version of main icon
- SVG should be single color or simple gradient

**Current Status:** ⚠️ Using placeholder

---

## Priority: Low - Optional (Can use defaults)

### 5. Apple Splash Screens

**Files:** All `/public/apple-splash-*.jpg` files

**Purpose:** Loading screen when launching PWA on iOS

**Options:**

1. **Simple approach (Recommended for MVP):** Create one default splash screen with Foodedo branding on a colored background
2. **Advanced approach:** Create device-specific optimized splash screens

**Design Guidelines:**

- Brand colors with "Foodedo" logo/text centered
- Minimal design - users see this briefly
- Consider using a gradient or solid color with logo

**Current Status:** ⚠️ Using placeholder images

**Note:** You can replace all splash screen files with the same image for MVP, or use a tool to generate device-specific versions from a single design.

---

## Design Assets Needed - Summary

### Must Have:

1. ✅ OpenGraph image (1200x630) - **configured, needs image file**
2. PWA icons (192x192, 512x512)
3. Apple touch icon (180x180)
4. Favicons (ico, svg, 96x96)

### Nice to Have:

5. Apple splash screens (multiple sizes or one default)

---

## Quick Start: Minimum Viable Set

If you want to launch quickly, create these **3 core images**:

1. **Main icon design** (512 x 512 pixels)
   - Use this for all PWA icons, resize as needed

2. **OpenGraph image** (1200 x 630 pixels)
   - For social sharing

3. **Favicon** (96 x 96 pixels or SVG)
   - For browser tabs

You can scale and convert these for all the other required sizes.

---

## Tools & Resources

**Design Tools:**

- Figma (free)
- Canva (free tier available)
- Adobe Express (free tier)

**Icon Generators:**

- [PWA Builder](https://www.pwabuilder.com/imageGenerator) - Generate all PWA assets from one image
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Generate all favicon formats

**Recommended Workflow:**

1. Design 512x512 icon in Figma/Canva
2. Design 1200x630 OG image
3. Use PWA Builder to generate all required sizes
4. Replace files in `/public/`

---

## Brand Suggestions

Based on "Foodedo":

- **Colors:** Warm, inviting (oranges, yellows, greens)
- **Icon ideas:**
  - Chef's hat
  - Crossed utensils (fork & knife/spoon)
  - Cooking pot
  - Recipe card icon
  - "KS" monogram
- **Style:** Modern, friendly, approachable
- **Avoid:** Overly complex designs, too much text

---

## Verification

After adding new images, test:

- [ ] Social share preview (use [OpenGraph Preview](https://www.opengraph.xyz/))
- [ ] PWA installation on iOS Safari
- [ ] PWA installation on Android Chrome
- [ ] Favicon appears correctly in browser tabs
- [ ] Images appear sharp on retina displays

---

## Notes

- All current placeholder images are in place and working
- The app will function without replacing these, but branding will look generic
- OpenGraph metadata is already configured in `src/app/layout.tsx`
- PWA manifest is configured in `src/app/manifest.ts`

**Next Step:** Create the core 3 images listed in "Minimum Viable Set" above and replace the placeholder files.
