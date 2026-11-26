import User from "../models/User.js";

export async function listActiveAgents() {
  return User.find({ role: "agent", status: "active" })
    .select("name email")
    .sort({ name: 1 })
    .lean();
}
