import { listTicketMessages } from "../services/messageService.js";

export async function listTicketMessagesHandler(request, response) {
  const result = await listTicketMessages(
    request.validatedParams.ticketId,
    request.user,
    request.validatedQuery,
  );
  response.status(200).json(result);
}
