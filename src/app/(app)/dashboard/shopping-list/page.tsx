import { SuppressAppFeedback } from "@/app/(app)/_components.tsx/app-feedback-visibility";
import { Metadata } from "next";
import ShoppingListClient from "./_components/shopping-list-client";

export const metadata: Metadata = {
  title: "Shopping List",
  description: "Create a shopping list from your recipes",
};

export default function ShoppingListPage() {
  return (
    <>
      <SuppressAppFeedback />
      <ShoppingListClient />
    </>
  );
}
