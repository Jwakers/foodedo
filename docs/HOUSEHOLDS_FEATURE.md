# Households Feature Documentation

## Overview

The Households feature allows users to create groups and share their recipes with family and friends. This feature enables collaborative recipe management where users can belong to multiple households and view recipes shared by other household members.

## Architecture

### Database Schema

The feature uses four junction tables for scalability and efficient querying:

1. **households** - Core household entity
   - `name`: Household name
   - `ownerId`: Reference to the user who owns the household
   - `createdAt`, `updatedAt`: Timestamps
   - Index: `by_owner`

2. **householdMembers** - Many-to-many user-household relationship
   - `householdId`: Reference to household
   - `userId`: Reference to user
   - `role`: Either "owner" or "member"
   - `joinedAt`: Timestamp
   - Indexes: `by_household`, `by_user`, `by_user_and_household`

3. **householdInvitations** - Invitation tracking
   - `householdId`: Reference to household
   - `invitedByUserId`: User who sent the invitation
   - `invitedEmail`: Email address for invitation
   - `invitedUserId`: Optional reference if inviting existing user
   - `status`: "pending" | "accepted" | "rejected" | "expired"
   - `token`: Secure random token for email invitations
   - `expiresAt`, `createdAt`: Timestamps
   - Indexes: `by_household`, `by_email`, `by_token`, `by_user`, `by_status`

4. **householdRecipes** - Recipe sharing
   - `householdId`: Reference to household
   - `recipeId`: Reference to recipe
   - `sharedByUserId`: User who shared the recipe
   - `sharedAt`: Timestamp
   - Indexes: `by_household`, `by_recipe`, `by_household_and_recipe`

### Backend (Convex)

#### Key Files

- `convex/schema.ts` - Database schema definitions
- `convex/households.ts` - All household-related queries and mutations
- `convex/recipes.ts` - Updated to support household-shared recipes
- `convex/http.ts` - HTTP endpoint for invitation handling

#### Permission Helpers

```typescript
isHouseholdOwner(ctx, userId, householdId); // Check if user owns household
isHouseholdMember(ctx, userId, householdId); // Check if user is member
canAccessRecipe(ctx, userId, recipeId); // Check recipe access rights
```

#### Key Mutations

- `createHousehold` - Creates household and adds creator as owner
- `updateHousehold` - Updates household name (owner only)
- `deleteHousehold` - Deletes household with cascade cleanup
- `inviteUserByEmail` - Creates email-based invitation
- `acceptInvitation` / `acceptInvitationByToken` - Accept invitation
- `rejectInvitation` - Reject invitation
- `removeMember` - Remove member (owner only)
- `leaveHousehold` - Leave household voluntarily
- `shareRecipeToHousehold` - Share recipe to household
- `unshareRecipeFromHousehold` - Unshare recipe

### Frontend (Next.js)

#### Pages

1. `/dashboard/households` - List all user's households
2. `/dashboard/households/[id]` - Household detail page with members and recipes tabs
3. `/dashboard/households/[id]/settings` - Household settings (owner only)
4. `/invite/[token]` - Invitation acceptance page

#### Components

Located in `src/app/(app)/dashboard/households/_components/`:

- `CreateHouseholdDialog` - Create new household
- `HouseholdMemberList` - Display and manage members
- `HouseholdRecipeList` - Display shared recipes
- `InviteMemberDialog` - Invite members via email
- `ShareToHouseholdDialog` - Share recipe to households (in recipe detail page)

## User Flows

### Creating a Household

1. User navigates to `/dashboard/households`
2. Clicks "Create Household" button
3. Enters household name in dialog
4. System creates household and adds user as owner
5. User is redirected to household detail page

### Inviting Members

1. Household owner clicks "Invite Member" button
2. Enters member's email address
3. System creates invitation with secure token
4. Invitation link is generated for sharing
5. Recipient receives link (via email in production)
6. Recipient clicks link and is redirected to `/invite/[token]`
7. System validates token and adds user to household

### Sharing Recipes

1. Recipe owner opens recipe detail page
2. Clicks "Share" button
3. Selects households to share with
4. System creates householdRecipes records
5. Household members can now view recipe

### Viewing Shared Recipes

1. User navigates to household detail page
2. Views "Recipes" tab
3. Sees all recipes shared to household
4. Can click to view recipe (read-only if not owner)
5. Recipe page shows "Shared by [user]" attribution

## Security & Permissions

### Authorization Checks

Every mutation verifies user permissions:

- **Household Owner** - Can update, delete household, invite/remove members
- **Household Member** - Can view recipes, share own recipes, leave household
- **Recipe Owner** - Can share/unshare recipes, edit recipes
- **Non-Owner** - Can view shared recipes (read-only)

### Data Cleanup

Cascade deletions ensure data consistency:

- Deleting household → removes all members, invitations, recipe shares
- Deleting recipe → removes all household shares
- Removing member → maintains data integrity

### Invitation Security

- Tokens are cryptographically secure (32-byte random values)
- Invitations expire after 7 days
- Email validation prevents duplicate invitations
- Token-based acceptance prevents unauthorised access

## Future Enhancements

### Potential Features

1. **Email Integration** - Integrate with email service (Resend/SendGrid) for automated invitation emails
2. **In-App Search** - Search for existing users by email to send in-app invitations
3. **Household Roles** - Add more granular roles (Admin, Editor, Viewer)
4. **Ownership Transfer** - Allow household owner to transfer ownership
5. **Activity Feed** - Show recent recipe shares and member activity
6. **Notifications** - Notify members when recipes are shared
7. **Recipe Collections** - Create shared collections within households
8. **Meal Planning** - Collaborative meal planning features
9. **Shopping List Sharing** - Share shopping lists with household members
10. **Household Settings** - Configure visibility, privacy settings

### Technical Improvements

1. **Query Optimisation** - Add caching for frequently accessed household data
2. **Real-time Updates** - Use Convex subscriptions for live updates
3. **Batch Operations** - Bulk invite multiple users at once
4. **Search & Filters** - Advanced filtering for shared recipes
5. **Analytics** - Track household engagement metrics
6. **Rate Limiting** - Implement rate limits for invitations
7. **Invitation Cleanup Job** - Scheduled function to clean up expired invitations

## Testing Considerations

### Key Test Cases

1. **Permissions**
   - Non-owner cannot modify household
   - Non-member cannot access household recipes
   - Non-owner cannot edit shared recipes

2. **Edge Cases**
   - User belongs to multiple households
   - Recipe shared to multiple households
   - Expired invitation handling
   - Duplicate invitation prevention

3. **Data Integrity**
   - Cascade deletions work correctly
   - No orphaned records after household deletion
   - Recipe shares cleaned up on recipe deletion

## British English

All user-facing text uses British English spelling:

- "Unauthorised" (not "Unauthorized")
- "Colour" (not "Color")
- "Favourite" (not "Favorite")
- Date format: DD/MM/YYYY (localised to en-GB)

## API Reference

See `convex/households.ts` for complete API documentation. All functions include JSDoc comments explaining parameters and return values.
