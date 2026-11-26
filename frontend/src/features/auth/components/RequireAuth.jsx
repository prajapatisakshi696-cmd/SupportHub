"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useGetCurrentUserQuery } from "../../../services/authApi";
import { selectSessionStatus } from "../../../store/authSlice";

export default function RequireAuth({ children, allowedRoles }) {
  const router = useRouter();
  const sessionStatus = useSelector(selectSessionStatus);
  const { data: user, error, isLoading, refetch } = useGetCurrentUserQuery();
  const isUnauthorized = error?.status === 401;

  useEffect(() => {
    if (isUnauthorized) {
      router.replace("/login");
    }
  }, [isUnauthorized, router]);

  if (isLoading || sessionStatus === "unknown") {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
        <p className="text-sm text-slate-600" role="status">Checking your session...</p>
      </main>
    );
  }

  if (isUnauthorized) {
    return null;
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Could not verify your session</h1>
        <p className="mt-2 text-sm text-slate-600">
          The support service could not be reached. Check the API and try again.
        </p>
        <button
          className="mt-5 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white"
          onClick={refetch}
          type="button"
        >
          Try again
        </button>
      </main>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6 text-center">
        <p className="text-slate-700">You do not have permission to view this page.</p>
      </main>
    );
  }

  return children;
}
