import WorkspaceLayout from "../../../features/dashboard/components/WorkspaceLayout";

export default function AgentLayout({ children }) {
  return <WorkspaceLayout role="agent">{children}</WorkspaceLayout>;
}
