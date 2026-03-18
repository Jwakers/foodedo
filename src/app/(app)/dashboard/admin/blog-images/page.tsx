import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSuperUser } from "@/lib/require-super-user";
import { ROUTES } from "@/app/constants";
import { BlogImagesClient } from "./_components/blog-images-client";

export const metadata: Metadata = {
  title: "Blog images",
  description: "Super user: generate blog hero images with AI",
};

export default async function BlogImagesPage() {
  try {
    await requireSuperUser();
  } catch {
    redirect(ROUTES.DASHBOARD);
  }
  return <BlogImagesClient />;
}

