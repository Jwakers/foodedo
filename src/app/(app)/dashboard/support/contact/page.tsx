"use client";

import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "convex/_generated/api";
import { useAction } from "convex/react";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const REASON_OPTIONS = [
  { value: "App Feedback", label: "App Feedback" },
  { value: "Issue with the App", label: "Issue with the App" },
  { value: "Question", label: "Question" },
  { value: "Feature Request", label: "Feature Request" },
  { value: "Other", label: "Other" },
] as const;

const reasonValues = REASON_OPTIONS.map((option) => option.value);

const contactFormSchema = z.object({
  reason: z.enum(reasonValues),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { user } = useUser();
  const sendContactEmail = useAction(api.contact.sendContactEmail);
  const router = useRouter();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      reason: reasonValues[0],
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      await sendContactEmail({
        reason: data.reason,
        message: data.message,
      });

      toast.success("Message sent successfully!", {
        description: "Thank you for your feedback. We'll get back to you soon.",
      });
      form.reset();
      router.push(ROUTES.SUPPORT);
    } catch (error) {
      console.error("Error sending contact form:", error);
      toast.error("Failed to send message", {
        description: "Please try again or contact us directly.",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={ROUTES.SUPPORT} className="flex items-center gap-2">
            <ArrowLeft className="size-4" />
            Back to Support
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Contact Us</h1>
        </div>
        <p className="text-muted-foreground">
          We&apos;d love to hear from you! Send us a message and we&apos;ll
          respond as soon as possible.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send us a message</CardTitle>
          <CardDescription>
            {user ? (
              <>
                Sending as{" "}
                <strong>
                  {user.firstName} {user.lastName}
                </strong>{" "}
                ({user.emailAddresses[0]?.emailAddress})
              </>
            ) : (
              "Please sign in to send a message"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for contacting</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REASON_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe your feedback, question, or issue in detail..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting || !user}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
