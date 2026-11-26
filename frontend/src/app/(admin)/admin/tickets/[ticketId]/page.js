import TicketDetailPage from "../../../../../features/dashboard/TicketDetailPage";

export default async function AdminTicketDetailPage({ params }) {
  const { ticketId } = await params;
  return <TicketDetailPage role="admin" ticketId={ticketId} />;
}
