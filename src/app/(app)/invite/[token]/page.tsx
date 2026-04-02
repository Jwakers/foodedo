"use client";

import { api } from "@/../convex/_generated/api";
import { ROUTES } from "@/app/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import { use, useRef, useState } from "react";
import { toast } from "sonner";
import InviteCard from "./invite-card";
import InviteLoading from "./loading";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptedHouseholdId, setAcceptedHouseholdId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Snapshot the initial validation state - only check once to avoid
  // reactive query updates showing errors after successful acceptance
  const initialValidationError = useRef<string | null>(null);
  const hasInitialized = useRef(false);

  const invitationDetails = useQuery(api.households.getInvitationDetails, {
    token,
  });
  const acceptInvitation = useMutation(api.households.acceptInvitationByToken);

  // Capture initial validation state once (before any mutations)
  if (invitationDetails && !hasInitialized.current) {
    hasInitialized.current = true;

    if (invitationDetails.isExpired) {
      initialValidationError.current = "This invitation has expired";
    } else if (invitationDetails.isConsumed) {
      initialValidationError.current =
        "This invitation has already been used. Each invitation link can only be used once.";
    }
  }

  const isLoading = invitationDetails === undefined;
  const isSuccess = acceptedHouseholdId !== null;
  const errorMessage =
    error ??
    initialValidationError.current ??
    (invitationDetails === null ? "Invitation not found" : null);

  const handleAcceptInvitation = async () => {
    setIsAccepting(true);
    setError(null);
    try {
      const result = await acceptInvitation({ token });
      posthog.capture("household_invitation_accepted", {
        household_id: result.householdId,
      });
      setAcceptedHouseholdId(result.householdId);
      toast.success("Invitation accepted! Welcome to the household!");
    } catch (error: unknown) {
      console.error("Error accepting invitation:", error);
      setError(
        error instanceof Error ? error.message : "Failed to accept invitation.",
      );
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return <InviteLoading />;
  }

  if (errorMessage) {
    return (
      <InviteCard className="border-destructive">
        <XCircle className="size-16 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Invitation Invalid</h3>
        <p className="text-muted-foreground text-center mb-6">{errorMessage}</p>
        <Button asChild>
          <Link href="/dashboard/households">View My Households</Link>
        </Button>
      </InviteCard>
    );
  }

  if (isAccepting) {
    return (
      <InviteCard>
        <Loader2 className="size-16 text-primary animate-spin mb-4" />
        <h3 className="text-xl font-semibold mb-2">Accepting Invitation...</h3>
        <p className="text-muted-foreground text-center">
          Please wait whilst we add you to the household
        </p>
      </InviteCard>
    );
  }

  if (isSuccess) {
    return (
      <InviteCard className="border-primary">
        <CheckCircle className="size-16 text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">Invitation Accepted!</h3>
        <p className="text-muted-foreground text-center mb-6">
          You&apos;ve successfully joined the household. You can now view and
          share recipes with your household members.
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`${ROUTES.HOUSEHOLDS}/${acceptedHouseholdId}`}>
              View Household
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.HOUSEHOLDS}>All Households</Link>
          </Button>
        </div>
      </InviteCard>
    );
  }

  if (!invitationDetails) return null;

  return (
    <InviteCard>
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <CheckCircle className="size-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">You&apos;re Invited!</h3>
      <p className="text-muted-foreground text-center mb-2">
        <strong>{invitationDetails.invitedByName}</strong> has invited you to
        join
      </p>
      <p className="text-lg font-semibold text-foreground mb-6">
        {invitationDetails.householdName}
      </p>

      <Alert className="mb-6">
        <AlertCircle className="size-4" />
        <AlertDescription>
          This invitation can only be used once. If you accept, no one else can
          use this link.
        </AlertDescription>
      </Alert>

      <div className="flex gap-2 w-full">
        <Button onClick={handleAcceptInvitation} className="flex-1" size="lg">
          Accept Invitation
        </Button>
        <Button variant="outline" asChild className="flex-1" size="lg">
          <Link href="/dashboard/households">Maybe Later</Link>
        </Button>
      </div>
    </InviteCard>
  );
}
