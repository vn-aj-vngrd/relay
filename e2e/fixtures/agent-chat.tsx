import { createRoot } from "react-dom/client";
import { AgentChat } from "../../src/features/agent/chat";

const root = document.getElementById("agent-fixture");
if (!root) throw new Error("Missing Agent fixture root");
createRoot(root).render(
  <main className="min-h-dvh bg-canvas p-4 text-ink">
    <AgentChat available />
  </main>
);
