# Pre-Launch Testing Checklist

Complete this checklist before launching Foodedo to production. Test in a production-like environment (Vercel preview deployment recommended).

---

## 🔐 Authentication & Account Management

### Sign Up Flow

- [ ] Can create account with Google
- [ ] Can create account with Email
- [ ] Receives welcome/verification email (if applicable)
- [ ] Redirects to dashboard after sign up
- [ ] Profile information is correctly saved

### Sign In Flow

- [ ] Can sign in with Google
- [ ] Can sign in with Email
- [ ] Redirects to dashboard after sign in
- [ ] Remember me / session persistence works
- [ ] "Forgot password" flow works

### Account Management

- [ ] Can view profile settings
- [ ] Can update profile information
- [ ] Can sign out successfully
- [ ] Session expires appropriately

---

## 📱 PWA Installation

### iOS Safari

- [ ] PWA installation prompt appears
- [ ] Can add to home screen
- [ ] App icon appears correctly on home screen
- [ ] Splash screen displays when launching
- [ ] App opens in standalone mode (no browser UI)
- [ ] Navigation works correctly
- [ ] Can return to app after leaving

### Android Chrome

- [ ] PWA installation prompt appears
- [ ] Can install to home screen
- [ ] App icon appears correctly
- [ ] App opens in standalone mode
- [ ] Navigation works correctly
- [ ] Can return to app after leaving

### Desktop (Chrome/Edge)

- [ ] Install prompt appears
- [ ] Can install as desktop app
- [ ] App icon appears in taskbar/dock
- [ ] App window opens correctly

---

## 🍳 Recipe Management

### Create Recipe

- [ ] Can create recipe manually
- [ ] Can add recipe title and description
- [ ] Can add ingredients with amounts and units
- [ ] Can add preparation steps (method)
- [ ] Can upload recipe image
- [ ] Can set category, prep time, cook time, serves
- [ ] Recipe saves correctly
- [ ] Appears in "My Recipes" immediately

### View Recipe

- [ ] Recipe displays all information correctly
- [ ] Images load properly
- [ ] Ingredients list is readable and formatted
- [ ] Method steps are clear
- [ ] Recipe metadata (times, serves) displays correctly

### Edit Recipe

- [ ] Can edit existing recipe
- [ ] Changes save correctly
- [ ] Can update recipe image
- [ ] Can add/remove ingredients
- [ ] Can add/remove method steps
- [ ] Can delete recipe (with confirmation)

### Recipe Categories & Search

- [ ] Can filter recipes by category
- [ ] Search functionality works
- [ ] Recipes display in correct order
- [ ] Pagination works (if applicable)

---

## 🤖 AI Recipe Import

### Import from URL

- [ ] Can paste recipe URL
- [ ] AI successfully extracts recipe from popular sites:
  - [ ] AllRecipes
  - [ ] BBC Good Food
  - [ ] Other major recipe sites
- [ ] Extracted data is accurate
- [ ] Can review and edit before saving
- [ ] Attribution/source is saved
- [ ] Error handling works for invalid URLs

### Import from Text

- [ ] Can paste recipe text
- [ ] AI parses ingredients correctly
- [ ] AI parses method steps correctly
- [ ] AI determines category appropriately
- [ ] Can review and edit before saving
- [ ] Error handling works for unclear text

---

## 🛒 Shopping List

### Create Shopping List

- [ ] Can create new shopping list
- [ ] Can select recipes to add
- [ ] Ingredients populate correctly
- [ ] Quantities are calculated properly
- [ ] Can add items from kitchen chalkboard

### Manage Shopping List

- [ ] Can check off items
- [ ] Can uncheck items
- [ ] Can edit item quantities
- [ ] Can add custom items
- [ ] Can remove items
- [ ] Changes save immediately (optimistic updates)
- [ ] Can clear completed items
- [ ] Can delete entire list

### Shopping List Sharing (if household member)

- [ ] Household members can see shared list
- [ ] Changes sync in real-time
- [ ] Multiple users can edit simultaneously
- [ ] No conflicts when editing together

---

## 📋 Kitchen Chalkboard

### Personal Chalkboard

- [ ] Can add items quickly
- [ ] Can edit items
- [ ] Can delete items
- [ ] Items persist across sessions
- [ ] Optimistic updates work smoothly

### Household Chalkboard

- [ ] Can access household chalkboard
- [ ] All household members see same items
- [ ] Changes sync in real-time
- [ ] Can distinguish between personal and household items

### Integration with Shopping List

- [ ] Can add chalkboard items to shopping list
- [ ] Items are added correctly
- [ ] Optional: Items can be removed from chalkboard after adding

---

## 👥 Household Collaboration

### Create Household

- [ ] Can create new household
- [ ] Can set household name
- [ ] Creator is set as owner
- [ ] Household appears in list

### Invite Members

- [ ] Can generate invitation link
- [ ] Invitation link works
- [ ] Invited user receives notification/email
- [ ] Can copy invitation link
- [ ] Invitation expires correctly

### Accept Invitation

- [ ] Can open invitation link
- [ ] Must be signed in to accept
- [ ] Joins household successfully
- [ ] Can see household name and members
- [ ] Can access shared recipes

### Share Recipes

- [ ] Can share recipe to household
- [ ] Recipe appears for all household members
- [ ] Original owner maintains control
- [ ] Attribution is clear (who shared it)

### Household Management

- [ ] Owner can view all members
- [ ] Owner can remove members
- [ ] Members can leave household
- [ ] Deleting household works correctly
- [ ] Leaving household doesn't delete personal recipes

---

## 📧 Contact & Support

### Contact Form

- [ ] Can access contact form
- [ ] Can select reason for contact
- [ ] Can write message
- [ ] Form validates input correctly
- [ ] Submission works
- [ ] Receives confirmation message
- [ ] Email is sent to correct address
- [ ] Email includes user information

### Support Pages

- [ ] FAQ page loads and displays correctly
- [ ] "How to Use" page loads correctly
- [ ] Support hub page works
- [ ] All links work

---

## 🌐 Website & SEO

### Homepage

- [ ] Loads quickly
- [ ] All sections display correctly
- [ ] CTAs work (sign up buttons)
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] Images load properly
- [ ] Beta badge displays correctly

### Legal Pages

- [ ] Privacy Policy page loads
- [ ] Privacy Policy is readable and formatted
- [ ] Terms of Service page loads
- [ ] Terms are readable and formatted
- [ ] Footer links to legal pages work

### SEO

- [ ] `/robots.txt` is accessible
- [ ] `/sitemap.xml` is accessible
- [ ] Homepage has correct meta title
- [ ] Homepage has correct meta description
- [ ] OpenGraph tags are present
- [ ] Twitter card tags are present

### Social Sharing

- [ ] Share on Facebook shows correct image and text
- [ ] Share on Twitter shows correct image and text
- [ ] Share on LinkedIn shows correct image and text
- [ ] OpenGraph image displays correctly (use [OpenGraph Preview](https://www.opengraph.xyz/))

---

## 📱 Mobile Responsiveness

### Key Pages - Mobile (375px - 430px)

- [ ] Homepage displays correctly
- [ ] Dashboard displays correctly
- [ ] Recipe list displays correctly
- [ ] Recipe detail page displays correctly
- [ ] Shopping list displays correctly
- [ ] Kitchen chalkboard displays correctly
- [ ] All buttons are tappable
- [ ] No horizontal scrolling
- [ ] Text is readable without zooming
- [ ] Forms are usable

### Key Pages - Tablet (768px - 1024px)

- [ ] Homepage displays correctly
- [ ] Dashboard displays correctly
- [ ] Recipe list displays correctly
- [ ] Recipe detail page displays correctly
- [ ] Shopping list displays correctly
- [ ] Kitchen chalkboard displays correctly

---

## 🎨 Theme & Accessibility

### Dark Mode

- [ ] Can toggle between light/dark mode
- [ ] Preference persists across sessions
- [ ] All pages render correctly in dark mode
- [ ] Text remains readable
- [ ] Images have appropriate styling

### Accessibility

- [ ] Can navigate with keyboard only
- [ ] Focus indicators are visible
- [ ] Form labels are present
- [ ] Images have alt text
- [ ] Color contrast meets WCAG standards
- [ ] Screen reader compatibility (basic test)

---

## ⚡ Performance

### Loading Times

- [ ] Homepage loads in < 3 seconds
- [ ] Dashboard loads in < 2 seconds
- [ ] Recipe pages load in < 2 seconds
- [ ] Images load progressively (not all at once)

### Interactions

- [ ] No lag when typing
- [ ] Buttons respond immediately
- [ ] Optimistic updates feel instant
- [ ] No jank when scrolling
- [ ] Animations are smooth

---

## 🔒 Security & Privacy

### Data Protection

- [ ] User data is private to their account
- [ ] Can't access other users' recipes via URL manipulation
- [ ] Household data is only visible to members
- [ ] File uploads are validated
- [ ] No sensitive data in console logs (production)

### Authentication

- [ ] Can't access protected routes when logged out
- [ ] Session expires appropriately
- [ ] Logout works from all devices/tabs

---

## 🐛 Error Handling

### Network Errors

- [ ] Handles offline state gracefully
- [ ] Shows appropriate error messages
- [ ] Can retry failed requests
- [ ] Doesn't crash on network failure

### User Errors

- [ ] Form validation shows clear messages
- [ ] Invalid URLs show helpful errors
- [ ] Missing required fields are indicated
- [ ] Error messages are user-friendly (not technical)

### Server Errors

- [ ] 404 page displays correctly
- [ ] Error boundaries catch crashes
- [ ] Error page has link back to dashboard
- [ ] Errors are logged (for debugging)

---

## 🔍 Browser Testing

Test in these browsers:

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS 15+)
- [ ] Mobile Chrome (Android)

---

## 📊 Production Environment

### Deployment

- [ ] Environment variables are set in Vercel
- [ ] Convex is in production mode
- [ ] No console errors in production build
- [ ] No console warnings in production build
- [ ] Production URL is correct
- [ ] Custom domain works (if applicable)

### Monitoring

- [ ] Can access Convex dashboard logs
- [ ] Can access Vercel deployment logs
- [ ] Clerk authentication logs are accessible

---

## ✅ Final Checks

### Content

- [ ] No Lorem Ipsum text
- [ ] No placeholder images (except those being replaced)
- [ ] No TODO comments in user-facing text
- [ ] All links work
- [ ] No typos in main content

### Legal & Compliance

- [ ] Privacy Policy is up to date
- [ ] Terms of Service are up to date
- [ ] Contact email is monitored
- [ ] GDPR considerations (if EU users)

### Launch Readiness

- [ ] All critical features work
- [ ] No blocking bugs
- [ ] Team is aware of launch
- [ ] Rollback plan is ready
- [ ] Support process is defined

---

## 🚀 Post-Launch (First 24 Hours)

- [ ] Monitor error logs
- [ ] Watch user sign-ups
- [ ] Check contact form submissions
- [ ] Verify email delivery
- [ ] Monitor performance metrics
- [ ] Be ready to respond to feedback

---

## Notes & Issues

Use this space to track any issues found during testing:

```
Issue: [Description]
Severity: [Critical/High/Medium/Low]
Status: [Open/In Progress/Resolved]
Notes: [Additional context]
```

---

## Testing Sign-Off

**Tested By:** \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***

**Date:** \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***

**Environment:** [ ] Staging [ ] Production Preview [ ] Production

**Result:** [ ] Pass [ ] Pass with Issues [ ] Fail

**Issues Found:** \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***

**Ready for Launch:** [ ] Yes [ ] No [ ] Conditional

---

Good luck with your launch! 🎉
