import WorkspaceLayout from "../../../features/dashboard/components/WorkspaceLayout";

export default function AdminLayout({ children }) {
  return <WorkspaceLayout role="admin">{children}</WorkspaceLayout>;
}
