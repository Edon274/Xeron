"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ContractFormValues = {
  title: string;
  provider: string;
  category: string;
  startDate: string;
  endDate?: string | null;
  renewalDate?: string | null;
  terminationDate?: string | null;
  frequency: string;
  amount: number;
  status: string;
  notes?: string | null;
};

export function ContractForm({
  initial,
  onSubmit,
  submitLabel = "Speichern",
  className,
}: {
  initial?: Partial<ContractFormValues>;
  onSubmit: (values: ContractFormValues) => Promise<void>;
  submitLabel?: string;
  className?: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ContractFormValues>({
    defaultValues: {
      title: "",
      provider: "",
      category: "OTHER",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      renewalDate: "",
      terminationDate: "",
      frequency: "MONTHLY",
      amount: 0,
      status: "ACTIVE",
      notes: "",
      ...initial,
    },
  });

  useEffect(() => {
    if (initial) {
      reset({
        ...initial,
        startDate: initial.startDate ? new Date(initial.startDate).toISOString().slice(0, 10) : "",
        endDate: initial.endDate ? new Date(initial.endDate).toISOString().slice(0, 10) : "",
        renewalDate: initial.renewalDate ? new Date(initial.renewalDate).toISOString().slice(0, 10) : "",
        terminationDate: initial.terminationDate ? new Date(initial.terminationDate).toISOString().slice(0, 10) : "",
      });
    }
  }, [initial, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Bezeichnung</Label>
          <Input required {...register("title")} />
        </div>
        <div>
          <Label>Anbieter</Label>
          <Input required {...register("provider")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Kategorie</Label>
          <Input {...register("category")} />
        </div>
        <div>
          <Label>Startdatum</Label>
          <Input type="date" {...register("startDate")} />
        </div>
        <div>
          <Label>Enddatum</Label>
          <Input type="date" {...register("endDate")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Verlaengerungsdatum</Label>
          <Input type="date" {...register("renewalDate")} />
        </div>
        <div>
          <Label>Kuendigungsdatum</Label>
          <Input type="date" {...register("terminationDate")} />
        </div>
        <div>
          <Label>Frequenz</Label>
          <Input placeholder="MONTHLY oder YEARLY" {...register("frequency")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Monatliche/Jaehrliche Kosten</Label>
          <Input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} />
        </div>
        <div>
          <Label>Status</Label>
          <Input placeholder="ACTIVE, ENDS_SOON, AUTO_RENEW, CANCELLED" {...register("status")} />
        </div>
      </div>

      <div>
        <Label>Notizen</Label>
        <Textarea rows={4} {...register("notes")} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
