import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    sessionStatus: "unknown",
  },
  reducers: {
    sessionAuthenticated(state) {
      state.sessionStatus = "authenticated";
    },
    sessionAnonymous(state) {
      state.sessionStatus = "anonymous";
    },
  },
});

export const { sessionAnonymous, sessionAuthenticated } = authSlice.actions;
export const selectSessionStatus = (state) => state.auth.sessionStatus;
export default authSlice.reducer;
