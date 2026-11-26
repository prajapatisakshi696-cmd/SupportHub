import { listActiveAgents } from "../services/agentService.js";

export async function listActiveAgentsHandler(_request, response) {
  const agents = await listActiveAgents();
  response.status(200).json({
    agents: agents.map((agent) => ({
      id: String(agent._id),
      name: agent.name,
      email: agent.email,
    })),
  });
}
