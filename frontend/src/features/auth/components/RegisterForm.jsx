"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { registerSchema } from "../schemas";
import { useRegisterMutation } from "../../../services/authApi";
import { getApiErrorMessage } from "../../../utils/apiError";
import AuthCard from "./AuthCard";
import FormField from "./FormField";

export default function RegisterForm() {
  const router = useRouter();
  const [registerAccount, { error: requestError, isLoading }] = useRegisterMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values) {
    const result = await registerAccount(values);
    if (!("error" in result)) {
      router.replace("/customer/dashboard");
    }
  }

  return (
    <AuthCard
      title="Create your account"
      description="Start with a customer account. Your support workspace is ready when you need it."
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="name"
          label="Full name"
          autoComplete="name"
          registration={register("name")}
          error={errors.name}
        />
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
          autoComplete="new-password"
          registration={register("password")}
          error={errors.password}
        />
        <p className="-mt-3 text-xs leading-5 text-slate-500">
          Use at least 12 characters. Accounts created here receive the customer role.
        </p>
        {requestError ? (
          <p className="text-sm text-rose-700" role="alert">
            {getApiErrorMessage(requestError, "Unable to create the account.")}
          </p>
        ) : null}
        <button
          className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-medium text-emerald-800 hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
