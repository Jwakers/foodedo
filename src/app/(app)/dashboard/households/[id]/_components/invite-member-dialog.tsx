"use client";

import { APP_NAME } from "@/app/constants";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useShare from "@/lib/hooks/use-share";
import { useMutation } from "convex/react";
import { AlertCircle, Check, Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: Id<"households">;
  householdName: string;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  householdId,
  householdName,
}: InviteMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const createInvitation = useMutation(api.households.createInvitationLink);
  const { canShare, copyToClipboard, share } = useShare();

  const handleCreateInvitation = async () => {
    setIsLoading(true);

    try {
      const result = await createInvitation({
        householdId,
      });
      setInvitationToken(result.token);
      toast.success("Invitation link created!");
    } catch (error: unknown) {
      console.error("Error creating invitation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create invitation",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const invitationUrl = invitationToken
    ? `${window.location.origin}/invite/${invitationToken}`
    : "";

  const handleCopyLink = async () => {
    if (invitationUrl) {
      await copyToClipboard(invitationUrl);
      setCopied(true);
      toast.success("Invitation link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!invitationUrl) return;

    if (canShare) {
      await share(
        `Join ${householdName} on ${APP_NAME}`,
        `You've been invited to join ${householdName}! Click the link to accept.`,
        invitationUrl,
      );

      toast.success("Invitation shared!");
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  const resetDialogState = () => {
    setInvitationToken(null);
    setCopied(false);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetDialogState();
    }
    onOpenChange(nextOpen);
  };

  const handleClose = () => handleDialogOpenChange(false);

  useEffect(() => {
    if (open) return;
    resetDialogState();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Create a single-use invitation link for {householdName}
          </DialogDescription>
        </DialogHeader>

        {invitationToken ? (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Check className="size-5" />
              <span className="font-medium">Invitation Link Created!</span>
            </div>

            <Alert>
              <AlertCircle className="size-4" />
              <AlertDescription>
                This link can only be used once. After someone accepts,
                you&apos;ll need to create a new link for the next person.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Invitation Link</Label>
              <div className="flex gap-2">
                <Input value={invitationUrl} readOnly className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Expires in 7 days • Single-use only
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleShare}
                className="flex-1"
                variant="default"
              >
                <Share2 className="mr-2 size-4" />
                Share Link
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <Alert>
              <AlertCircle className="size-4" />
              <AlertDescription>
                Each invitation link can only be used by one person. You can
                create multiple links to invite multiple people.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateInvitation}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Creating..." : "Create Invitation Link"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
