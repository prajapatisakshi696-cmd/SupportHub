import {
  assignTicket,
  claimTicket,
  createTicket,
  getTicket,
  getTicketAttachmentDownload,
  listTickets,
  updateTicketPriority,
  updateTicketStatus,
} from "../services/ticketService.js";

export async function createTicketHandler(request, response) {
  const result = await createTicket(
    request.user,
    request.validatedBody,
    request.files,
  );
  response.status(201).json(result);
}

export async function getTicketAttachmentDownloadHandler(request, response) {
  const downloadUrl = await getTicketAttachmentDownload(
    request.validatedParams.ticketId,
    request.validatedParams.attachmentId,
    request.user,
  );
  response.set("Cache-Control", "no-store");
  response.redirect(302, downloadUrl);
}

export async function listTicketsHandler(request, response) {
  const result = await listTickets(request.user, request.validatedQuery);
  response.status(200).json(result);
}

export async function getTicketHandler(request, response) {
  const ticket = await getTicket(request.validatedParams.ticketId, request.user);
  response.status(200).json({ ticket });
}

export async function assignTicketHandler(request, response) {
  const result = await assignTicket(
    request.validatedParams.ticketId,
    request.user,
    request.validatedBody.agentId,
  );
  response.status(200).json(result);
}

export async function claimTicketHandler(request, response) {
  const result = await claimTicket(request.validatedParams.ticketId, request.user);
  response.status(200).json(result);
}

export async function updateTicketStatusHandler(request, response) {
  const result = await updateTicketStatus(
    request.validatedParams.ticketId,
    request.user,
    request.validatedBody,
  );
  response.status(200).json(result);
}

export async function updateTicketPriorityHandler(request, response) {
  const ticket = await updateTicketPriority(
    request.validatedParams.ticketId,
    request.user,
    request.validatedBody.priority,
  );
  response.status(200).json({ ticket });
}
