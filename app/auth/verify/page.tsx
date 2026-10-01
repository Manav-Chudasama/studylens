import Link from "next/link";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center gap-3">
          <MailCheck className="size-9" />
          <CardTitle className="text-xl">Check your email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">Once email verification is connected, your sign-up link will take you back to StudyLens.</p>
          <Button nativeButton={false} render={<Link href="/auth/sign-in" />} variant="outline">Back to sign in</Button>
        </CardContent>
      </Card>
    </main>
  );
}
