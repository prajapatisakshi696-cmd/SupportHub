import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Mutex } from "async-mutex";
import { sessionAnonymous } from "../store/authSlice";

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1/";
const rawBaseQuery = fetchBaseQuery({
  baseUrl: baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  credentials: "include",
});
const refreshMutex = new Mutex();
const noRefreshUrls = [
  "auth/login",
  "auth/register",
  "auth/logout",
  "auth/refresh",
  "auth/forgot-password",
  "auth/reset-password",
];

async function baseQueryWithReauth(args, api, extraOptions) {
  await refreshMutex.waitForUnlock();
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === "string" ? args : args.url;

  if (
    result.error?.status === 401 &&
    !noRefreshUrls.some((path) => url.endsWith(path))
  ) {
    if (!refreshMutex.isLocked()) {
      const release = await refreshMutex.acquire();
      try {
        const refreshResult = await rawBaseQuery(
          { url: "auth/refresh", method: "POST" },
          api,
          extraOptions,
        );
        if (refreshResult.data) {
          result = await rawBaseQuery(args, api, extraOptions);
          if (result.error?.status === 401) {
            api.dispatch(sessionAnonymous());
          }
        } else {
          api.dispatch(sessionAnonymous());
        }
      } finally {
        release();
      }
    } else {
      await refreshMutex.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
      if (result.error?.status === 401) {
        api.dispatch(sessionAnonymous());
      }
    }
  }

  return result;
}

export const baseApi = createApi({
  reducerPath: "supportApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "CurrentUser",
    "Ticket",
    "AdminDashboard",
    "AgentDashboard",
    "CustomerDashboard",
    "Analytics",
    "Settings",
    "Message",
    "Notification",
    "Agent",
    "Category",
  ],
  endpoints: () => ({}),
});
