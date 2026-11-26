"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  useChangePasswordMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
  useUpdateProfileMutation,
} from "../../../services/authApi";
import { getApiErrorMessage } from "../../../utils/apiError";
import { changePasswordSchema, profileSchema } from "../schemas";
import AuthCard from "./AuthCard";
import FormField from "./FormField";

function ProfileForm({ user }) {
  const [
    updateProfile,
    { error: requestError, isLoading, isSuccess },
  ] = useUpdateProfileMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name },
  });

  useEffect(() => reset({ name: user.name }), [reset, user.name]);

  async function onSubmit(values) {
    await updateProfile(values);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField
        id="profile-name"
        label="Full name"
        autoComplete="name"
        registration={register("name")}
        error={errors.name}
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="profile-email">
          Email
        </label>
        <input
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
          id="profile-email"
          readOnly
          value={user.email}
        />
      </div>
      {isSuccess ? (
        <p className="text-sm text-emerald-800" role="status">Profile updated.</p>
      ) : null}
      {requestError ? (
        <p className="text-sm text-rose-700" role="alert">
          {getApiErrorMessage(requestError, "Unable to update your profile.")}
        </p>
      ) : null}
      <button
        className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const router = useRouter();
  const [changePassword, { error: requestError, isLoading }] = useChangePasswordMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values) {
    const result = await changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    if (!("error" in result)) {
      reset();
      router.replace("/login");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField
        id="current-password"
        label="Current password"
        type="password"
        autoComplete="current-password"
        registration={register("currentPassword")}
        error={errors.currentPassword}
      />
      <FormField
        id="new-password"
        label="New password"
        type="password"
        autoComplete="new-password"
        registration={register("newPassword")}
        error={errors.newPassword}
      />
      <FormField
        id="confirm-password"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        registration={register("confirmPassword")}
        error={errors.confirmPassword}
      />
      {requestError ? (
        <p className="text-sm text-rose-700" role="alert">
          {getApiErrorMessage(requestError, "Unable to change your password.")}
        </p>
      ) : null}
      <button
        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "Updating..." : "Change password"}
      </button>
    </form>
  );
}

export default function ProfileManager() {
  const router = useRouter();
  const { data: user } = useGetCurrentUserQuery();
  const [logout, { isLoading: isSigningOut, error: logoutError }] = useLogoutMutation();

  async function onLogout() {
    const result = await logout();
    if (!("error" in result)) {
      router.replace("/login");
    }
  }

  if (!user) {
    return null;
  }

  const workspaceByRole = {
    admin: "/admin/dashboard",
    agent: "/agent/dashboard",
    customer: "/customer/dashboard",
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Your profile
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            href={workspaceByRole[user.role] ?? "/"}
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Back to workspace
          </Link>
          <button
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-60"
            disabled={isSigningOut}
            onClick={onLogout}
            type="button"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
      {logoutError ? (
        <p className="text-sm text-rose-700" role="alert">
          {getApiErrorMessage(logoutError, "Unable to sign out. Please try again.")}
        </p>
      ) : null}
      <AuthCard title="Profile details" description={`Account role: ${user.role}`}>
        <ProfileForm user={user} />
      </AuthCard>
      <AuthCard
        title="Change password"
        description="Changing your password signs out all active sessions."
      >
        <PasswordForm />
      </AuthCard>
    </div>
  );
}