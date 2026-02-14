# Fix iOS Splash Screen - Quick Solutions

## Current Issue

The splash screen shows blank because it's just the icon with no background/sizing.

## Solution 1: Use PWA Asset Generator (Fastest - 2 minutes)

This will automatically generate proper splash screens:

```bash
cd /Users/jackwakeham/Documents/Projects/foodedo

# Install the tool (if not already installed)
npm install -g pwa-asset-generator

# Generate splash screens from your icon
pwa-asset-generator public/ios/512.png public \
  --splash-only \
  --background "#ffffff" \
  --type png \
  --quality 100 \
  --path-override ""
```

This creates properly sized splash screens for all iOS devices with your icon centered on a white background.

## Solution 2: Use Appscope Online (No installation - 3 minutes)

1. Go to: https://appsco.pe/developer/splash-screens
2. Upload `public/ios/512.png`
3. Choose:
   - Background color: White (#ffffff) or your brand color
   - Icon size: Medium (centered)
4. Click "Generate"
5. Download all files
6. Replace files in your `/public` folder

## Solution 3: Simple Manual Fix (Quick but basic)

Create a simple splash screen with ImageMagick or online:

```bash
# If you have ImageMagick installed:
convert -size 2048x2732 xc:"#ffffff" \
  public/ios/512.png -gravity center -composite \
  public/splash-2048-2732.png

# Repeat for key sizes:
# 1170x2532 (iPhone 14 Pro)
# 1284x2778 (iPhone 14 Pro Max)
# 1125x2436 (iPhone 13 Pro)
```

Or use Canva/Figma:

- Create canvas: 2048x2732px
- Background: White or brand color
- Add your icon centered
- Export as PNG
- Save as `splash-2048-2732.png`
- Resize for other devices

## Solution 4: Use Online Image Editor (No tools needed)

1. Go to: https://www.photopea.com/
2. File → New → 2048x2732px
3. Fill background with white or brand color
4. File → Open → your `ios/512.png`
5. Drag to center
6. File → Export As → PNG
7. Save as device-specific splash screens

## Quick Fix for MVP (10 seconds)

While you create proper splash screens, temporarily use a solid color:

Update `layout.tsx` to remove splash screens entirely for now:

- Comment out or remove the `startupImage` array
- iOS will show a white screen during load (better than blank)
- Add back proper splash screens later

## Recommended Splash Screen Sizes

For production, create these key sizes:

### iPhone (Portrait)

- 1170x2532 (iPhone 14 Pro)
- 1284x2778 (iPhone 14 Pro Max)
- 1125x2436 (iPhone X/11 Pro)
- 1242x2688 (iPhone XS Max/11 Pro Max)
- 750x1334 (iPhone SE)

### iPad (Portrait)

- 2048x2732 (iPad Pro 12.9")
- 1668x2388 (iPad Pro 11")
- 1536x2048 (iPad)

## Design Guidelines

**Good Splash Screen:**

- White or brand color background
- Icon centered (not too large, not too small)
- Optional: App name below icon
- Simple and clean

**Avoid:**

- Busy backgrounds
- Too much text
- Multiple colors
- Complex graphics

## After Creating Splash Screens

1. Save files to `/public/` with names like:
   - `apple-splash-1170-2532.png`
   - `apple-splash-1284-2778.png`
   - etc.

2. Update `src/app/layout.tsx` to reference proper filenames:

```typescript
startupImage: [
  {
    url: "/apple-splash-1170-2532.png",
    media: "(device-width: 390px) and (device-height: 844px)",
  },
  // ... etc
];
```

## Testing

After updating:

1. Deploy to Vercel
2. Delete PWA from home screen
3. Clear Safari cache
4. Re-install
5. Launch - should show proper splash screen!

---

## My Recommendation

**For MVP Launch TODAY:**

- Use Solution 1 (PWA Asset Generator) - takes 2 minutes
- Or temporarily remove splash screens (users won't mind)

**For Polish Later:**

- Create custom designed splash screens in Figma/Canva
- Match your brand colors and style
- Test on multiple devices

The PWA works now - splash screen is just polish! 🎉
