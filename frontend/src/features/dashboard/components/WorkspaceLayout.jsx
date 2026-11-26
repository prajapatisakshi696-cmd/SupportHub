import RequireAuth from "../../auth/components/RequireAuth";
import WorkspaceShell from "../../../components/workspace/WorkspaceShell";

export default function WorkspaceLayout({ role, children }) {
  return (
    <RequireAuth allowedRoles={[role]}>
      <WorkspaceShell role={role}>{children}</WorkspaceShell>
    </RequireAuth>
  );
}
