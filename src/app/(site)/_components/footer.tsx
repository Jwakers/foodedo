import { APP_NAME, ROUTES } from "@/app/constants";
import { Utensils } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <Utensils className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              Weekly meal plans in one click, plus recipes, smart shopping lists,
              and your household, all in one place.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={ROUTES.BLOG}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PRICING}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.FAMILY_MEAL_PLANNING}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Family meal planning
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.RECIPE_TO_SHOPPING_LIST}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Recipe to shopping list
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.HOUSEHOLD_MEAL_PLANNING}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Household planning
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={ROUTES.PUBLIC_SUPPORT}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Help & Support
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PUBLIC_SUPPORT_CONTACT}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.FAQ}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PUBLIC_SUPPORT_HOW_TO}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  How to Use
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={ROUTES.PRIVACY}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.TERMS}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Making meal planning fun and simple
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
