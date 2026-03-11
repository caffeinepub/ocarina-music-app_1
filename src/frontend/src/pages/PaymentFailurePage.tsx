import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import React from "react";

export function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div
        data-ocid="payment_failure.panel"
        className="max-w-md w-full bg-card border border-border rounded-3xl p-10 text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-full bg-destructive/10 border-2 border-destructive flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-destructive" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Payment Not Completed
          </h1>
          <p className="text-muted-foreground">
            Your payment was cancelled or failed. No charges were made.
          </p>
        </div>
        <Button
          data-ocid="payment_failure.button"
          size="lg"
          variant="outline"
          onClick={() => {
            window.location.href = "/";
          }}
          className="w-full border-border text-foreground hover:border-primary hover:text-primary font-semibold text-lg py-6"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
