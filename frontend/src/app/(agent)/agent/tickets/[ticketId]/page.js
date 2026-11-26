import TicketDetailPage from "../../../../../features/dashboard/TicketDetailPage";

export default async function AgentTicketDetailPage({ params }) {
  const { ticketId } = await params;
  return <TicketDetailPage role="agent" ticketId={ticketId} />;
}
