import { Metadata } from "next";
import { RecipeEnhanceClient } from "./_components/recipe-enhance-client";

export const metadata: Metadata = {
  title: "Recipe enhancer",
  description: "Super user: improve recipe ingredients and method with AI",
};

export default function RecipeEnhancePage() {
  return <RecipeEnhanceClient />;
}
