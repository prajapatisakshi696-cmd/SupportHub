"use client";

import { useGetCurrentUserQuery } from "../../../services/authApi";

export default function SessionBootstrap() {
  useGetCurrentUserQuery();
  return null;
}
