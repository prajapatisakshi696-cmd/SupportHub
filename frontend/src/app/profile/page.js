import ProfileManager from "../../features/auth/components/ProfileManager";
import RequireAuth from "../../features/auth/components/RequireAuth";

export default function ProfilePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
      <RequireAuth>
        <ProfileManager />
      </RequireAuth>
    </main>
  );
}
