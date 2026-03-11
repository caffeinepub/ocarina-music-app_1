import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import React, { useEffect } from "react";

export function PaymentSuccessPage() {
  useEffect(() => {
    localStorage.setItem(
      "ocarina_access",
      JSON.stringify({
        type: "subscription",
        sessionId: Date.now().toString(),
      }),
    );
    // Track stripe unlock count
    const current = Number.parseInt(
      localStorage.getItem("ocarina_stripe_unlocks") || "0",
      10,
    );
    localStorage.setItem("ocarina_stripe_unlocks", String(current + 1));
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div
        data-ocid="payment_success.panel"
        className="max-w-md w-full bg-card border border-border rounded-3xl p-10 text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground">
            Welcome to OcarinaTab. Your access has been activated.
          </p>
        </div>
        <Button
          data-ocid="payment_success.button"
          size="lg"
          onClick={() => {
            window.location.href = "/app";
          }}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg py-6"
        >
          Open the App
        </Button>
      </div>
    </div>
  );
}
