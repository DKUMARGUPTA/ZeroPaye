"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ZeroPaye Error Boundary
 * Catches client-side render errors and shows a friendly fallback
 * instead of a blank screen. Includes "Reload" button.
 */
export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ZeroPaye ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
        <AlertTriangle className="h-8 w-8 text-rose-600" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold">Kuch gadbad ho gayi</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Page load karte waqt ek error aaya. Yeh humari team ko bhej diya gaya hai.
          Phir try karein.
        </p>
      </div>
      {error.digest && (
        <code className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
          Error ID: {error.digest}
        </code>
      )}
      <Button onClick={reset} size="sm" className="rounded-full">
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        Phir try karein
      </Button>
    </div>
  );
}
