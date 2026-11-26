import CustomerTicketDetail from "../../../../../features/customer/CustomerTicketDetail";

export default async function CustomerTicketPage({ params }) {
  const { ticketId } = await params;
  return <CustomerTicketDetail ticketId={ticketId} />;
}
