# Ticket messaging

The messaging API and Socket.IO events use the existing HttpOnly access cookie.
The Socket.IO server is attached to the Express HTTP server and checks the
access token, active user status, and password-change timestamp during the
handshake. Sockets are disconnected when the access token expires.

## Message history

`GET /api/v1/messages/:ticketId?page=1&limit=50` returns a chronological page
of messages. The API checks ticket access and assignment. Customers only receive
public messages for tickets they own. Agents must claim a ticket before reading
or sending messages; admins can access any ticket.

## Socket events

| Direction | Event | Purpose |
| --- | --- | --- |
| Client → server | `ticket:join` | Verify ticket access and join the public room; support staff also join the staff-only room. |
| Client → server | `ticket:leave` | Leave that ticket's rooms. |
| Client → server | `ticket:message:send` | Persist a public reply or staff-only internal note before broadcasting it. Acknowledgement includes the saved message. |
| Client → server | `ticket:typing` | Send a typing indicator to the ticket room or staff-only room. |
| Client → server | `ticket:read` | Persist read receipts for up to 100 message IDs in the joined ticket. |
| Server → client | `message:new` | Broadcast a saved public message to the ticket room or an internal note to staff only. |
| Server → client | `ticket:typing` | Notify other authorized room members that a participant is typing. |
| Server → client | `messages:read` | Deliver read receipts only to rooms authorized to view those messages. |

Internal notes are rejected for customers and are excluded from customer REST
queries and socket rooms. Customers can reply only while a ticket is open or
in progress; they must reopen an eligible resolved ticket first. Closed
tickets cannot receive new messages. Message text is trimmed and limited to
10,000 characters.

Run the API server normally with `npm run dev --workspace backend`; Socket.IO
shares its HTTP port, so no additional port is required. The frontend connects
to the origin from `NEXT_PUBLIC_API_URL` and includes credentials.
