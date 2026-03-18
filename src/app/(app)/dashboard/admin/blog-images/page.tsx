import type { Metadata } from "next";
import { BlogImagesClient } from "./_components/blog-images-client";

export const metadata: Metadata = {
  title: "Blog images",
  description: "Super user: generate blog hero images with AI",
};

export default function BlogImagesPage() {
  return <BlogImagesClient />;
}

