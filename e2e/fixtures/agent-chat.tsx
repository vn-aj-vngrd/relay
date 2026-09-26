import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ToastViewport } from "../../src/components/ui/action-notice";
import {
  AgentActivityContext,
  AgentMobileLink,
} from "../../src/features/agent/activity";
import { AgentChat } from "../../src/features/agent/chat";
import { AgentHistoryCollection } from "../../src/features/agent/history-collection";
import {
  AgentRuntimeContext,
  AgentSessionProvider,
  createAgentSession,
} from "../../src/features/agent/session";

const root = document.getElementById("agent-fixture");
if (!root) throw new Error("Missing Agent fixture root");
const router: AppRouterInstance = {
  bfcacheId: "fixture",
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  refresh: () => window.location.reload(),
  push: (href) => window.location.assign(href),
  replace: (href) => window.location.replace(href),
  prefetch: () => {},
};
function Fixture() {
  const [show, setShow] = useState(true);
  const [runtime] = useState(() => {
    const session = createAgentSession();
    return {
      get: () => session,
      subscribe: session.subscribe,
      snapshot: () => session.activity,
    };
  });
  useEffect(() => {
    const session = runtime.get();
    const acknowledge = () => {
      if (
        show &&
        session.activity !== "working" &&
        session.activity !== "idle"
      ) {
        session.activity = "idle";
        session.notify();
      }
    };
    acknowledge();
    return session.subscribe(acknowledge);
  }, [show, runtime]);
  return (
    <AgentActivityContext value={runtime}>
      <AgentRuntimeContext value={runtime}>
        <div className="flex h-full flex-col">
          <AgentMobileLink />
          <button
            className="shrink-0"
            type="button"
            onClick={() => setShow(!show)}
          >
            Toggle Agent page
          </button>
          <div className="min-h-0 flex-1">
            {show ? (
              <AgentSessionProvider userId="fixture-user">
                {window.location.pathname === "/agent/history" ? (
                  <AgentHistoryCollection />
                ) : (
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
                )}
              </AgentSessionProvider>
            ) : (
              <p>Another app page</p>
            )}
          </div>
        </div>
        <ToastViewport />
      </AgentRuntimeContext>
    </AgentActivityContext>
  );
}
createRoot(root).render(
  <AppRouterContext.Provider value={router}>
    <main className="h-dvh bg-canvas p-4 text-ink">
      <Fixture />
    </main>
  </AppRouterContext.Provider>
);
