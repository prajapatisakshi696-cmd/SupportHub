"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { forgotPasswordSchema } from "../schemas";
import { useForgotPasswordMutation } from "../../../services/authApi";
import { getApiErrorMessage } from "../../../utils/apiError";
import AuthCard from "./AuthCard";
import FormField from "./FormField";

export default function ForgotPasswordForm() {
  const [forgotPassword, { error, isLoading, data }] = useForgotPasswordMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values) {
    await forgotPassword(values);
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your account email and we will send a reset link if the account is active."
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          registration={register("email")}
          error={errors.email}
        />
        {data ? (
          <p className="text-sm text-emerald-800" role="status">{data.message}</p>
        ) : null}
        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {getApiErrorMessage(error, "Unable to request a reset link.")}
          </p>
        ) : null}
        <button
          className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        Remembered your password?{" "}
        <Link className="font-medium text-emerald-800 hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
