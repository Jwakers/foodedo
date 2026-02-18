import type { WebhookEvent } from "@clerk/backend";
import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occurred", { status: 400 });
    }

    try {
      switch (event.type) {
        case "user.created": // intentional fallthrough
        case "user.updated":
          await ctx.runMutation(internal.users.upsertFromClerk, {
            firstName: event.data.first_name,
            lastName: event.data.last_name,
            email: event.data.email_addresses[0]?.email_address,
            image: event.data.image_url,
            externalId: event.data.id,
          });
          break;

        case "user.deleted": {
          const clerkUserId = event.data.id;
          if (!clerkUserId) {
            console.error("user.deleted event missing id");
            return new Response("Invalid event data", { status: 400 });
          }
          await ctx.runMutation(internal.users.deleteFromClerk, {
            clerkUserId,
          });
          break;
        }
        case "subscriptionItem.created":
        case "subscriptionItem.updated":
        case "subscriptionItem.active":
        case "subscriptionItem.canceled": {
          // NOTE: Using custom type because Clerk's billing feature is in beta and their
          // TypeScript definitions don't match the actual webhook payload structure.
          // The official types expect fields like 'credit', 'proration_date', 'next_payment_amount'
          // but the actual payload has 'payer' (object), 'subscription_id', 'interval', etc.
          // TODO: Once Clerk's billing feature exits beta, revisit this and use their built-in
          // types (assuming they're corrected) instead of the custom ClerkSubscriptionItemWebhookData.
          // Double cast (as unknown as ...) is necessary because the types are too different.

          // FAILSAFE: If this mutation fails, Clerk/Svix will retry the webhook automatically.
          // Additionally, our daily cron job (syncStaleSubscriptions) will catch any missed updates.
          const data =
            event.data as unknown as ClerkSubscriptionItemWebhookData;
          if (
            !data.payer?.user_id ||
            !data.plan.slug ||
            !data.status ||
            !data.subscription_id
          ) {
            console.error("Invalid subscription item webhook data", data);
            return new Response("Invalid event data", { status: 400 });
          }

          await ctx.runMutation(internal.users.updateSubscriptionTier, {
            externalId: data.payer?.user_id,
            subscriptionTier: data.plan.slug,
            subscriptionStatus: data.status,
            subscriptionId: data.subscription_id,
          });
          break;
        }
        default:
          console.log("Ignored Clerk webhook event", event.type);
      }

      // Return 200 to acknowledge successful processing
      // This tells Clerk/Svix not to retry this webhook
      return new Response(null, { status: 200 });
    } catch (error) {
      // Log the error for debugging
      console.error(`Failed to process webhook ${event.type}:`, error);

      // Return 500 to trigger Clerk/Svix automatic retry
      // They will retry with exponential backoff
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

// Recipe image script: single endpoint (same path as before, avoids "No matching routes")
// Protected by RECIPE_IMAGE_UPLOAD_SECRET so it is not publicly callable.
http.route({
  path: "/upload-recipe-image",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const uploadSecret = process.env.RECIPE_IMAGE_UPLOAD_SECRET;
    if (!uploadSecret) {
      console.error("RECIPE_IMAGE_UPLOAD_SECRET is not set");
      return new Response(JSON.stringify({ error: "Upload not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    const authHeader = request.headers.get("Authorization");
    const bearer = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    if (bearer !== uploadSecret) {
      return new Response(JSON.stringify({ error: "Unauthorised" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body: {
      recipeId?: string;
      image?: string;
      mimeType?: string;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.recipeId || !body.image) {
      return new Response(
        JSON.stringify({ error: "Missing recipeId or image" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      const uploadUrl = await ctx.runMutation(
        internal.migrations.getStorageUploadUrl,
        {},
      );

      const binaryString = atob(body.image);
      const imageBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imageBytes[i] = binaryString.charCodeAt(i);
      }
      const contentType = body.mimeType ?? "image/png";

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: imageBytes,
        headers: { "Content-Type": contentType },
      });

      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        console.error("Convex storage upload failed", {
          status: uploadRes.status,
          text,
        });
        return new Response(
          JSON.stringify({ error: "Storage upload failed" }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        );
      }

      const { storageId } = (await uploadRes.json()) as { storageId?: string };
      if (!storageId) {
        return new Response(
          JSON.stringify({ error: "No storageId in upload response" }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        );
      }

      await ctx.runMutation(internal.migrations.setSystemRecipeImage, {
        recipeId: body.recipeId as Id<"recipes">,
        storageId: storageId as Id<"_storage">,
      });

      return new Response(null, { status: 200 });
    } catch (error) {
      console.error("upload-recipe-image error:", error);
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Internal server error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }),
});

if (!process.env.CLERK_WEBHOOK_SECRET) {
  throw new Error("CLERK_WEBHOOK_SECRET is not set");
}

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing required Svix headers");
    return null;
  }

  const svixHeaders = {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  };
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

// Custom type based on actual Clerk webhook payload
// Clerk's TypeScript definitions don't match the actual webhook payload structure
type ClerkSubscriptionItemWebhookData = {
  id: string;
  object: "subscription_item";
  status:
    | "upcoming"
    | "active"
    | "canceled"
    | "ended"
    | "past_due"
    | "incomplete"
    | "abandoned";
  interval: "month" | "annual";
  is_free_trial: boolean;
  subscription_id: string;
  plan_id: string;
  period_start: number;
  period_end: number;
  created_at: number;
  updated_at: number;
  payer: {
    id: string;
    object: "commerce_payer";
    user_id: string;
    organization_id: string;
    organization_name: string;
    email: string;
    first_name: string;
    last_name: string;
    image_url: string;
    created_at: number;
    updated_at: number;
  };
  plan: {
    id: string;
    name: string;
    slug: string;
    amount: number;
    currency: string;
    is_recurring: boolean;
  };
};

export default http;
