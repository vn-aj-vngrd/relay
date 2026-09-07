import { createRoot } from "react-dom/client";

import { SidebarCollapseToggle } from "../../src/components/shared/sidebar-collapse-toggle";
import { SidebarItemTooltip } from "../../src/components/shared/sidebar-item-tooltip";
import { IconTooltip } from "../../src/components/ui/icon-tooltip";

document.documentElement.dataset.sidebar = "compact";
const root = document.createElement("main");
document.body.append(root);
createRoot(root).render(
  <div style={{ padding: 32 }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <aside style={{ width: 48, height: 40, overflow: "hidden" }}>
        <button
          type="button"
          aria-label="Sidebar inbox"
          style={{ width: 36, height: 36 }}
        >
          Inbox<SidebarItemTooltip>Inbox</SidebarItemTooltip>
        </button>
      </aside>
      <IconTooltip label="More game actions" side="bottom">
        <button
          type="button"
          aria-label="More game actions"
          style={{ width: 36, height: 36 }}
        >
          …
        </button>
      </IconTooltip>
    </div>
    <div style={{ marginTop: 48 }}>
      <SidebarCollapseToggle />
    </div>
  </div>
);
