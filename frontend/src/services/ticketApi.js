import { baseApi } from "./baseApi";

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query({
      query: (params) => ({ url: "tickets", params }),
      providesTags: (result) => [
        { type: "Ticket", id: "LIST" },
        ...(result?.tickets ?? []).map((ticket) => ({
          type: "Ticket",
          id: ticket._id,
        })),
      ],
    }),
    getTicket: builder.query({
      query: ({ ticketId }) => `tickets/${ticketId}`,
      transformResponse: (response) => response.ticket,
      providesTags: (_result, _error, { ticketId }) => [
        { type: "Ticket", id: ticketId },
      ],
    }),
    getTicketMessages: builder.query({
      query: ({ ticketId, page = 1, limit = 50 }) => ({
        url: `messages/${ticketId}`,
        params: { page, limit },
      }),
      providesTags: (result, _error, { ticketId }) => [
        { type: "Message", id: `TICKET-${ticketId}` },
        ...(result?.messages ?? []).map((message) => ({
          type: "Message",
          id: message._id,
        })),
      ],
    }),
    createTicket: builder.mutation({
      query: (body) => ({
        url: "tickets",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Ticket", id: "LIST" },
        "AdminDashboard",
        "AgentDashboard",
        "CustomerDashboard",
        "Analytics",
      ],
    }),
    assignTicket: builder.mutation({
      query: ({ ticketId, agentId }) => ({
        url: `tickets/${ticketId}/assign`,
        method: "POST",
        body: { agentId },
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: "Ticket", id: ticketId },
        { type: "Ticket", id: "LIST" },
        "AdminDashboard",
        "AgentDashboard",
        "CustomerDashboard",
        "Analytics",
      ],
    }),
    claimTicket: builder.mutation({
      query: ({ ticketId }) => ({
        url: `tickets/${ticketId}/claim`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: "Ticket", id: ticketId },
        { type: "Ticket", id: "LIST" },
        "AdminDashboard",
        "AgentDashboard",
        "CustomerDashboard",
        "Analytics",
      ],
    }),
    updateTicketStatus: builder.mutation({
      query: ({ ticketId, status, note }) => ({
        url: `tickets/${ticketId}/status`,
        method: "PATCH",
        body: { status, note },
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: "Ticket", id: ticketId },
        { type: "Ticket", id: "LIST" },
        "AdminDashboard",
        "AgentDashboard",
        "CustomerDashboard",
        "Analytics",
      ],
    }),
    updateTicketPriority: builder.mutation({
      query: ({ ticketId, priority }) => ({
        url: `tickets/${ticketId}/priority`,
        method: "PATCH",
        body: { priority },
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: "Ticket", id: ticketId },
        { type: "Ticket", id: "LIST" },
        "AdminDashboard",
        "AgentDashboard",
        "CustomerDashboard",
        "Analytics",
      ],
    }),
    getAdminDashboard: builder.query({
      query: () => "dashboard/admin",
      providesTags: ["AdminDashboard"],
    }),
    getAdminAnalytics: builder.query({
      query: ({ days = 30 } = {}) => ({
        url: "analytics/admin",
        params: { days },
      }),
      providesTags: ["Analytics"],
    }),
    getAgentDashboard: builder.query({
      query: () => "dashboard/agent",
      providesTags: ["AgentDashboard"],
    }),
    getCustomerDashboard: builder.query({
      query: () => "dashboard/customer",
      providesTags: ["CustomerDashboard"],
    }),
    getActiveAgents: builder.query({
      query: () => "agents",
      transformResponse: (response) => response.agents,
      providesTags: ["Agent"],
    }),
    getActiveCategories: builder.query({
      query: () => "categories",
      transformResponse: (response) => response.categories,
      providesTags: ["Category"],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useGetTicketMessagesQuery,
  useCreateTicketMutation,
  useAssignTicketMutation,
  useClaimTicketMutation,
  useUpdateTicketStatusMutation,
  useUpdateTicketPriorityMutation,
  useGetAdminDashboardQuery,
  useGetAdminAnalyticsQuery,
  useGetAgentDashboardQuery,
  useGetCustomerDashboardQuery,
  useGetActiveAgentsQuery,
  useGetActiveCategoriesQuery,
} = ticketApi;
