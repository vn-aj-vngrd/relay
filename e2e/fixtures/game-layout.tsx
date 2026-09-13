import { createRoot } from "react-dom/client";
import { ApplicationTour } from "@/features/onboarding/application-tour";
import { PlayRosterSurface } from "@/features/sessions/play-roster-surface";

const params = new URLSearchParams(window.location.search);
const root = document.createElement("div");
document.body.append(root);
const cases: { name: string; className: string; emptyClassName?: string }[] =
  JSON.parse(document.querySelector("#layout-cases")?.textContent ?? "[]");
createRoot(root).render(
  params.get("mode") === "tour" ? (
    <ApplicationTour required />
  ) : (
    <>
      {cases.map((item) => (
        <div key={item.name} data-layout-case={item.name}>
          <div data-tab-edge style={{ height: 44, borderBottom: "1px solid" }}>
            Game tabs
          </div>
          <div className={item.className} data-tab-content>
            {item.name.endsWith("play/page") ? (
              <PlayRosterSurface status="published" count={1}>
                <p>Player roster</p>
              </PlayRosterSurface>
            ) : (
              <div data-first-content>
                {item.emptyClassName ? (
                  <section className={item.emptyClassName} data-payment-empty>
                    <div data-payment-message>Payments are for players</div>
                  </section>
                ) : (
                  "Tab content"
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {(["completed", "cancelled"] as const).map((status) => (
        <div key={status} data-ended-case={status}>
          <div data-recap-edge>Recap or cancellation</div>
          <PlayRosterSurface status={status} count={1}>
            Final players
          </PlayRosterSurface>
        </div>
      ))}
    </>
  )
);
