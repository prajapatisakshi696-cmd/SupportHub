"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Paperclip } from "lucide-react";
import { useCreateTicketMutation, useGetActiveCategoriesQuery } from "../../services/ticketApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { createTicketFormSchema } from "../auth/schemas";
import {
  DashboardError,
  DashboardLoading,
} from "../dashboard/components/DashboardState";

const fieldClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10";

export default function CreateTicketPage() {
  const router = useRouter();
  const {
    data: categories,
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useGetActiveCategoriesQuery();
  const [createTicket, { isLoading: isCreating, error: createError }] =
    useCreateTicketMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTicketFormSchema),
    defaultValues: {
      subject: "",
      description: "",
      categoryId: "",
      priority: "medium",
    },
  });

  async function onSubmit(values) {
    const formData = new FormData();
    formData.append("subject", values.subject);
    formData.append("description", values.description);
    formData.append("categoryId", values.categoryId);
    formData.append("priority", values.priority);
    for (const file of Array.from(values.attachments ?? [])) {
      formData.append("attachments", file, file.name);
    }

    const result = await createTicket(formData);
    if (!("error" in result)) {
      router.replace(`/customer/tickets/${result.data.ticket._id}`);
    }
  }

  if (isLoadingCategories) {
    return <DashboardLoading label="Loading support categories..." />;
  }
  if (isCategoriesError) {
    return (
      <DashboardError
        message="Could not load support categories."
        onRetry={refetchCategories}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline"
        href="/customer/tickets"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to my requests
      </Link>

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
          Customer portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Tell us how we can help
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Share a few details so the support team can get your request to the
          right place.
        </p>
      </div>

      <form
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ticket-subject">
            Subject
          </label>
          <input
            className={fieldClassName}
            id="ticket-subject"
            maxLength={200}
            placeholder="A short summary of the issue"
            {...register("subject")}
          />
          {errors.subject ? (
            <p className="mt-1 text-sm text-rose-700">{errors.subject.message}</p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ticket-category">
              Category
            </label>
            <select
              className={fieldClassName}
              id="ticket-category"
              {...register("categoryId")}
            >
              <option value="">Choose a category</option>
              {(categories ?? []).map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId ? (
              <p className="mt-1 text-sm text-rose-700">{errors.categoryId.message}</p>
            ) : null}
            {!categories?.length ? (
              <p className="mt-1 text-sm text-amber-800" role="status">
                No support categories are available yet. Please try again later.
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ticket-priority">
              Priority
            </label>
            <select
              className={fieldClassName}
              id="ticket-priority"
              {...register("priority")}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ticket-description">
            What happened?
          </label>
          <textarea
            className={`${fieldClassName} min-h-36 resize-y leading-6`}
            id="ticket-description"
            maxLength={20000}
            placeholder="Include the steps you took and what you expected to happen."
            {...register("description")}
          />
          {errors.description ? (
            <p className="mt-1 text-sm text-rose-700">{errors.description.message}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700" htmlFor="ticket-attachments">
            <Paperclip aria-hidden="true" size={16} />
            Attach files <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            className={`${fieldClassName} file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-800`}
            id="ticket-attachments"
            multiple
            type="file"
            {...register("attachments")}
          />
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Up to five JPEG, PNG, WebP, or PDF files, 5 MB each.
          </p>
          {errors.attachments ? (
            <p className="mt-1 text-sm text-rose-700">{errors.attachments.message}</p>
          ) : null}
        </div>

        {createError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
            {getApiErrorMessage(createError, "Your request could not be created.")}
          </p>
        ) : null}

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <Link
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href="/customer/tickets"
          >
            Cancel
          </Link>
          <button
            className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isCreating || !categories?.length}
            type="submit"
          >
            {isCreating ? "Submitting request..." : "Submit request"}
          </button>
        </div>
      </form>
    </div>
  );
}
