import { Metadata } from "next";
import { BlogGeneratorClient } from "./_components/blog-generator-client";

export const metadata: Metadata = {
  title: "Blog generator",
  description: "Super user: generate blog drafts with AI",
};

export default function BlogGeneratorPage() {
  return <BlogGeneratorClient />;
}

