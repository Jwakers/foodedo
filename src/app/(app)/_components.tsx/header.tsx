"use client";

import { APP_NAME, ROUTES } from "@/app/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useClerk } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import {
  ChefHat,
  ChevronsUpDown,
  Clipboard,
  Compass,
  FileText,
  Globe,
  Home,
  Image as ImageIcon,
  LogOut,
  Menu,
  MessageCircleQuestionMark,
  MessageSquare,
  Moon,
  Settings2,
  Shield,
  ShoppingCart,
  Sparkles,
  Sun,
  Users,
  Utensils,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { getCannyBoardUrl } from "./canny-identify";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useQuery(api.users.current);
  const { openUserProfile, openSignIn, signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const baseCannyBoardUrl = process.env.NEXT_PUBLIC_CANNY_BOARD_URL;
  const cannyBoardUrl = baseCannyBoardUrl ? getCannyBoardUrl(pathname) : null;

  useLayoutEffect(() => {
    if (headerRef.current) {
      document.body.style.setProperty(
        "--header-height",
        `${headerRef.current.clientHeight}px`,
      );
    }
  }, []);

  const handleSignOut = async () => {
    router.push(ROUTES.HOME);
    await signOut();
  };

  return (
    <header
      ref={headerRef}
      className="w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={ROUTES.DASHBOARD} className="flex items-center space-x-2">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl text-primary">{APP_NAME}</span>
        </Link>

        {/* Right side - Menu button only */}
        <div className="flex items-center space-x-4">
          {/* Navigation Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="size-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 safe-area-inset flex h-full flex-col overflow-hidden"
            >
              <SheetHeader className="shrink-0">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>
                  Quick access to all app features
                </SheetDescription>
              </SheetHeader>
              {/* Main Navigation Links - scrollable when content overflows */}
              <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2">
                <ul className="space-y-2">
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto"
                      asChild
                    >
                      <Link
                        href={ROUTES.DASHBOARD}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Home className="size-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Home</div>
                          <div className="text-sm text-muted-foreground">
                            Dashboard
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto"
                      asChild
                    >
                      <Link
                        href={ROUTES.PREFERENCES}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Settings2 className="size-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Settings</div>
                          <div className="text-sm text-muted-foreground">
                            Preferences and account setup
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </li>
                  {cannyBoardUrl ? (
                    <li>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-auto"
                        asChild
                      >
                        <a
                          data-canny-link
                          href={cannyBoardUrl}
                          onClick={() => setMenuOpen(false)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <MessageSquare className="size-4 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Give feedback</div>
                            <div className="text-sm text-muted-foreground">
                              Share beta feedback
                            </div>
                          </div>
                        </a>
                      </Button>
                    </li>
                  ) : null}
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto"
                      asChild
                    >
                      <Link
                        href={ROUTES.MY_RECIPES_DISCOVER_TAB}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Compass className="size-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Discover</div>
                          <div className="text-sm text-muted-foreground">
                            Browse our curated recipes
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto"
                      asChild
                    >
                      <Link
                        href={ROUTES.MY_RECIPES}
                        onClick={() => setMenuOpen(false)}
                      >
                        <ChefHat className="size-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">My Recipes</div>
                          <div className="text-sm text-muted-foreground">
                            View and manage recipes
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto"
                      asChild
                    >
                      <Link
                        href={ROUTES.SHOPPING_LIST}
                        onClick={() => setMenuOpen(false)}
                      >
                        <ShoppingCart className="size-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Shopping List</div>
                          <div className="text-sm text-muted-foreground">
                            Create smart shopping lists
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto"
                      asChild
                    >
                      <Link
                        href={ROUTES.CHALKBOARD}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Clipboard className="size-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Kitchen Chalkboard</div>
                          <div className="text-sm text-muted-foreground">
                            Quick notes for your kitchen
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto"
                      asChild
                    >
                      <Link
                        href={ROUTES.HOUSEHOLDS}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Users className="size-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Households</div>
                          <div className="text-sm text-muted-foreground">
                            Collaborate with family & friends
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto"
                      asChild
                    >
                      <Link
                        href={ROUTES.IMPORT_RECIPE}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Globe className="size-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Import Recipe</div>
                          <div className="text-sm text-muted-foreground">
                            Save recipes from websites
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto"
                      asChild
                    >
                      <Link
                        href={ROUTES.SUPPORT}
                        onClick={() => setMenuOpen(false)}
                      >
                        <MessageCircleQuestionMark className="size-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Help & Support</div>
                          <div className="text-sm text-muted-foreground">
                            Browse help docs and contact us
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </li>
                  {user?.isSuperUser ? (
                    <>
                      <li className="pt-4 mt-4 border-t border-border">
                        <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <Shield className="size-3.5" />
                          Super user
                        </div>
                      </li>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-auto"
                          asChild
                        >
                          <Link
                            href={ROUTES.ADMIN_INGREDIENTS}
                            onClick={() => setMenuOpen(false)}
                          >
                            <Utensils className="size-4 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Ingredients</div>
                              <div className="text-sm text-muted-foreground">
                                Manage canonical ingredients
                              </div>
                            </div>
                          </Link>
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-auto"
                          asChild
                        >
                          <Link
                            href={ROUTES.ADMIN_BLOG_GENERATOR}
                            onClick={() => setMenuOpen(false)}
                          >
                            <FileText className="size-4 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Blog generator</div>
                              <div className="text-sm text-muted-foreground">
                                Generate blog drafts with AI
                              </div>
                            </div>
                          </Link>
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-auto"
                          asChild
                        >
                          <Link
                            href={ROUTES.ADMIN_BLOG_IMAGES}
                            onClick={() => setMenuOpen(false)}
                          >
                            <ImageIcon className="size-4 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Blog images</div>
                              <div className="text-sm text-muted-foreground">
                                Generate blog hero images with AI
                              </div>
                            </div>
                          </Link>
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-auto"
                          asChild
                        >
                          <Link
                            href={ROUTES.ADMIN_RECIPE_ENHANCE}
                            onClick={() => setMenuOpen(false)}
                          >
                            <Sparkles className="size-4 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">
                                Recipe management
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Enhance, generate, and manage system recipes
                              </div>
                            </div>
                          </Link>
                        </Button>
                      </li>
                    </>
                  ) : null}
                </ul>
              </nav>
              <SheetFooter className="shrink-0">
                {/* Theme Toggle */}
                <Separator />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto"
                    >
                      {resolvedTheme === "dark" ? (
                        <Moon className="size-4 mr-3" />
                      ) : (
                        <Sun className="size-4 mr-3" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">
                          {resolvedTheme === "dark"
                            ? "Dark Mode"
                            : resolvedTheme === "light"
                              ? "Light Mode"
                              : "System Theme"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Change theme
                        </div>
                      </div>
                      <ChevronsUpDown className="size-4 ml-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="size-4 mr-2" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="size-4 mr-2" />
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <div className="size-4 mr-2 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full border border-current" />
                      </div>
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* User Management */}
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto"
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4 mr-3" />
                  Sign out
                </Button>
                <button
                  className="p-3 border rounded-lg"
                  type="button"
                  aria-label="Open user profile"
                  onClick={() => {
                    setMenuOpen(false);
                    const appearance = {
                      theme: resolvedTheme === "dark" ? dark : undefined,
                    };
                    if (user) {
                      openUserProfile({ appearance });
                      return;
                    }
                    openSignIn({
                      appearance,
                      afterSignInUrl: ROUTES.DASHBOARD,
                    });
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="size-8 relative">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user?.image} alt={user?.name ?? ""} />
                        <AvatarFallback className="rounded-lg">
                          {user?.name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">Account</div>
                      <div className="text-xs text-muted-foreground">
                        Manage your profile
                      </div>
                    </div>
                  </div>
                </button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
