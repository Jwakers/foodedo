import { auth } from "@clerk/nextjs/server";
import { api } from "convex/_generated/api";
import { getConvexHttpClient } from "@/lib/convex-http";

export async function requireSuperUser() {
  const { userId, getToken } = await auth();
  if (!userId) {
    throw new Error("Authentication required");
  }

  // If you have a Clerk JWT template named "convex", prefer it. Otherwise fall back to default.
  const token = (await getToken({ template: "convex" })) ?? (await getToken());
  if (!token) {
    throw new Error("Authentication required");
  }

  const convex = getConvexHttpClient({ auth: token });
  const user = await convex.query(api.users.current, {});
  if (!user?.isSuperUser) {
    throw new Error("Super user access required");
  }

  return user;
}

