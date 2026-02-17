"use client";

import { APP_NAME, ROUTES } from "@/app/constants";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Authenticated, Unauthenticated } from "convex/react";
import { Menu, Utensils } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useState } from "react";

export function Header() {
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky safe-area-inset-top top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl text-primary">{APP_NAME}</span>
        </Link>

        <div className="flex items-center gap-x-4">
          <Button variant="ghost" asChild className="hidden md:block">
            <Link href={ROUTES.DISCOVER}>Discover</Link>
          </Button>
          <Button variant="ghost" asChild className="hidden md:block">
            <Link href={ROUTES.PRICING}>Pricing</Link>
          </Button>
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-x-4">
            <ModeToggle />
            <Authenticated>
              <UserButton
                appearance={{
                  baseTheme: theme === "dark" ? dark : undefined,
                }}
              />
            </Authenticated>
            <Unauthenticated>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get Started</Button>
              </SignUpButton>
            </Unauthenticated>
          </div>
        </div>

        {/* Mobile Menu */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <div className="flex items-center gap-x-2 md:hidden">
            <Authenticated>
              <UserButton
                appearance={{
                  baseTheme: theme === "dark" ? dark : undefined,
                }}
              />
            </Authenticated>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col space-y-4 mt-8 px-4">
              <nav className="flex flex-col space-y-6">
                {/* Product */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Product
                  </h3>
                  <Link
                    href={ROUTES.DISCOVER}
                    className="block text-foreground hover:text-primary transition-colors"
                    onClick={() => {
                      setMenuOpen(false);
                    }}
                  >
                    Discover
                  </Link>
                  <Link
                    href={ROUTES.PRICING}
                    className="block text-foreground hover:text-primary transition-colors"
                    onClick={() => {
                      setMenuOpen(false);
                    }}
                  >
                    Pricing
                  </Link>
                </div>

                {/* Support */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Support
                  </h3>
                  <div className="flex flex-col space-y-3">
                    <Link
                      href={ROUTES.SUPPORT}
                      className="block text-foreground hover:text-primary transition-colors"
                      onClick={() => {
                        setMenuOpen(false);
                      }}
                    >
                      Help & Support
                    </Link>
                    <Link
                      href={ROUTES.CONTACT}
                      className="block text-foreground hover:text-primary transition-colors"
                      onClick={() => {
                        setMenuOpen(false);
                      }}
                    >
                      Contact Us
                    </Link>
                    <Link
                      href={ROUTES.SUPPORT_FAQ}
                      className="block text-foreground hover:text-primary transition-colors"
                      onClick={() => {
                        setMenuOpen(false);
                      }}
                    >
                      FAQ
                    </Link>
                    <Link
                      href={ROUTES.SUPPORT_HOW_TO}
                      className="block text-foreground hover:text-primary transition-colors"
                      onClick={() => {
                        setMenuOpen(false);
                      }}
                    >
                      How to Use
                    </Link>
                  </div>
                </div>
              </nav>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Theme</span>
                  <ModeToggle />
                </div>
                <Unauthenticated>
                  <div className="flex flex-col space-y-2">
                    <SignInButton mode="modal">
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                          setMenuOpen(false);
                        }}
                      >
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button
                        className="w-full"
                        onClick={() => {
                          setMenuOpen(false);
                        }}
                      >
                        Get Started
                      </Button>
                    </SignUpButton>
                  </div>
                </Unauthenticated>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
