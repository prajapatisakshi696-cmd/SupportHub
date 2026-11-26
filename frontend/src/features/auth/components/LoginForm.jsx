"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema } from "../schemas";
import { useLoginMutation } from "../../../services/authApi";
import { getApiErrorMessage } from "../../../utils/apiError";
import AuthCard from "./AuthCard";
import FormField from "./FormField";

export default function LoginForm() {
  const router = useRouter();
  const [login, { error: requestError, isLoading }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values) {
    const result = await login(values);
    if (!("error" in result)) {
      const destinationByRole = {
        admin: "/admin/dashboard",
        agent: "/agent/dashboard",
        customer: "/customer/dashboard",
      };
      router.replace(destinationByRole[result.data.user.role] ?? "/profile");
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to continue to your support workspace."
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
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          registration={register("password")}
          error={errors.password}
        />
        {requestError ? (
          <p className="text-sm text-rose-700" role="alert">
            {getApiErrorMessage(requestError, "Unable to sign in. Please try again.")}
          </p>
        ) : null}
        <button
          className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="mt-5 flex items-center justify-between gap-4 text-sm">
        <Link className="font-medium text-emerald-800 hover:underline" href="/forgot-password">
          Forgot password?
        </Link>
        <Link className="text-slate-600 hover:text-slate-900" href="/register">
          Create account
        </Link>
      </div>
    </AuthCard>
  );
}
