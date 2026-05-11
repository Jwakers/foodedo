import { Metadata } from "next";
import { RecipeEnhanceClient } from "./_components/recipe-enhance-client";

export const metadata: Metadata = {
  title: "Recipe management",
  description:
    "Super user: enhance recipes and generate new system recipes with AI",
};

export default function RecipeEnhancePage() {
  return <RecipeEnhanceClient />;
}
