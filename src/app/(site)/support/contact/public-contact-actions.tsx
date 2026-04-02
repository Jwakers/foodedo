"use client";

import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

export function PublicContactActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <SignInButton mode="modal">
        <Button className="w-full sm:w-auto">Sign in</Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button variant="outline" className="w-full sm:w-auto">
          Create account
        </Button>
      </SignUpButton>
      <Button variant="ghost" asChild className="w-full sm:w-auto">
        <Link href={ROUTES.CONTACT}>
          Open in-app contact (requires sign-in)
        </Link>
      </Button>
    </div>
  );
}
