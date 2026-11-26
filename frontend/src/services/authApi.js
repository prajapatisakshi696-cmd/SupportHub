import { baseApi } from "./baseApi";
import { sessionAnonymous, sessionAuthenticated } from "../store/authSlice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({
        url: "auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CurrentUser"],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(sessionAuthenticated());
        } catch {
          return;
        }
      },
    }),
    login: builder.mutation({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CurrentUser"],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(sessionAuthenticated());
        } catch {
          return;
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({
        url: "auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["CurrentUser"],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(sessionAnonymous());
        } catch {
          return;
        }
      },
    }),
    getCurrentUser: builder.query({
      query: () => "auth/me",
      transformResponse: (response) => response.user,
      providesTags: ["CurrentUser"],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(sessionAuthenticated());
        } catch (error) {
          if (error?.error?.status === 401) {
            dispatch(sessionAnonymous());
          }
        }
      },
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: "auth/me",
        method: "PATCH",
        body,
      }),
      transformResponse: (response) => response.user,
      invalidatesTags: ["CurrentUser"],
    }),
    changePassword: builder.mutation({
      query: (body) => ({
        url: "auth/change-password",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CurrentUser"],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(sessionAnonymous());
        } catch {
          return;
        }
      },
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({
        url: "auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({
        url: "auth/reset-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
