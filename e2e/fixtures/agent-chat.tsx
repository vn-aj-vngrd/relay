import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ToastViewport } from "../../src/components/ui/action-notice";
import { AgentChat } from "../../src/features/agent/chat";
import { AgentSessionProvider } from "../../src/features/agent/session";

const root = document.getElementById("agent-fixture");
if (!root) throw new Error("Missing Agent fixture root");
function Fixture() {
  const [show, setShow] = useState(true);
  return (
    <AgentSessionProvider>
      <div className="flex h-full flex-col">
        <button
          className="shrink-0"
          type="button"
          onClick={() => setShow(!show)}
        >
          Toggle Agent page
        </button>
        <div className="min-h-0 flex-1">
          {show ? (
            <AgentChat
              available
              allowCourtSearch
              capabilities={{
                allowGameData: true,
                allowCourtSearch: true,
                allowHelp: true,
                allowGameCreation: true,
                allowGroupCreation: true,
              }}
            />
          ) : (
            <p>Another app page</p>
          )}
        </div>
      </div>
      <ToastViewport />
    </AgentSessionProvider>
  );
}
createRoot(root).render(
  <main className="h-dvh bg-canvas p-4 text-ink">
    <Fixture />
  </main>
);
