import Link from "next/link";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams;
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center gap-3">
          <MailCheck className="size-9" />
          <CardTitle className="text-xl">Check your email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">{reset ? "If that address has an account, a password reset link is on its way." : "Open the confirmation link we sent to your email to finish creating your account."}</p>
          <Button nativeButton={false} render={<Link href="/auth/sign-in" />} variant="outline">Back to sign in</Button>
        </CardContent>
      </Card>
    </main>
  );
}
