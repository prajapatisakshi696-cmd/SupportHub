"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useGetSlaSettingsQuery, useUpdateSlaSettingsMutation } from "../../services/settingsApi";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  DashboardError,
  DashboardLoading,
} from "../dashboard/components/DashboardState";

const slaSettingsSchema = z.object({
  slaHours: z.object({
    low: z.number().int().min(1).max(8760),
    medium: z.number().int().min(1).max(8760),
    high: z.number().int().min(1).max(8760),
    urgent: z.number().int().min(1).max(8760),
  }),
});

const priorities = [
  ["urgent", "Urgent", "Critical customer impact"],
  ["high", "High", "Significant service impact"],
  ["medium", "Medium", "Standard support request"],
  ["low", "Low", "General or low-impact request"],
];

export default function SlaSettingsPage() {
  const { data, isLoading, isError, error, refetch } = useGetSlaSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] =
    useUpdateSlaSettingsMutation();
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(slaSettingsSchema),
    defaultValues: {
      slaHours: { low: 72, medium: 24, high: 8, urgent: 2 },
    },
  });

  useEffect(() => {
    if (data?.slaHours) {
      reset({ slaHours: data.slaHours });
    }
  }, [data, reset]);

  async function saveSettings(values) {
    setNotice("");
    setActionError("");
    try {
      await updateSettings(values).unwrap();
      setNotice("SLA response targets saved.");
    } catch (error) {
      setActionError(
        getApiErrorMessage(error, "Could not save SLA response targets."),
      );
    }
  }

  if (isLoading) {
    return <DashboardLoading label="Loading SLA settings..." />;
  }
  if (isError) {
    return (
      <DashboardError
        message={getApiErrorMessage(error, "Could not load SLA settings.")}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
          Admin workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          SLA settings
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Set the target resolution time for each ticket priority.
        </p>
      </header>

      {notice ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">
          {notice}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-lg border border-rose-200 bg-white p-3 text-sm text-rose-800" role="alert">
          {actionError}
        </p>
      ) : null}

      <form
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit(saveSettings)}
      >
        <div className="space-y-5">
          {priorities.map(([key, label, description]) => (
            <div
              className="grid gap-3 border-b border-slate-100 pb-5 last:border-0 last:pb-0 sm:grid-cols-[1fr_auto]"
              key={key}
            >
              <div>
                <label
                  className="text-sm font-semibold text-slate-900"
                  htmlFor={`sla-${key}`}
                >
                  {label} priority
                </label>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <input
                    className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                    id={`sla-${key}`}
                    max={8760}
                    min={1}
                    type="number"
                    {...register(`slaHours.${key}`, { valueAsNumber: true })}
                  />
                  <span className="text-sm text-slate-600">hours</span>
                </div>
                {errors.slaHours?.[key] ? (
                  <p className="mt-1 text-xs text-rose-700" role="alert">
                    Enter a whole number between 1 and 8,760.
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-sm leading-6 text-slate-600">
            New tickets receive a deadline based on their priority. Changing a
            target affects new tickets; reprioritizing an active ticket recalculates
            its deadline from its original creation time.
          </p>
          <button
            className="mt-5 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Saving..." : "Save SLA targets"}
          </button>
        </div>
      </form>

      {data.updatedAt ? (
        <p className="text-xs text-slate-500">
          Last updated {new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(data.updatedAt))}
        </p>
      ) : null}
    </div>
  );
}
