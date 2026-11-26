"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { resetPasswordSchema } from "../schemas";
import { useResetPasswordMutation } from "../../../services/authApi";
import { getApiErrorMessage } from "../../../utils/apiError";
import AuthCard from "./AuthCard";
import FormField from "./FormField";

export default function ResetPasswordForm({ email, token }) {
  const [resetComplete, setResetComplete] = useState(false);
  const [resetPassword, { error, isLoading }] = useResetPasswordMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values) {
    if (!email || !token) {
      return;
    }
    const result = await resetPassword({
      email,
      token,
      password: values.password,
    });
    if (!("error" in result)) {
      setResetComplete(true);
    }
  }

  if (resetComplete) {
    return (
      <AuthCard title="Password updated" description="Your password has been reset.">
        <Link
          className="inline-flex rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
          href="/login"
        >
          Continue to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      description={email ? `Resetting the password for ${email}.` : "Use the reset link from your email."}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          registration={register("password")}
          error={errors.password}
        />
        <FormField
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          registration={register("confirmPassword")}
          error={errors.confirmPassword}
        />
        {!email || !token ? (
          <p className="text-sm text-rose-700" role="alert">
            This reset link is incomplete. Request a new one.
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {getApiErrorMessage(error, "Unable to reset the password.")}
          </p>
        ) : null}
        <button
          className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isLoading || !email || !token}
          type="submit"
        >
          {isLoading ? "Saving..." : "Reset password"}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        <Link className="font-medium text-emerald-800 hover:underline" href="/login">
          Return to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
