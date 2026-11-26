import { baseApi } from "./baseApi";

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSlaSettings: builder.query({
      query: () => "settings/sla",
      transformResponse: (response) => response.settings,
      providesTags: ["Settings"],
    }),
    updateSlaSettings: builder.mutation({
      query: (body) => ({
        url: "settings/sla",
        method: "PATCH",
        body,
      }),
      transformResponse: (response) => response.settings,
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useGetSlaSettingsQuery,
  useUpdateSlaSettingsMutation,
} = settingsApi;
