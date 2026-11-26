import ResetPasswordForm from "../../../features/auth/components/ResetPasswordForm";

export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams;

  return (
    <ResetPasswordForm
      email={typeof params.email === "string" ? params.email : ""}
      token={typeof params.token === "string" ? params.token : ""}
    />
  );
}
