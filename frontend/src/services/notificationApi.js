import { baseApi } from "./baseApi";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: "notifications",
        params: { page, limit },
      }),
      providesTags: (result) => [
        { type: "Notification", id: "LIST" },
        ...(result?.notifications ?? []).map((notification) => ({
          type: "Notification",
          id: notification._id,
        })),
      ],
    }),
    markNotificationRead: builder.mutation({
      query: ({ notificationId }) => ({
        url: `notifications/${notificationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: "notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationApi;
