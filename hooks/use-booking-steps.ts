import { useMemo } from "react";

export type BookingStep = { key: string; label: string };

export function useBookingSteps(deliveryEnabled?: boolean): BookingStep[] {
  return useMemo(() => {
    const steps: BookingStep[] = [{ key: "datetime", label: "Dates" }];
    if (deliveryEnabled) steps.push({ key: "delivery", label: "Delivery" });
    steps.push({ key: "deposit", label: "Deposit" });
    steps.push({ key: "checkout", label: "Payment" });
    return steps;
  }, [deliveryEnabled]);
}
